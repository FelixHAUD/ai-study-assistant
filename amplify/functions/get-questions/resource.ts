import { defineFunction } from "@aws-amplify/backend";

export const getQuestions = defineFunction({
  // optionally specify a name for the Function (defaults to directory name)
  name: "get-questions",
  // optionally specify a path to your handler (defaults to "./handler.ts")
  entry: "./handler.ts",
  resourceGroupName: "data",
});
