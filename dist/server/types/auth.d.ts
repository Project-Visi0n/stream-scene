export interface User {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
}
export interface AuthResponse {
    authenticated: boolean;
    user?: User;
}
export interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: () => void;
    logout: () => void;
    checkAuthStatus: () => Promise<void>;
}
//# sourceMappingURL=auth.d.ts.map