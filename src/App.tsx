import "@aws-amplify/ui-react/styles.css";

import { useState } from "react";
import { FileUploader } from "@aws-amplify/ui-react-storage";
import Analysis from "./components/Analysis/Analysis";
import AudioRecorder from "./components/AudioRecorder/AudioRecorder";

type State = "recording" | "rating";

function App() {
  const [state, setState] = useState<State>("recording");
  const [transcription, setTranscription] = useState("");

  const handleTranscriptionComplete = (text: string) => {
    setTranscription(text);
  };

  function handleGetRating() {
    setState("rating");
  }

  function handleContinue() {
    setTranscription("");
    setState("recording");
  }

  return (
    <main>
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
        />
      </div>
      <div style={{ height: "2rem" }} />
      <div>
        {state === "recording" && (
          <AudioRecorder
            onTranscriptionComplete={handleTranscriptionComplete}
            onGetRating={handleGetRating}
          />
        )}
        {state === "rating" && (
          <Analysis text={transcription} onContinue={handleContinue} />
        )}
      </div>
    </main>
  );
}

export default App;
