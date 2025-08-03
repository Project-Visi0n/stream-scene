import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface S3UploadResult {
  url: string;
  key: string;
}

/**
 * Safely get environment variables with fallbacks
 */
const getEnvVars = () => {
  try {
    const envVars = {
      AWS_REGION: process?.env?.REACT_APP_AWS_REGION || 'us-east-2',
      AWS_ACCESS_KEY_ID: process?.env?.REACT_APP_AWS_ACCESS_KEY_ID || '',
      AWS_SECRET_ACCESS_KEY: process?.env?.REACT_APP_AWS_SECRET_ACCESS_KEY || '',
      BUCKET_NAME: process?.env?.REACT_APP_S3_BUCKET_NAME || 'stream-scene-bucket'
    };
    console.log('[S3Service] Loaded env vars:', envVars);
    return envVars;
  } catch (error) {
    console.warn('Process environment not available, using fallbacks', error);
    return {
      AWS_REGION: 'us-east-2',
      AWS_ACCESS_KEY_ID: '',
      AWS_SECRET_ACCESS_KEY: '',
      BUCKET_NAME: 'stream-scene-bucket'
    };
  }
};

/**
 * Check if AWS S3 is properly configured
 */
export const isS3Configured = (): boolean => {
  const env = getEnvVars();
  const configured = !!(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.BUCKET_NAME !== 'your-bucket-name');
  if (!configured) {
    console.warn('[S3Service] S3 is NOT configured:', env);
  } else {
    console.log('[S3Service] S3 is configured:', env);
  }
  return configured;
};

/**
 * Upload a file directly to S3
 */
export const uploadFileToS3 = async (file: File): Promise<S3UploadResult> => {
  const env = getEnvVars();

  if (!(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.BUCKET_NAME !== 'your-bucket-name')) {
    console.error('[S3Service] uploadFileToS3: S3 not configured:', env);
    throw new Error('AWS S3 is not configured. Please check your environment variables.');
  }

  // Generate a presigned URL for the upload
  const fileExtension = file.name.split('.').pop();
  const fileName = `uploads/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
  
  const s3Client = new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });

  const command = new PutObjectCommand({
    Bucket: env.BUCKET_NAME,
    Key: fileName,
    ChecksumAlgorithm: undefined,
  });

  const presignedUrl = await getSignedUrl(s3Client, command, { 
    expiresIn: 3600,
  });
  console.log('[S3Service] Presigned URL:', presignedUrl);

  // Upload the file using fetch PUT
  try {
    const uploadRes = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
    });
    if (!uploadRes.ok) {
      throw new Error(`Failed to upload file to S3. Status: ${uploadRes.status}`);
    }
    const url = `https://${env.BUCKET_NAME}.s3.amazonaws.com/${fileName}`;
    console.log('[S3Service] Upload successful:', url);
    return {
      url,
      key: fileName,
    };
  } catch (error) {
    console.error('[S3Service] Error uploading to S3 via presigned URL:', error);
    throw new Error('Failed to upload file to S3');
  }
};

/**
 * Generate a presigned URL for secure upload
 * This is recommended for production use
 */
export const getPresignedUploadUrl = async (fileName: string, fileType: string): Promise<string> => {
  const env = getEnvVars();

  if (!(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.BUCKET_NAME !== 'your-bucket-name')) {
    throw new Error('AWS S3 is not configured. Please check your environment variables.');
  }

  const s3Client = new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });

  const fileExtension = fileName.split('.').pop();
  const key = `uploads/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
  
  const command = new PutObjectCommand({
    Bucket: env.BUCKET_NAME,
    Key: key,
    ContentType: fileType,
  });

  try {
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
    return signedUrl;
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw new Error('Failed to generate upload URL');
  }
};

/**
 * Upload file using presigned URL (recommended approach)
 */
export const uploadWithPresignedUrl = async (file: File): Promise<S3UploadResult> => {
  // This is a placeholder for a real presigned URL upload flow
  return uploadFileToS3(file);
};

/**
 * Delete a file from S3
 */
export const deleteFileFromS3 = async (key: string): Promise<void> => {
  const env = getEnvVars();

  if (!(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.BUCKET_NAME !== 'your-bucket-name')) {
    throw new Error('AWS S3 is not configured. Please check your environment variables.');
  }

  const s3Client = new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });

  const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
  
  const command = new DeleteObjectCommand({
    Bucket: env.BUCKET_NAME,
    Key: key,
  });

  try {
    await s3Client.send(command);
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw new Error('Failed to delete file from S3');
  }
};
