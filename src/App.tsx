import "@aws-amplify/ui-react/styles.css";

import { useState } from "react";
import { FileUploader } from "@aws-amplify/ui-react-storage";
import Analysis from "./components/Analysis/Analysis";
import AudioRecorder from "./components/AudioRecorder/AudioRecorder";

type State = "recording" | "rating";

function App() {
  const [state, setState] = useState<State>("rating");

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
      <div>
        {state === "rating" && <Analysis text="hello" />}
        {state === "recording" && <AudioRecorder />}
      </div>
    </main>
  );
}

export default App;
