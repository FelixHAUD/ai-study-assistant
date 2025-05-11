import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { storage } from "./storage/resource";
import { rateResponse } from "./functions/rate-response/resource";
import { anyFiles } from "./functions/any-files/resource";

defineBackend({
  auth,
  data,
  storage,
  rateResponse,
  anyFiles,
});
