// Simple in-memory user storage for demo purposes
// In production, this would be replaced with proper database persistence
// In-memory user storage
const userStorage = new Map();
const userByGoogleId = new Map(); // googleId -> userId mapping
let nextUserId = 1;
// Minimal User class - NO Sequelize imports or decorators
export class User {
    constructor(data) {
        this.id = data.id;
        this.googleId = data.googleId;
        this.firstName = data.firstName;
        this.lastName = data.lastName;
        this.email = data.email;
        this.profilePic = data.profilePic;
    }
    static async findOne(options) {
        console.log('User.findOne called with:', options);
        if (options.where && options.where.googleId) {
            const googleId = options.where.googleId;
            const userId = userByGoogleId.get(googleId);
            if (userId) {
                const userRecord = userStorage.get(userId);
                if (userRecord) {
                    return new User(userRecord);
                }
            }
        }
        return null;
    }
    static async create(data) {
        console.log('User.create called with:', data);
        const userId = nextUserId++;
        const userRecord = Object.assign({ id: userId }, data);
        userStorage.set(userId, userRecord);
        userByGoogleId.set(data.googleId, userId);
        console.log('User created with ID:', userId);
        return new User(userRecord);
    }
    static async findByPk(id) {
        console.log('User.findByPk called with:', id);
        const userRecord = userStorage.get(id);
        if (userRecord) {
            console.log('Found user:', userRecord.firstName, userRecord.lastName);
            return new User(userRecord);
        }
        console.log('User not found for ID:', id);
        return null;
    }
    // Debug method to see stored users
    static getStorageStats() {
        return {
            totalUsers: userStorage.size,
            users: Array.from(userStorage.values())
        };
    }
}
export default User;
