import "@aws-amplify/ui-react/styles.css";

import { useState } from "react";
import { FileUploader } from "@aws-amplify/ui-react-storage";
import Analysis from "./components/Analysis/Analysis";
import AudioRecorder from "./components/AudioRecorder/AudioRecorder";
import { Button, Flex, Text } from "@aws-amplify/ui-react";

// Steps in the flow
// 1. upload, 2. question, 3. record, 4. feedback, 5. done

import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";

const client = generateClient<Schema>();

type Step = "upload" | "question" | "record" | "feedback" | "done";

interface UploadedFile {
  key: string;
  name: string;
  size: number;
  lastModified: Date;
}

function App() {
  const [step, setStep] = useState<Step>("upload");
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [transcription, setTranscription] = useState<string>("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploadComplete, setIsUploadComplete] = useState<boolean>(false);

  const handleGenerateQuestions = async () => {
    try {
      // Get the content of the first uploaded file
      const file = uploadedFiles[0];
      if (!file) {
        throw new Error("No files uploaded");
      }

      const questions = await client.queries.getQuestions({
        localPath: uploadedFiles.map((file) => file.key),
      });

      if (!questions.data) {
        throw questions.errors;
      }

      // Assuming the response contains an array of questions
      setQuestions(
        questions.data || [
          "What is the main idea of the uploaded document?",
          "Summarize the key findings in your own words.",
          "How could you apply this information in a real-world scenario?",
        ]
      );
      setStep("question");
    } catch (error) {
      console.error("Error generating questions:", error);
      // Fallback to default questions if the API call fails
      setQuestions([
        "What is the main idea of the uploaded document?",
        "Summarize the key findings in your own words.",
        "How could you apply this information in a real-world scenario?",
      ]);
      setStep("question");
    }
  };

  const canSupportSpeech =
    "SpeechRecognition" in window || "webkitSpeechRecognition" in window;

  const handleFileUpload = (file: { key: string }) => {
    setUploadedFiles((prev) => [
      ...prev,
      {
        key: file.key,
        name: file.key.split("/").pop() || "Unknown file",
        size: 0, // We don't have access to the actual file size
        lastModified: new Date(),
      },
    ]);
    setIsUploadComplete(true);
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
    setUploadedFiles([]);
    setIsUploadComplete(false);
  };

  if (!canSupportSpeech) {
    return (
      <Flex justifyContent="center" alignItems="center" height="100vh">
        <Text>Your browser doesn't support speech to text. </Text>
      </Flex>
    );
  }

  return (
    <Flex direction="column" height="100vh" backgroundColor="white">
      <Flex
        direction="column"
        flex="1"
        overflow="auto"
        padding="2rem"
        gap="1.5rem"
      >
        {step === "upload" && (
          <Flex
            direction="column"
            gap="2rem"
            width="100%"
            maxWidth="800px"
            margin="0 auto"
          >
            <Text fontSize="2rem" fontWeight="bold">
              Welcome to ConceptBridge
            </Text>
            <Text fontSize="1.2rem">
              Upload your study materials to get started
            </Text>

            <FileUploader
              acceptedFileTypes={[
                "application/pdf",
                "text/plain",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              ]}
              path="notes/"
              maxFileCount={5}
              isResumable
              onUploadSuccess={(file) => {
                if (file.key) {
                  handleFileUpload(file as { key: string });
                } else {
                  console.error("File upload failed: No key provided");
                }
              }}
            />

            {uploadedFiles.length > 0 && (
              <Flex direction="column" gap="1rem">
                <Text fontSize="1.2rem" fontWeight="bold">
                  Uploaded Files:
                </Text>
                {uploadedFiles.map((file, index) => (
                  <Flex
                    key={index}
                    padding="1rem"
                    backgroundColor="#f8f9fa"
                    borderRadius="8px"
                    justifyContent="space-between"
                    alignItems="center"
                    border="1px solid #e9ecef"
                  >
                    <Text>{file.name}</Text>
                    <Text color="#6c757d" fontSize="0.9rem">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </Text>
                  </Flex>
                ))}
              </Flex>
            )}

            {isUploadComplete && (
              <Button
                onClick={handleGenerateQuestions}
                variation="primary"
                width="100%"
                marginTop="1rem"
              >
                Generate Questions
              </Button>
            )}
          </Flex>
        )}

        {step === "question" && questions.length > 0 && (
          <Flex
            direction="column"
            gap="2rem"
            width="100%"
            maxWidth="800px"
            margin="0 auto"
          >
            <Text fontSize="1.5rem" fontWeight="bold">
              Question {currentIdx + 1} of {questions.length}
            </Text>
            <Text fontSize="1.2rem">{questions[currentIdx]}</Text>
            <Button
              onClick={handleStartRecording}
              variation="primary"
              width="100%"
            >
              Record Answer
            </Button>
          </Flex>
        )}

        {step === "record" && (
          <Flex
            direction="column"
            gap="2rem"
            width="100%"
            maxWidth="800px"
            margin="0 auto"
          >
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
          <Flex
            direction="column"
            gap="2rem"
            width="100%"
            maxWidth="800px"
            margin="0 auto"
          >
            <Text fontSize="1.5rem" fontWeight="bold">
              Question {currentIdx + 1} of {questions.length}
            </Text>
            <Text fontSize="1.2rem">{questions[currentIdx]}</Text>
            <Analysis text={transcription} onContinue={handleNextQuestion} />
          </Flex>
        )}

        {step === "done" && (
          <Flex
            direction="column"
            gap="2rem"
            width="100%"
            maxWidth="800px"
            margin="0 auto"
            alignItems="center"
          >
            <Text fontSize="2rem" fontWeight="bold">
              Practice Complete!
            </Text>
            <Text>You have answered all questions. Great job!</Text>
            <Button
              onClick={handleStartOver}
              variation="primary"
              width="100%"
              maxWidth="400px"
            >
              Start Over
            </Button>
          </Flex>
        )}
      </Flex>
    </Flex>
  );
}

export default App;
