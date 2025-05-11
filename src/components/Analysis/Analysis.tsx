import { Button, Message, Placeholder, Rating } from "@aws-amplify/ui-react";
import "./Analysis.css";
import { useEffect, useState } from "react";

import type { Schema } from "../../../amplify/data/resource";
import { generateClient } from "aws-amplify/data";

const client = generateClient<Schema>();

type Rating = {
  score: number;
  message: string; // What you did well
  improvements: string[]; // 3 Improvements
};

async function rateText(text: string): Promise<Rating | null> {
  // using await AI returns a plain text with delimiters

  const response = await client.queries.rateResponse({
    text: text,
  });

  return response.data ? response.data : null;
}

type AnalysisProps = {
  text: string;
  onContinue: () => void;
};

function Analysis({ text, onContinue }: AnalysisProps) {
  const [rating, setRating] = useState<Rating | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const responseRating = await rateText(text);
      setRating(responseRating);
      setLoading(false);
    }

    fetchData();
  }, [text]);

  if (loading || !rating) {
    return (
      <div>
        <h2>Overall Rating</h2>
        <Placeholder />
        <h2>Feedback Summary</h2>
        <Placeholder />
        <h2>Feedback Summary</h2>
        <h2>Areas for Improvement</h2>
        <div className="improvements-container">
          {Array(3).map((text, idx) => (
            <Message key={idx} variation="plain" colorTheme="info">
              {text}
            </Message>
          ))}
        </div>
      </div>
    );
  }

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
      <Button onClick={onContinue}>Continue</Button>
    </div>
  );
}

export default Analysis;
