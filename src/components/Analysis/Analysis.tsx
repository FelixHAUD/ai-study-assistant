import { Message, Rating } from "@aws-amplify/ui-react";
import "./Analysis.css";
import { useEffect, useState } from "react";

type Rating = {
  score: number;
  message: string; // What you did well
  improvements: string[]; // 3 Improvements
};

async function rateText(text: string): Promise<Rating> {
  // using await AI returns a plain text with delimiters

  console.log("AI rates text and returns a JSON");

  const response = JSON.stringify({
    score: 10,
    message:
      "Your explanation was clear and well-structured. You demonstrated good understanding of the material and articulated key points effectively.",
    improvements: [
      "Consider adding more depth to your explanation of the theoretical framework",
      "Try to use more domain-specific terminology where appropriate",
      "Your explanation could benefit from a stronger conclusion that ties concepts together",
    ],
  });
  return JSON.parse(response);
}

type AnalysisProps = {
  text: string;
};

function Analysis({ text }: AnalysisProps) {
  const [rating, setRating] = useState<Rating>({
    score: 0,
    message: "",
    improvements: [],
  });

  useEffect(() => {
    async function fetchData() {
      const responseRating = await rateText(text);
      setRating(responseRating);
    }

    fetchData();
  }, [text]);

  return (
    <div>
      <h2>Overall Rating</h2>
      <Rating
        value={rating.score}
        maxValue={10}
        fillColor="hsl(300, 95%, 30%)"
        emptyColor="hsl(210, 5%, 94%)"
      />
      <h2>Feedback Summary</h2>
      <Message variation="filled" colorTheme="neutral">
        {rating.message}
      </Message>
      <h2>Areas for Improvement</h2>
      <div className="improvements-container">
        {rating.improvements.map((text, idx) => (
          <Message key={idx} variation="plain" colorTheme="info">
            {text}
          </Message>
        ))}
      </div>
    </div>
  );
}

export default Analysis;
