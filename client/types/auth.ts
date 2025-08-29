export interface User {
  id: number;
  firstName: string;
  lastName?: string;
  name: string;
  email: string;
  google_id?: string;
  profilePicture?: string;
  created_at?: string;
  updated_at?: string;
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