interface S3UploadResult {
    url: string;
    key: string;
}
/**
 * Generate a presigned URL for file upload
 * This allows the client to upload directly to S3 securely
 */
export declare const generatePresignedUploadUrl: (fileName: string, fileType: string, fileSizeBytes: number) => Promise<{
    uploadUrl: string;
    fileUrl: string;
    key: string;
}>;
/**
 * Upload file directly to S3 (server-side upload)
 */
export declare const uploadFileToS3: (fileBuffer: Buffer, fileName: string, fileType: string) => Promise<S3UploadResult>;
/**
 * Delete file from S3
 */
export declare const deleteFileFromS3: (key: string) => Promise<void>;
/**
 * Check if S3 is properly configured
 */
export declare const isS3Configured: () => boolean;
export {};
//# sourceMappingURL=s3Service.d.ts.map