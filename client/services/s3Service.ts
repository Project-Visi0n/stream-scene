// Client-side S3 service - SECURE VERSION
// NO AWS credentials on client side - all operations go through server

export interface S3UploadResult {
  url: string;
  key: string;
}

/**
 * Check if S3 is configured (server-side check)
 */
export const isS3Configured = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/s3/status', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      console.warn('[S3Service] Server S3 status check failed:', response.status);
      return false;
    }
    
    const data = await response.json();
    console.log('[S3Service] Server S3 configuration check:', data);
    return data.configured || false;
  } catch (error) {
    console.error('[S3Service] Failed to check S3 configuration:', error);
    return false;
  }
};

/**
 * Upload file to S3 via secure server endpoint
 * This is the ONLY way files should be uploaded - through the server
 */
export const uploadFileToS3 = async (file: File): Promise<S3UploadResult> => {
  console.log('[S3Service] Starting secure server-side upload for:', file.name);

  try {
    // Create form data for multipart upload
    const formData = new FormData();
    formData.append('file', file);

    // Upload through server proxy
    const response = await fetch('/api/s3/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[S3Service] Server upload failed:', response.status, errorText);
      throw new Error(`Upload failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('[S3Service] Upload successful:', result);
    
    return {
      url: result.url,
      key: result.key
    };
  } catch (error) {
    console.error('[S3Service] Upload error:', error);
    throw new Error('Failed to upload file to S3');
  }
};

/**
 * Get a secure URL for accessing uploaded files
 * Files are served through server proxy to maintain security
 */
export const getFileUrl = (key: string): string => {
  // Use server proxy to serve files securely
  return `/api/s3/proxy/${key}`;
};

/**
 * Delete a file from S3 via server endpoint
 */
export const deleteFileFromS3 = async (key: string): Promise<void> => {
  console.log('[S3Service] Deleting file:', key);

  try {
    const response = await fetch(`/api/s3/delete/${encodeURIComponent(key)}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[S3Service] Delete failed:', response.status, errorText);
      throw new Error(`Delete failed: ${response.status} ${errorText}`);
    }

    console.log('[S3Service] File deleted successfully');
  } catch (error) {
    console.error('[S3Service] Delete error:', error);
    throw new Error('Failed to delete file from S3');
  }
};

/**
 * Generate a presigned upload URL via server
 * This allows large file uploads while maintaining security
 */
export const getPresignedUploadUrl = async (fileName: string, fileType: string, fileSize?: number): Promise<string> => {
  console.log('[S3Service] Requesting presigned URL for:', fileName);

  try {
    const response = await fetch('/api/s3/presigned-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileName,
        fileType,
        fileSize
      }),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[S3Service] Presigned URL request failed:', response.status, errorText);
      throw new Error(`Failed to get upload URL: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('[S3Service] Presigned URL received');
    
    return result.presignedUrl;
  } catch (error) {
    console.error('[S3Service] Presigned URL error:', error);
    throw new Error('Failed to get upload URL');
  }
};

/**
 * Upload file using presigned URL (for large files)
 */
export const uploadWithPresignedUrl = async (file: File): Promise<S3UploadResult> => {
  console.log('[S3Service] Starting presigned URL upload for:', file.name);

  try {
    // First get the presigned URL from server
    const presignedUrl = await getPresignedUploadUrl(file.name, file.type, file.size);
    
    // Upload directly to S3 using presigned URL
    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      console.error('[S3Service] Presigned upload failed:', uploadResponse.status);
      throw new Error(`Upload failed: ${uploadResponse.status}`);
    }

    // Extract key from presigned URL
    const url = new URL(presignedUrl);
    const key = url.pathname.substring(1); // Remove leading '/'
    const fileUrl = getFileUrl(key);

    console.log('[S3Service] Presigned upload successful');
    
    return {
      url: fileUrl,
      key: key
    };
  } catch (error) {
    console.error('[S3Service] Presigned upload error:', error);
    throw new Error('Failed to upload file with presigned URL');
  }
};

// Default export using the secure server upload
export default {
  uploadFileToS3,
  deleteFileFromS3,
  getFileUrl,
  isS3Configured,
  getPresignedUploadUrl,
  uploadWithPresignedUrl
};
