import { useState, useRef, useEffect } from "react";
import { Button, Flex, Text, TextAreaField, Loader } from "@aws-amplify/ui-react";
import { TranscribeStreamingClient, StartStreamTranscriptionCommand } from "@aws-sdk/client-transcribe-streaming";
import "./AudioRecorder.css";

type RecordingState = "idle" | "recording" | "processing" | "transcribing" | "completed";

interface AudioRecorderProps {
  onTranscriptionComplete?: (text: string) => void;
}

function AudioRecorder({ onTranscriptionComplete }: AudioRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [transcription, setTranscription] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

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
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setRecordingState("recording");
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Error accessing microphone. Please ensure you have granted permission.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === "recording") {
      mediaRecorderRef.current.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const restartRecording = () => {
    setRecordingState("idle");
    setTranscription("");
    audioChunksRef.current = [];
  };

  const processAudio = async (audioBlob: Blob) => {
    setRecordingState("transcribing");
    // TODO: Implement AWS Transcribe streaming
    // This is where we'll integrate with AWS Transcribe
    // For now, we'll simulate transcription
    setTimeout(() => {
      const simulatedTranscription = "This is a simulated transcription. AWS Transcribe integration will be implemented here.";
      setTranscription(simulatedTranscription);
      setRecordingState("completed");
      // Call the callback with the transcription
      onTranscriptionComplete?.(simulatedTranscription);
    }, 2000);
  };

  const handleTranscriptionEdit = (newText: string) => {
    setTranscription(newText);
    // Also update the parent component when the transcription is edited
    onTranscriptionComplete?.(newText);
  };

  return (
    <div className="audio-recorder">
      <Flex direction="column" gap="1rem" padding="1rem">
        <Text fontSize="1.5rem" fontWeight="bold" className="audio-recorder-title">Audio Recorder</Text>
        
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

        {recordingState === "completed" && (
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
                <Button className="edit-transcription-btn" variation="link" onClick={() => setIsEditing(true)}>
                  Edit Transcription
                </Button>
              )}
              {isEditing && (
                <Button className="edit-transcription-btn" variation="link" onClick={() => setIsEditing(false)}>
                  Done Editing
                </Button>
              )}
              <Button className="receive-feedback-btn" variation="primary" onClick={() => {}}>
                Receive Feedback
              </Button>
            </Flex>
          </div>
        )}
      </Flex>
    </div>
  );
}

export default AudioRecorder;
