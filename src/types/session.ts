import 'express-session';

export interface SessionUser {
  id: string;
  username: string;
  avatar: string | null;
}

declare module 'express-session' {
  interface SessionData {
    user?: SessionUser;
    oauthState?: string;
  }
}
