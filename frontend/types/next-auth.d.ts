import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user?: {
      id: string;
      name: string;
      email: string;
      role: string;
      department: string;
      clearanceLevel: string;
      mfaEnabled?: boolean;
    };
    accessToken?: string;
    refreshToken?: string;
  }

  interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
    clearanceLevel: string;
    mfaEnabled?: boolean;
    accessToken?: string;
    refreshToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user?: {
      id: string;
      name: string;
      email: string;
      role: string;
      department: string;
      clearanceLevel: string;
      mfaEnabled?: boolean;
    };
    accessToken?: string;
    refreshToken?: string;
  }
}

