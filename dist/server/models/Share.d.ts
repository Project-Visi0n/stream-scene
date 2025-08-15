export interface ShareRecord {
    id: number;
    fileId: number;
    userId: number;
    shareToken: string;
    shareType: 'one-time' | 'indefinite';
    accessCount: number;
    maxAccess: number | null;
    expiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
}
export declare class Share {
    id: number;
    fileId: number;
    userId: number;
    shareToken: string;
    shareType: 'one-time' | 'indefinite';
    accessCount: number;
    maxAccess: number | null;
    expiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
    constructor(data: Partial<ShareRecord>);
    static generateShareToken(): string;
    static create(data: {
        fileId: number;
        userId: number;
        shareType: 'one-time' | 'indefinite';
        expiresAt?: Date;
    }): Promise<Share>;
    static findByToken(token: string): Promise<Share | null>;
    static findAllByUserId(userId: number): Promise<Share[]>;
    static findAllByFileId(fileId: number, userId: number): Promise<Share[]>;
    canAccess(): boolean;
    recordAccess(): Promise<boolean>;
    save(): Promise<Share>;
    deactivate(): Promise<Share>;
    destroy(): Promise<boolean>;
    static getStorageStats(): {
        totalShares: number;
        activeShares: number;
        shares: ShareRecord[];
    };
    toJSON(): {
        id: number;
        fileId: number;
        shareType: "one-time" | "indefinite";
        accessCount: number;
        maxAccess: number | null;
        expiresAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        canAccess: boolean;
    };
    getShareUrl(baseUrl: string): string;
}
//# sourceMappingURL=Share.d.ts.map