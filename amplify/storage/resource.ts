import { defineFunction, defineStorage } from "@aws-amplify/backend";

export const storage = defineStorage({
  name: "amplifyTeamDrive",
  access: (allow) => ({
    "notes/*": [allow.guest.to(["read", "write", "delete"])],
    "transcriptions/*": [allow.guest.to(["read", "write", "delete"])],
    "audio-recordings/*": [allow.guest.to(["read", "write", "delete"])],
  }),
  triggers: {
    onUpload: defineFunction({
      // relative to your backend/<category>/<resource>/src folder
      entry: "./on-upload-handler.ts",
      resourceGroupName: "storage",
    }),
    onDelete: defineFunction({
      entry: "./on-delete-handler.ts",
      resourceGroupName: "storage",
    }),
  },
});
