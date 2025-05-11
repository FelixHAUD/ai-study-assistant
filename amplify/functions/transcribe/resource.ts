import { defineFunction } from "@aws-amplify/backend";

export const transcribe = defineFunction({
  name: "transcribe",
  entry: "./handler.ts"
}); 