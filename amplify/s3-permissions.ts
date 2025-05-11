import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { defineFunction } from "@aws-amplify/backend";

export const handler = async () => {
  return new PolicyStatement({
    actions: [
      "s3:PutObject",
      "s3:GetObject",
      "s3:DeleteObject",
      "s3:ListBucket"
    ],
    resources: [
      `arn:aws:s3:::${process.env.STORAGE_BUCKET_NAME}/*`,
      `arn:aws:s3:::${process.env.STORAGE_BUCKET_NAME}`
    ]
  });
}; 