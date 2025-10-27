import 'express-session';

declare module 'express-session' {
  interface SessionData {
    xAuth?: {
      platform?: string;
      userId?: string;
      username?: string;
      accessToken?: string;
      tokenSecret?: string;
    };
    threadsAuth?: {
      platform?: string;
      userId?: string;
      username?: string;
      accessToken?: string;
      tokenSecret?: string;
      connectedAt?: string;
    };
    oauthState?: string;
    threadsState?: string;
  }
}
import 'express';
import { File } from 'multer';

declare module 'express-serve-static-core' {
  interface Request {
    file?: File;
    user?: {
      id: number;
      email: string;
      name: string;
      google_id?: string;
    };
  }
}
