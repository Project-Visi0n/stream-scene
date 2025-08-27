interface UserRecord {
    id: number;
    googleId: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePic?: string;
}
export declare class User {
    id: number;
    googleId: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePic?: string;
    constructor(data: UserRecord);
    static findOne(options: any): Promise<User | null>;
    static create(data: any): Promise<User>;
    static findByPk(id: number): Promise<User | null>;
    static getStorageStats(): {
        totalUsers: number;
        users: UserRecord[];
    };
}
export default User;
//# sourceMappingURL=User.d.ts.map