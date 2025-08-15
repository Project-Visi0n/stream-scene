// Share model for managing shareable file links
import { randomBytes } from 'crypto';
// In-memory storage for shares
const shareStorage = new Map();
const tokenToShareMap = new Map(); // For quick token lookup
let nextShareId = 1;
export class Share {
    constructor(data) {
        Object.assign(this, data);
    }
    // Generate a secure share token
    static generateShareToken() {
        return randomBytes(32).toString('hex');
    }
    // Static method to create a new share
    static async create(data) {
        console.log('Share.create called with:', data);
        const now = new Date();
        const shareToken = this.generateShareToken();
        const shareRecord = {
            id: nextShareId++,
            fileId: data.fileId,
            userId: data.userId,
            shareToken,
            shareType: data.shareType,
            accessCount: 0,
            maxAccess: data.shareType === 'one-time' ? 1 : null,
            expiresAt: data.expiresAt || null,
            createdAt: now,
            updatedAt: now,
            isActive: true
        };
        shareStorage.set(shareRecord.id, shareRecord);
        tokenToShareMap.set(shareToken, shareRecord.id);
        console.log('Share created with ID:', shareRecord.id, 'Token:', shareToken);
        return new Share(shareRecord);
    }
    // Static method to find share by token
    static async findByToken(token) {
        console.log('Share.findByToken called with token:', token.substring(0, 10) + '...');
        const shareId = tokenToShareMap.get(token);
        if (!shareId) {
            return null;
        }
        const record = shareStorage.get(shareId);
        if (!record) {
            // Clean up orphaned token mapping
            tokenToShareMap.delete(token);
            return null;
        }
        return new Share(record);
    }
    // Static method to find all shares by user ID
    static async findAllByUserId(userId) {
        console.log('Share.findAllByUserId called with userId:', userId);
        const userShares = Array.from(shareStorage.values())
            .filter(share => share.userId === userId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .map(record => new Share(record));
        console.log('Found shares for user:', userShares.length);
        return userShares;
    }
    // Static method to find all shares for a specific file
    static async findAllByFileId(fileId, userId) {
        console.log('Share.findAllByFileId called with:', { fileId, userId });
        const fileShares = Array.from(shareStorage.values())
            .filter(share => share.fileId === fileId && share.userId === userId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .map(record => new Share(record));
        console.log('Found shares for file:', fileShares.length);
        return fileShares;
    }
    // Check if share is valid and can be accessed
    canAccess() {
        if (!this.isActive) {
            return false;
        }
        // Check if expired
        if (this.expiresAt && this.expiresAt < new Date()) {
            return false;
        }
        // Check access count for one-time shares
        if (this.shareType === 'one-time' && this.accessCount >= (this.maxAccess || 1)) {
            return false;
        }
        return true;
    }
    // Record an access attempt
    async recordAccess() {
        if (!this.canAccess()) {
            return false;
        }
        this.accessCount++;
        this.updatedAt = new Date();
        // Deactivate one-time shares after use
        if (this.shareType === 'one-time' && this.accessCount >= (this.maxAccess || 1)) {
            this.isActive = false;
        }
        await this.save();
        return true;
    }
    // Instance method to save changes
    async save() {
        console.log('Share.save called for share:', this.id);
        this.updatedAt = new Date();
        const record = shareStorage.get(this.id);
        if (record) {
            // Update the stored record
            Object.assign(record, {
                shareType: this.shareType,
                accessCount: this.accessCount,
                maxAccess: this.maxAccess,
                expiresAt: this.expiresAt,
                updatedAt: this.updatedAt,
                isActive: this.isActive
            });
            shareStorage.set(this.id, record);
        }
        return this;
    }
    // Instance method to deactivate this share
    async deactivate() {
        console.log('Share.deactivate called for share:', this.id);
        this.isActive = false;
        return await this.save();
    }
    // Instance method to delete this share
    async destroy() {
        console.log('Share.destroy called for share:', this.id);
        // Remove from token mapping
        tokenToShareMap.delete(this.shareToken);
        // Remove from storage
        const deleted = shareStorage.delete(this.id);
        console.log('Share deletion result:', deleted);
        return deleted;
    }
    // Static method to get storage stats (for debugging)
    static getStorageStats() {
        return {
            totalShares: shareStorage.size,
            activeShares: Array.from(shareStorage.values()).filter(s => s.isActive).length,
            shares: Array.from(shareStorage.values())
        };
    }
    // Serialize for API response (without sensitive token)
    toJSON() {
        return {
            id: this.id,
            fileId: this.fileId,
            shareType: this.shareType,
            accessCount: this.accessCount,
            maxAccess: this.maxAccess,
            expiresAt: this.expiresAt,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            isActive: this.isActive,
            canAccess: this.canAccess()
        };
    }
    // Get shareable URL (for the user who created the share)
    getShareUrl(baseUrl) {
        return `${baseUrl}/shared/${this.shareToken}`;
    }
}
//# sourceMappingURL=Share.js.map