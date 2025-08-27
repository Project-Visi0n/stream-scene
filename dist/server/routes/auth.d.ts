declare const router: import("express-serve-static-core").Router;
declare global {
    namespace Express {
        interface User {
            id: number;
            firstName: string;
            lastName: string;
            email: string;
            googleId?: string;
            profilePicture?: string;
        }
    }
}
export default router;
//# sourceMappingURL=auth.d.ts.map