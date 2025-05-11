import { useState, useRef, useEffect } from "react";
import {
  Button,
  Flex,
  Text,
  Loader,
} from "@aws-amplify/ui-react";
import { uploadData } from "@aws-amplify/storage";
import "./AudioRecorder.css";

// Add Web Speech API type definitions
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  interpretation: any;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionError extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionError) => void;
  onend: () => void;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
  prototype: SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

type RecordingState =
  | "idle"
  | "recording"
  | "processing"
  | "transcribing"
  | "completed";

interface AudioRecorderProps {
  onTranscriptionComplete?: (text: string) => void;
  onGetRating: () => void;
}

function AudioRecorder({
  onTranscriptionComplete,
  onGetRating,
}: AudioRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [transcription, setTranscription] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef<string>("");

  useEffect(() => {
    if (recordingState === "recording") {
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recordingState]);

  useEffect(() => {
    if (recordingState === "recording" && streamRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 1024;
      source.connect(analyserRef.current);
      const dataArray = new Uint8Array(analyserRef.current.fftSize);
      let animationId: number;
      const drawWaveform = () => {
        if (analyserRef.current && canvasRef.current) {
          analyserRef.current.getByteTimeDomainData(dataArray);
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            const sliceWidth = canvas.width / dataArray.length;
            let x = 0;
            for (let i = 0; i < dataArray.length; i++) {
              const v = dataArray[i] / 128.0;
              const y = (v * canvas.height) / 2;
              if (i === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
              x += sliceWidth;
            }
            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.strokeStyle = "#7b2ff2";
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
        animationId = requestAnimationFrame(drawWaveform);
      };
      drawWaveform();
      return () => {
        cancelAnimationFrame(animationId);
        analyserRef.current?.disconnect();
        if (audioContextRef.current?.state !== 'closed') {
          audioContextRef.current?.close();
        }
      };
    }
  }, [recordingState]);

  useEffect(() => {
    if (recordingState === "processing" && audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      setAudioUrl(URL.createObjectURL(audioBlob));
    }
    if (recordingState === "idle" || recordingState === "recording") {
      setAudioUrl(null);
    }
  }, [recordingState]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setRecordingState("processing");
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        await processAudio(audioBlob);
      };

      // Initialize speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscriptRef.current += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          const fullTranscript = finalTranscriptRef.current + interimTranscript;
          setTranscription(fullTranscript);
          onTranscriptionComplete?.(fullTranscript);
        };

        recognition.onerror = (event: SpeechRecognitionError) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'no-speech') {
            // Restart recognition if no speech is detected
            recognition.stop();
            recognition.start();
          }
        };

        recognition.onend = () => {
          // Restart recognition if it ends unexpectedly
          if (recordingState === 'recording') {
            recognition.start();
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      }

      mediaRecorder.start();
      setRecordingState("recording");
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert(
        "Error accessing microphone. Please ensure you have granted permission."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === "recording") {
      mediaRecorderRef.current.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      // Stop speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      // Clean up audio context
      analyserRef.current?.disconnect();
      audioContextRef.current?.close();
    }
  };

  const restartRecording = () => {
    setRecordingState("idle");
    setTranscription("");
    finalTranscriptRef.current = "";
    audioChunksRef.current = [];
  };

  const processAudio = async (audioBlob: Blob) => {
    setRecordingState("transcribing");
    const audioUrl = URL.createObjectURL(audioBlob);
    
    try {
      // Upload to S3
      const key = `audio-recordings/${Date.now()}.webm`;
      console.log('Uploading audio to S3:', key);
      await uploadData({
        path: key,
        data: audioBlob,
        options: {
          contentType: 'audio/webm'
        }
      });
      console.log('Audio uploaded successfully to S3');
      setRecordingState("completed");
    } catch (error) {
      console.error('Failed to upload audio to S3:', error);
      throw error;
    } finally {
      URL.revokeObjectURL(audioUrl);
    }
  };

  const handleTranscriptionEdit = (newText: string) => {
    setTranscription(newText);
    // Also update the parent component when the transcription is edited
    onTranscriptionComplete?.(newText);
  };

  return (
    <div className="audio-recorder">
      <Flex direction="column" gap="1rem" padding="1rem">
        <Text
          fontSize="1.5rem"
          fontWeight="bold"
          className="audio-recorder-title"
        >
          Audio Recorder
        </Text>

        {recordingState === "idle" && (
          <Button onClick={startRecording} variation="primary">
            Start Recording
          </Button>
        )}

        {recordingState === "recording" && (
          <div className="recording-controls">
            <div className="recording-animation">
              <span className="recording-dot" />
              <Text className="recording-text">Recording...</Text>
            </div>
            <div className="recorder-info-row">
              <span className="recorder-timer">{String(Math.floor(duration / 60)).padStart(2, '0')}:{String(duration % 60).padStart(2, '0')}</span>
              <canvas
                ref={canvasRef}
                width={240}
                height={48}
                className="waveform-canvas"
              />
            </div>
            <Button onClick={stopRecording} variation="destructive">
              Stop Recording
            </Button>
            <Button onClick={restartRecording} variation="link">
              Restart
            </Button>
          </div>
        )}

        {recordingState === "processing" && (
          <div className="audio-loader-container">
            <Loader variation="linear" />
            <Text>Processing audio...</Text>
          </div>
        )}

        {recordingState === "transcribing" && (
          <div className="audio-loader-container">
            <Loader variation="linear" />
            <Text>Transcribing audio...</Text>
          </div>
        )}

        {(recordingState === "recording" || recordingState === "completed") && (
          <div className="transcription-container">
            <Flex direction="column" gap="1rem">
              <Text className="transcription-label">Transcription</Text>
              <textarea
                value={transcription}
                onChange={(e) => handleTranscriptionEdit(e.target.value)}
                rows={8}
                className="transcription-textarea"
                readOnly={!isEditing}
              />
              {!isEditing && (
                <Button
                  className="edit-transcription-btn"
                  variation="link"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Transcription
                </Button>
              )}
              {isEditing && (
                <Button
                  className="edit-transcription-btn"
                  variation="link"
                  onClick={() => setIsEditing(false)}
                >
                  Done Editing
                </Button>
              )}
              <Button
                className="receive-feedback-btn"
                variation="primary"
                onClick={onGetRating}
              >
                Receive Feedback
              </Button>
            </Flex>
          </div>
        )}

        {recordingState === "completed" && audioUrl && (
          <div style={{ marginBottom: '1rem' }}>
            <audio controls src={audioUrl} style={{ width: '100%' }} />
          </div>
        )}
      </Flex>
    </div>
  );
}

export default AudioRecorder;
