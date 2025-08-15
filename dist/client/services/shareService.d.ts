export interface ShareRecord {
    id: number;
    fileId: number;
    shareType: 'one-time' | 'indefinite';
    accessCount: number;
    maxAccess: number | null;
    expiresAt: string | null;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
    canAccess: boolean;
    shareUrl: string;
    shareToken: string;
}
export interface CreateShareRequest {
    fileId: number;
    shareType: 'one-time' | 'indefinite';
    expiresAt?: string;
}
export interface SharedFileAccess {
    file: {
        id: number;
        name: string;
        type: string;
        size: number;
        url: string;
        uploadedAt: string;
    };
    share: {
        shareType: 'one-time' | 'indefinite';
        accessCount: number;
        maxAccess: number | null;
        remainingAccess: number | null;
    };
}
export declare const shareService: {
    createShare(shareData: CreateShareRequest): Promise<ShareRecord>;
    getFileShares(fileId: number): Promise<ShareRecord[]>;
    getUserShares(): Promise<ShareRecord[]>;
    accessSharedFile(token: string): Promise<SharedFileAccess>;
    deactivateShare(shareId: number): Promise<ShareRecord>;
    deleteShare(shareId: number): Promise<void>;
    copyShareUrl(shareUrl: string): Promise<void>;
};
//# sourceMappingURL=shareService.d.ts.map