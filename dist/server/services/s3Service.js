"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isS3Configured = exports.deleteFileFromS3 = exports.uploadFileToS3 = exports.generatePresignedUploadUrl = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
/**
 * Get AWS configuration from server environment
 */
const getAWSConfig = () => {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_DEFAULT_REGION || 'us-east-2';
    const bucketName = process.env.REACT_APP_S3_BUCKET_NAME || 'stream-scene-bucket';
    if (!accessKeyId || !secretAccessKey) {
        throw new Error('AWS credentials not configured on server');
    }
    return {
        accessKeyId,
        secretAccessKey,
        region,
        bucketName
    };
};
/**
 * Create S3 client with server-side credentials
 */
const createS3Client = () => {
    const config = getAWSConfig();
    return new client_s3_1.S3Client({
        region: config.region,
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
        },
    });
};
/**
 * Generate a presigned URL for file upload
 * This allows the client to upload directly to S3 securely
 */
const generatePresignedUploadUrl = async (fileName, fileType, fileSizeBytes) => {
    const config = getAWSConfig();
    const s3Client = createS3Client();
    // Generate unique key for the file
    const fileExtension = fileName.split('.').pop();
    const key = `uploads/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
    const command = new client_s3_1.PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        ContentType: fileType,
        ContentLength: fileSizeBytes,
        ACL: 'public-read',
    });
    try {
        // Generate presigned URL valid for 1 hour
        const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, { expiresIn: 3600 });
        const fileUrl = `https://${config.bucketName}.s3.amazonaws.com/${key}`;
        return {
            uploadUrl,
            fileUrl,
            key
        };
    }
    catch (error) {
        console.error('Error generating presigned URL:', error);
        throw new Error('Failed to generate upload URL');
    }
};
exports.generatePresignedUploadUrl = generatePresignedUploadUrl;
/**
 * Upload file directly to S3 (server-side upload)
 */
const uploadFileToS3 = async (fileBuffer, fileName, fileType) => {
    const config = getAWSConfig();
    const s3Client = createS3Client();
    const fileExtension = fileName.split('.').pop();
    const key = `uploads/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
    const command = new client_s3_1.PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: fileType,
        ACL: 'public-read',
    });
    try {
        await s3Client.send(command);
        const url = `https://${config.bucketName}.s3.amazonaws.com/${key}`;
        return { url, key };
    }
    catch (error) {
        console.error('Error uploading to S3:', error);
        throw new Error('Failed to upload file to S3');
    }
};
exports.uploadFileToS3 = uploadFileToS3;
/**
 * Delete file from S3
 */
const deleteFileFromS3 = async (key) => {
    const config = getAWSConfig();
    const s3Client = createS3Client();
    const command = new client_s3_1.DeleteObjectCommand({
        Bucket: config.bucketName,
        Key: key,
    });
    try {
        await s3Client.send(command);
    }
    catch (error) {
        console.error('Error deleting from S3:', error);
        throw new Error('Failed to delete file from S3');
    }
};
exports.deleteFileFromS3 = deleteFileFromS3;
/**
 * Check if S3 is properly configured
 */
const isS3Configured = () => {
    try {
        const config = getAWSConfig();
        return !!(config.accessKeyId && config.secretAccessKey && config.bucketName);
    }
    catch {
        return false;
    }
};
exports.isS3Configured = isS3Configured;
//# sourceMappingURL=s3Service.js.map