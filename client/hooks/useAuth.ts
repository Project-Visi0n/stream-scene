import { useState, useEffect } from 'react';
import { User, AuthResponse } from '../types/auth';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  checkAuthStatus: () => Promise<void>;
}

const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async (): Promise<void> => {
    try {
      const response = await fetch('http://localhost:3000/auth/user', {
        credentials: 'include'
      });
      const data: AuthResponse = await response.json();
      
      if (data.authenticated && data.user) {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, checkAuthStatus };
};

export default useAuth;