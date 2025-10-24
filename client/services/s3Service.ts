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

      return false;
    }
    
    const data = await response.json();

    return data.configured || false;
  } catch (error) {

    return false;
  }
};

/**
 * Upload file to S3 via secure server endpoint
 * This is the ONLY way files should be uploaded - through the server
 */
export const uploadFileToS3 = async (file: File): Promise<S3UploadResult> => {


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

      throw new Error(`Upload failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();

    
    return {
      url: result.url,
      key: result.key
    };
  } catch (error) {

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


  try {
    const response = await fetch(`/api/s3/delete/${encodeURIComponent(key)}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(`Delete failed: ${response.status} ${errorText}`);
    }


  } catch (error) {

    throw new Error('Failed to delete file from S3');
  }
};

/**
 * Generate a presigned upload URL via server
 * This allows large file uploads while maintaining security
 */
export const getPresignedUploadUrl = async (fileName: string, fileType: string, fileSize?: number): Promise<string> => {


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

      throw new Error(`Failed to get upload URL: ${response.status} ${errorText}`);
    }

    const result = await response.json();

    
    return result.presignedUrl;
  } catch (error) {

    throw new Error('Failed to get upload URL');
  }
};

/**
 * Upload file using presigned URL (for large files)
 */
export const uploadWithPresignedUrl = async (file: File): Promise<S3UploadResult> => {


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

      throw new Error(`Upload failed: ${uploadResponse.status}`);
    }

    // Extract key from presigned URL
    const url = new URL(presignedUrl);
    const key = url.pathname.substring(1); // Remove leading '/'
    const fileUrl = getFileUrl(key);


    
    return {
      url: fileUrl,
      key: key
    };
  } catch (error) {

    throw new Error('Failed to upload file with presigned URL');
  }
};

/**
 * Upload receipt file with expense metadata
 */
export const uploadReceipt = async (file: File, expenseId?: string): Promise<S3UploadResult> => {


  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'receipt'); // FIXED: was 'file', should be 'type'
    if (expenseId) {
      formData.append('expenseId', expenseId); // FIXED: was 'expenseID', should be 'expenseId'
    }

    const response = await fetch('/api/s3/upload/receipt', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Receipt upload failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();

    
    return {
      url: result.url,
      key: result.key
    };
  } catch (error) {

    throw new Error('Failed to upload receipt');
  }
};

// Default export using the secure server upload
export default {
  uploadFileToS3,
  deleteFileFromS3,
  getFileUrl,
  isS3Configured,
  getPresignedUploadUrl,
  uploadWithPresignedUrl,
  uploadReceipt 
};