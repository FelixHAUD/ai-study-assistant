import "@aws-amplify/ui-react/styles.css";

import { useState } from "react";
import { FileUploader } from "@aws-amplify/ui-react-storage";
import Analysis from "./components/Analysis/Analysis";
import AudioRecorder from "./components/AudioRecorder/AudioRecorder";
import { Button, Flex, Text } from "@aws-amplify/ui-react";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Steps in the flow
// 1. upload, 2. question, 3. record, 4. feedback, 5. done

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result.split(",")[1]); // Remove "data:application/pdf;base64," prefix
      } else {
        reject("Unexpected result type");
      }
    };

    reader.onerror = reject;

    reader.readAsDataURL(file); // Reads as base64
  });
}

type Step = "upload" | "question" | "record" | "feedback" | "done";

interface UploadedFile {
  key: string;
  name: string;
  size: number;
  lastModified: Date;
}

async function getQuestions(localPaths: string[]) {
  const content: string[] = [];
  const s3Client = new S3Client({
    region: "us-west-2",
    credentials: {
      accessKeyId: "AKIA6ODU2DW6TI6JDBKN",
      secretAccessKey: "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",
    },
  });
  for (const path of localPaths) {
    try {
      // Generate presigned URL
      const command = new GetObjectCommand({
        Bucket:
          "amplify-amplifyvitereactt-amplifyteamdrivebucket28-2j1zgywqwfjv",
        Key: path,
      });

      const presignedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 3600, // URL expires in 1 hour
      });

      // Fetch file content using presigned URL
      const fileContent = await fetch(presignedUrl).then((res) => res.blob());
      const base64Content = await fileToBase64(fileContent);

      content.push(base64Content);
    } catch (error) {
      console.error(`Error processing file ${path}:`, error);
      throw new Error(`Failed to process file ${path}`);
    }
  }
  try {
    const response = await fetch(
      "https://qkhr2j5d52.execute-api.us-west-2.amazonaws.com/filequery",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt:
            "Based on the provided content, generate a list of 5 thought-provoking study questions that focus on understanding key concepts. Format your response strictly as a JSON array of strings, without any additional text or formatting. Ensure the JSON is valid and does not include newline characters.",
          filename: "something.txt",
          file_content_base64: content.join(),
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to generate questions");
    }

    const data = await response.json();

    return JSON.parse(data.output);
  } catch (error) {
    console.error("Error generating questions:", error);
    throw error;
  }
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

      const questions = await getQuestions(
        uploadedFiles.map((file) => file.key)
      );

      // Assuming the response contains an array of questions
      setQuestions(
        questions || [
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
                "text/plain",
                "text/markdown",
                "text/x-markdown",
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
            <Analysis
              text={transcription}
              question={questions[currentIdx]}
              onContinue={handleNextQuestion}
            />
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
