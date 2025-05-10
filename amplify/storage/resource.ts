import { defineStorage } from "@aws-amplify/backend";

export const storage = defineStorage({
  name: "amplifyTeamDrive",
  access: (allow) => ({
    "notes/*": [
      allow.guest.to(["read", "write"]), // additional actions such as "write" and "delete" can be specified depending on your use case
    ],
  }),
});
