import { defineFunction } from "@aws-amplify/backend";

export const anyFiles = defineFunction({
  name: "any-files",
  entry: "./handler.ts",
});
