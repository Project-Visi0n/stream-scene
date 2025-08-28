export interface S3UploadResult {
    url: string;
    key: string;
}
/**
 * Check if S3 is configured (server-side check)
 */
export declare const isS3Configured: () => Promise<boolean>;
/**
 * Upload file to S3 via secure server endpoint
 * This is the ONLY way files should be uploaded - through the server
 */
export declare const uploadFileToS3: (file: File) => Promise<S3UploadResult>;
/**
 * Get a secure URL for accessing uploaded files
 * Files are served through server proxy to maintain security
 */
export declare const getFileUrl: (key: string) => string;
/**
 * Delete a file from S3 via server endpoint
 */
export declare const deleteFileFromS3: (key: string) => Promise<void>;
/**
 * Generate a presigned upload URL via server
 * This allows large file uploads while maintaining security
 */
export declare const getPresignedUploadUrl: (fileName: string, fileType: string, fileSize?: number) => Promise<string>;
/**
 * Upload file using presigned URL (for large files)
 */
export declare const uploadWithPresignedUrl: (file: File) => Promise<S3UploadResult>;
declare const _default: {
    uploadFileToS3: (file: File) => Promise<S3UploadResult>;
    deleteFileFromS3: (key: string) => Promise<void>;
    getFileUrl: (key: string) => string;
    isS3Configured: () => Promise<boolean>;
    getPresignedUploadUrl: (fileName: string, fileType: string, fileSize?: number) => Promise<string>;
    uploadWithPresignedUrl: (file: File) => Promise<S3UploadResult>;
};
export default _default;
//# sourceMappingURL=s3Service.d.ts.map