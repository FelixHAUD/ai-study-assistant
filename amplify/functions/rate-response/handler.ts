import type { Schema } from "../../data/resource";

export const handler: Schema["rateResponse"]["functionHandler"] = async (
  event
) => {
  // arguments typed from `.arguments()`
  const { text } = event.arguments;
  console.log(`Rates ${text}`);
  // return typed from `.returns()`
  return {
    score: 10,
    message:
      "Your explanation was clear and well-structured. You demonstrated good understanding of the material and articulated key points effectively.",
    improvements: [
      "Consider adding more depth to your explanation of the theoretical framework",
      "Try to use more domain-specific terminology where appropriate",
      "Your explanation could benefit from a stronger conclusion that ties concepts together",
    ],
  };
};
