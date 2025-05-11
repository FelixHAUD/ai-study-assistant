import type { Schema } from "../../data/resource";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const handler: Schema["getQuestions"]["functionHandler"] = async (
  event
) => {
  const content: string[] = [];
  const { localPath } = event.arguments;

  // Create S3 client with hardcoded region
  const s3Client = new S3Client({ region: 'us-west-2' });

  for (const path of localPath) {
    try {
      // Generate presigned URL
      const command = new GetObjectCommand({
        Bucket: process.env.STORAGE_BUCKET_NAME,
        Key: path,
      });
      
      const presignedUrl = await getSignedUrl(s3Client, command, { 
        expiresIn: 3600 // URL expires in 1 hour
      });

      // Fetch file content using presigned URL
      const fileContent = await fetch(presignedUrl).then((res) => res.text());
      const base64Content = btoa(fileContent);
      content.push(base64Content);
    } catch (error) {
      console.error(`Error processing file ${path}:`, error);
      throw new Error(`Failed to process file ${path}`);
    }
  }

  try {
    const response = await fetch(
      "https://qkhr2j5d52.execute-api.us-west-2.amazonaws.com/filequery",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt:
            "Generate study questions based on this content. Make them thought-provoking and focused on understanding key concepts.",
          filename: "something.txt",
          file_content_base64: content.join(),
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to generate questions");
    }

    const data = await response.json();
    console.log(data);

    return data;
  } catch (error) {
    console.error("Error generating questions:", error);
    throw error;
  }
};
