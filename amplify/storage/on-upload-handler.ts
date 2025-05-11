import type { S3Handler } from 'aws-lambda';

export const handler: S3Handler = async (event) => {
  try {
    const objectKeys = event.Records.map((record) => record.s3.object.key);
    console.log(`Upload handler invoked for objects [${objectKeys.join(', ')}]`);
    
    // Here you can add additional processing logic for uploaded files
    // For example:
    // - Validate file types
    // - Process file contents
    // - Update database records
    // - Trigger other workflows
  } catch (error) {
    console.error('Error processing upload:', error);
  }
};