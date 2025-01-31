import "next-auth";
import { DefaultSession, DefaultJWT } from "next-auth";

declare module "next-auth" {
  interface User {
    username?: string;
    role?: string;
  }

  interface Session extends DefaultSession {
    user: {
      id?: string;
      username?: string;
      role?: string;
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    username?: string;
    role?: string;
  }
}