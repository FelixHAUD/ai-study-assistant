import "@aws-amplify/ui-react/styles.css";

import { useEffect, useState } from "react";
import { FileUploader } from "@aws-amplify/ui-react-storage";
import Analysis from "./components/Analysis/Analysis";
import AudioRecorder from "./components/AudioRecorder/AudioRecorder";

// Steps in the flow
// 1. upload, 2. question, 3. record, 4. feedback, 5. done

type Step = "upload" | "question" | "record" | "feedback" | "done";

async function generateQuestions() {
  return [
    "What is the main idea of the uploaded document?",
    "Summarize the key findings in your own words.",
    "How could you apply this information in a real-world scenario?",
  ];
}

function App() {
  const [step, setStep] = useState<Step>("upload");
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [transcription, setTranscription] = useState<string>("");
  const [hasAnyFiles, setHasAnyFiles] = useState<boolean>(false);

  // Simulate question generation after file upload
  const handleGenerateQuestions = async () => {
    // setFileUploaded(true);
    const questions = await generateQuestions();
    setQuestions(questions);
    setStep("question");
  };

  const checkHasAnyFile = async () => {
    // checks if ther are any files in the S3 bucket
    setHasAnyFiles(true);
  };

  // When user clicks "Record Answer"
  const handleStartRecording = () => {
    setTranscription("");
    setStep("record");
  };

  // When transcript is ready (after recording)
  const handleTranscriptionComplete = (text: string) => {
    setTranscription(text);
  };

  // When user clicks "Receive Feedback"
  const handleGetFeedback = () => {
    setStep("feedback");
    // Save the answer for this question
    const updated = [...answers];
    updated[currentIdx] = transcription;
    setAnswers(updated);
  };

  // When user clicks "Next Question"
  const handleNextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      // There are still questions to be asked
      setCurrentIdx(currentIdx + 1);
      setTranscription(answers[currentIdx + 1] || "");
      setStep("question");
    } else {
      setStep("done");
    }
  };

  // When user clicks "Start Over"
  const handleStartOver = () => {
    setStep("upload");
    setQuestions([]);
    setCurrentIdx(0);
    setAnswers([]);
    setTranscription("");
    // setFileUploaded(false);
  };

  useEffect(() => {
    async function startUp() {
      checkHasAnyFile();
    }

    startUp();
  }, []);

  return (
    <main>
      {step === "upload" && (
        <div>
          <FileUploader
            acceptedFileTypes={[
              "application/pdf",
              "text/plain",
              "application/msword",
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ]}
            path="notes/"
            maxFileCount={1}
            isResumable
            onUploadSuccess={handleGenerateQuestions}
          />
          <div style={{ marginTop: "2rem", textAlign: "center" }}>
            {hasAnyFiles && (
              <button onClick={handleGenerateQuestions}>
                Use Past Uploaded Notes
              </button>
            )}
          </div>
        </div>
      )}
      {step === "question" && questions.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h2>
            Question {currentIdx + 1} of {questions.length}
          </h2>
          <p style={{ fontSize: "1.2rem", fontWeight: 500 }}>
            {questions[currentIdx]}
          </p>
          <button style={{ marginTop: 24 }} onClick={handleStartRecording}>
            Record Answer
          </button>
        </div>
      )}
      {step === "record" && (
        <div style={{ marginTop: "2rem" }}>
          <h2>
            Question {currentIdx + 1} of {questions.length}
          </h2>
          <p style={{ fontSize: "1.2rem", fontWeight: 500 }}>
            {questions[currentIdx]}
          </p>
          <AudioRecorder
            onTranscriptionComplete={handleTranscriptionComplete}
            onGetRating={handleGetFeedback}
          />
        </div>
      )}
      {step === "feedback" && (
        <div style={{ marginTop: "2rem" }}>
          <h2>
            Question {currentIdx + 1} of {questions.length}
          </h2>
          <p style={{ fontSize: "1.2rem", fontWeight: 500 }}>
            {questions[currentIdx]}
          </p>
          <Analysis text={transcription} onContinue={handleNextQuestion} />
        </div>
      )}
      {step === "done" && (
        <div style={{ marginTop: "2rem" }}>
          <h2>Practice Complete!</h2>
          <p>You have answered all questions. Great job!</p>
          <button onClick={handleStartOver}>Start Over</button>
        </div>
      )}
    </main>
  );
}

export default App;
