export interface XApiConfig {
    apiKey: string;
    apiSecret: string;
    bearerToken: string;
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
}
export declare const getXApiConfig: () => XApiConfig;
export interface XConnectionModel {
    userId: string;
    accessToken: string;
    accessTokenSecret: string;
    refreshToken?: string;
    username: string;
    profileImage?: string;
    isConnected: boolean;
    connectedAt: Date;
    expiresAt?: Date;
    lastUsed?: Date;
}
export interface XPostModel {
    id: string;
    userId: string;
    content: string;
    scheduledAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    status: 'draft' | 'scheduled' | 'published' | 'failed';
    xPostId?: string;
    errorMessage?: string;
    retryCount?: number;
    media?: Array<{
        id: string;
        type: 'image' | 'video' | 'gif';
        url: string;
        filename: string;
        xMediaId?: string;
    }>;
    analytics?: {
        retweets?: number;
        likes?: number;
        replies?: number;
        views?: number;
        lastUpdated?: Date;
    };
}
export interface OAuthStateModel {
    userId: string;
    oauthToken: string;
    oauthTokenSecret: string;
    expiresAt: Date;
    createdAt: Date;
}
export declare const XApiUtils: {
    validateTweetContent: (content: string) => {
        isValid: boolean;
        errors: string[];
    };
    extractHashtags: (content: string) => string[];
    extractMentions: (content: string) => string[];
    formatApiError: (error: any) => string;
    isRetryableError: (error: any) => boolean;
    getOptimalPostingTimes: (timezone?: string) => Array<{
        hour: number;
        label: string;
    }>;
};
export default getXApiConfig;
//# sourceMappingURL=xApi.d.ts.map