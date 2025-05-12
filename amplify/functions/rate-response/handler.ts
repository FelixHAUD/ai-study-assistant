import type { Schema } from "../../data/resource";

export const handler: Schema["rateResponse"]["functionHandler"] = async (
  event
) => {
  // arguments typed from `.arguments()`
  const { text } = event.arguments;
  console.log(text);

  try {
    const response = await fetch(
      "https://027g1o8ghh.execute-api.us-west-2.amazonaws.com/query",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: "Explain the water cycle" }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Response:", data);

    return data;
  } catch (error) {
    console.error("Error:", error);
  }
};
