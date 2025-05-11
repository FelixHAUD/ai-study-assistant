import type { Schema } from "../../data/resource";

function buildS3URL(path: string) {
  const bucketUrl =
    "https://amplify-amplifyvitereactt-amplifyteamdrivebucket28-2j1zgywqwfjv.s3.us-west-2.amazonaws.com";
  const encodedPath = encodeURIComponent(path)
    .replace(/%20/g, "+") // space → +
    .replace(/%2F/g, "/"); // %2F → /
  return `${bucketUrl}/${encodedPath}`;
}

export const handler: Schema["getQuestions"]["functionHandler"] = async (
  event
) => {
  const content: string[] = [];
  const { localPath } = event.arguments;

  for (const path of localPath) {
    const objURL = buildS3URL(path);

    console.log(objURL);

    const fileContent = await fetch(objURL).then((res) => res.text());
    const base64Content = btoa(fileContent);
    content.push(base64Content);
  }

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
};
