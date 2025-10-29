import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

// Configure S3 client
const s3Client = new S3Client({
  region: process.env.EXPO_PUBLIC_AWS_REGION || '',
  credentials: {
    accessKeyId: process.env.EXPO_PUBLIC_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.EXPO_PUBLIC_S3_BUCKET_NAME || '';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export const uploadProfilePicture = async (
  file: File | Blob | Uint8Array,
  userId: string
): Promise<UploadResult> => {
  try {
    if (!BUCKET_NAME) {
      throw new Error('S3 bucket name not configured');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = 'jpg'; // Default to jpg for profile pictures
    const fileName = `${userId}/${timestamp}.${fileExtension}`;

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: file,
      ContentType: 'image/jpeg',
    });

    await s3Client.send(command);

    // Return the public URL
    const publicUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${fileName}`;

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
};

export const deleteProfilePicture = async (
  url: string
): Promise<UploadResult> => {
  try {
    if (!BUCKET_NAME) {
      throw new Error('S3 bucket name not configured');
    }

    // Extract the key from the URL
    const urlParts = url.split('/');
    const key = urlParts.slice(3).join('/'); // Remove the bucket name and domain parts

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error deleting profile picture:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
};
