import { Button, Message, Placeholder, Rating } from "@aws-amplify/ui-react";
import "./Analysis.css";
import { useEffect, useState } from "react";

type Rating = {
  score: number;
  message: string; // What you did well
  improvements: string[]; // 3 Improvements
};

async function rateText(
  question: string,
  text: string
): Promise<Rating | null> {
  // using await AI returns a plain text with delimiters

  // const response = await client.queries.rateResponse({
  //   text: text,
  // });
  // const data = response;
  // console.log(data);

  const response = await fetch(
    "https://027g1o8ghh.execute-api.us-west-2.amazonaws.com/query",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: `Rate the response for the question: ${question}, with the response of ${text}. Format your response strictly as a JSON, without any additional text or formatting. Ensure the JSON is valid and does not include newline characters. The shape should be: {"score": <integer 1–10>,
  "message": "<what went well>",
  "improvements": ["<suggestion 1>", "<suggestion 2>", "<suggestsion 3>"]
}`,
      }),
    }
  );

  const data = await response.json();
  console.log(data);

  return data ? JSON.parse(data.response) : null;
}

type AnalysisProps = {
  text: string;
  question: string;
  onContinue: () => void;
};

function Analysis({ text, question, onContinue }: AnalysisProps) {
  const [rating, setRating] = useState<Rating | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const responseRating = await rateText(question, text);
      setRating(responseRating);
      setLoading(false);
    }

    fetchData();
  }, [text, question]);

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
