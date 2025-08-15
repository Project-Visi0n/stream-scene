import { User } from '../types/auth';
interface UseAuthReturn {
    user: User | null;
    loading: boolean;
    checkAuthStatus: () => Promise<void>;
}
declare const useAuth: () => UseAuthReturn;
export default useAuth;
//# sourceMappingURL=useAuth.d.ts.map