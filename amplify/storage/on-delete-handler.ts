import type { S3Handler } from 'aws-lambda';

export const handler: S3Handler = async (event) => {
  try {
    const objectKeys = event.Records.map((record) => record.s3.object.key);
    console.log(`Delete handler invoked for objects [${objectKeys.join(', ')}]`);
    
    // Here you can add cleanup logic for deleted files
    // For example:
    // - Remove associated metadata
    // - Clean up related resources
    // - Update database records
  } catch (error) {
    console.error('Error processing delete:', error);
  }
};