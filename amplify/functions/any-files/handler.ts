import type { Schema } from "../../data/resource";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

export const handler: Schema["anyFiles"]["functionHandler"] = async (): Promise<boolean> => {
  const s3Client = new S3Client({});
  
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.STORAGE_BUCKET_NAME,
      Prefix: "notes/",
      MaxKeys: 1
    });

    const response = await s3Client.send(command);
    return Boolean(response.Contents && response.Contents.length > 0);
  } catch (error) {
    console.error("Error checking for existing files:", error);
    return false;
  }
};
