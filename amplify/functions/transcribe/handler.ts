import { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } from "@aws-sdk/client-transcribe";

export const handler = async (event: { audioBytes: string }) => {
  const transcribeClient = new TranscribeClient({ region: "us-west-2" });
  
  try {
    const jobName = `transcription-${Date.now()}`;
    const command = new StartTranscriptionJobCommand({
      TranscriptionJobName: jobName,
      LanguageCode: "en-US",
      Media: {
        MediaFileUri: `s3://${process.env.STORAGE_BUCKET_NAME}/transcriptions/${Date.now()}.webm`
      },
      OutputBucketName: process.env.STORAGE_BUCKET_NAME
    });

    await transcribeClient.send(command);

    // Wait for transcription to complete
    let transcriptionJob;
    do {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      const getJobCommand = new GetTranscriptionJobCommand({
        TranscriptionJobName: jobName
      });
      transcriptionJob = await transcribeClient.send(getJobCommand);
    } while (transcriptionJob.TranscriptionJob?.TranscriptionJobStatus === "IN_PROGRESS");

    if (transcriptionJob.TranscriptionJob?.TranscriptionJobStatus === "COMPLETED") {
      return transcriptionJob.TranscriptionJob.Transcript?.TranscriptFileUri || "";
    } else {
      throw new Error("Transcription failed");
    }
  } catch (error) {
    console.error("Error in transcription:", error);
    throw error;
  }
}; 