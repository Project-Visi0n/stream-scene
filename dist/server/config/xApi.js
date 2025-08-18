export const getXApiConfig = () => {
    const requiredEnvVars = [
        'X_API_KEY',
        'X_API_SECRET',
        'X_BEARER_TOKEN',
        'X_CLIENT_ID',
        'X_CLIENT_SECRET'
    ];
    // Check if all required environment variables are present
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
        throw new Error(`Missing required X API environment variables: ${missingVars.join(', ')}`);
    }
    return {
        apiKey: process.env.X_API_KEY,
        apiSecret: process.env.X_API_SECRET,
        bearerToken: process.env.X_BEARER_TOKEN,
        clientId: process.env.X_CLIENT_ID,
        clientSecret: process.env.X_CLIENT_SECRET,
        callbackUrl: process.env.X_CALLBACK_URL || `${process.env.CLIENT_URL}/auth/x/callback`
    };
};
// Utility functions for X API
export const XApiUtils = {
    // Validate tweet content
    validateTweetContent: (content) => {
        const errors = [];
        if (!content.trim()) {
            errors.push('Tweet content cannot be empty');
        }
        if (content.length > 280) {
            errors.push(`Tweet exceeds 280 character limit (${content.length} characters)`);
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    },
    // Extract hashtags from content
    extractHashtags: (content) => {
        const hashtags = content.match(/#[\w]+/g) || [];
        return hashtags.map(tag => tag.slice(1));
    },
    // Extract mentions from content
    extractMentions: (content) => {
        const mentions = content.match(/@[\w]+/g) || [];
        return mentions.map(mention => mention.slice(1));
    },
    // Format error messages for user display
    formatApiError: (error) => {
        var _a, _b, _c;
        if ((_c = (_b = (_a = error === null || error === void 0 ? void 0 : error.data) === null || _a === void 0 ? void 0 : _a.errors) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.message) {
            return error.data.errors[0].message;
        }
        if (error === null || error === void 0 ? void 0 : error.code) {
            switch (error.code) {
                case 187:
                    return 'This tweet appears to be a duplicate';
                case 186:
                    return 'Tweet is too long';
                case 32:
                    return 'Authentication failed. Please reconnect your X account';
                case 88:
                    return 'Rate limit exceeded. Please try again later';
                case 89:
                    return 'Invalid or expired token. Please reconnect your X account';
                default:
                    return `X API Error (${error.code}): ${error.message || 'Unknown error'}`;
            }
        }
        return (error === null || error === void 0 ? void 0 : error.message) || 'An error occurred while posting to X';
    },
    // Check if error is retryable
    isRetryableError: (error) => {
        const retryableCodes = [88, 130, 131, 503, 504];
        return retryableCodes.includes(error === null || error === void 0 ? void 0 : error.code) ||
            ((error === null || error === void 0 ? void 0 : error.status) >= 500 && (error === null || error === void 0 ? void 0 : error.status) < 600);
    },
    // Calculate optimal posting times based on user's timezone
    getOptimalPostingTimes: (timezone = 'UTC') => {
        return [
            { hour: 9, label: '9:00 AM - Morning engagement' },
            { hour: 12, label: '12:00 PM - Lunch break' },
            { hour: 15, label: '3:00 PM - Afternoon peak' },
            { hour: 17, label: '5:00 PM - Evening commute' },
            { hour: 19, label: '7:00 PM - Prime time' }
        ];
    }
};
// Export configuration
export default getXApiConfig;
