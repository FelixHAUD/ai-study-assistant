import "@aws-amplify/ui-react/styles.css";

import { useEffect, useState } from "react";
import { FileUploader } from "@aws-amplify/ui-react-storage";
import Analysis from "./components/Analysis/Analysis";
import AudioRecorder from "./components/AudioRecorder/AudioRecorder";
import { Button, Flex, Text } from "@aws-amplify/ui-react";

import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";

const client = generateClient<Schema>();

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
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check for existing files on component mount
  useEffect(() => {
    async function checkForFiles() {
      try {
        const response = await client.queries.anyFiles();
        setHasAnyFiles(response.data ?? false);
      } catch (error) {
        console.error("Error checking for files:", error);
        setHasAnyFiles(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkForFiles();
  }, []);

  // Simulate question generation after file upload
  const handleGenerateQuestions = async () => {
    const questions = await generateQuestions();
    setQuestions(questions);
    setStep("question");
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
  };

  if (isLoading) {
    return (
      <Flex justifyContent="center" alignItems="center" height="100vh">
        <Text>Loading...</Text>
      </Flex>
    );
  }

  return (
    <main>
      {step === "upload" && (
        <Flex direction="column" gap="2rem" padding="2rem">
          <Text fontSize="2rem" fontWeight="bold">
            Welcome to ConceptBridge, your AI-powered study assistant
          </Text>
          <Text fontSize="1.2rem">
            Upload your notes and let ConceptBridge help you understand them.
          </Text>
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
          {hasAnyFiles && (
            <Flex direction="column" gap="1rem" alignItems="center">
              <Text>Or use a previously uploaded file:</Text>
              <Button onClick={handleGenerateQuestions}>
                Use Past Uploaded Notes
              </Button>
            </Flex>
          )}
        </Flex>
      )}

      {step === "question" && questions.length > 0 && (
        <Flex direction="column" gap="2rem" padding="2rem">
          <Text fontSize="1.5rem" fontWeight="bold">
            Question {currentIdx + 1} of {questions.length}
          </Text>
          <Text fontSize="1.2rem">{questions[currentIdx]}</Text>
          <Button onClick={handleStartRecording} variation="primary">
            Record Answer
          </Button>
        </Flex>
      )}

      {step === "record" && (
        <Flex direction="column" gap="2rem" padding="2rem">
          <Text fontSize="1.5rem" fontWeight="bold">
            Question {currentIdx + 1} of {questions.length}
          </Text>
          <Text fontSize="1.2rem">{questions[currentIdx]}</Text>
          <AudioRecorder
            onTranscriptionComplete={handleTranscriptionComplete}
            onGetRating={handleGetFeedback}
          />
        </Flex>
      )}

      {step === "feedback" && (
        <Flex direction="column" gap="2rem" padding="2rem">
          <Text fontSize="1.5rem" fontWeight="bold">
            Question {currentIdx + 1} of {questions.length}
          </Text>
          <Text fontSize="1.2rem">{questions[currentIdx]}</Text>
          <Analysis text={transcription} onContinue={handleNextQuestion} />
        </Flex>
      )}

      {step === "done" && (
        <Flex direction="column" gap="2rem" padding="2rem" alignItems="center">
          <Text fontSize="2rem" fontWeight="bold">
            Practice Complete!
          </Text>
          <Text>You have answered all questions. Great job!</Text>
          <Button onClick={handleStartOver} variation="primary">
            Start Over
          </Button>
        </Flex>
      )}
    </main>
  );
}

export default App;
