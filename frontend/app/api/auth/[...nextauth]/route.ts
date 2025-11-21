import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "BackendSession",
      credentials: {
        userJson: { label: "User JSON payload", type: "text" },
      },
      async authorize(credentials, req) {
        if (credentials?.userJson) {
          try {
            return JSON.parse(credentials.userJson);
          } catch (error) {
            console.warn("Failed to parse userJson credential", error);
          }
        }
        try {
          const cookieHeader = req?.headers?.cookie ?? "";
          const response = await fetch(`${backendBaseUrl}/auth/me`, {
            headers: {
              cookie: cookieHeader,
            },
            credentials: "include",
            cache: "no-store",
          });

          if (!response.ok) {
            return null;
          }

          const data = await response.json();
          if (!data?.user?._id) {
            return null;
          }

          const user = data.user;
          return {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            clearanceLevel: user.clearanceLevel,
            mfaEnabled: user.mfaEnabled,
          };
        } catch (error) {
          console.error("NextAuth authorize error", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = user;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.user) {
        session.user = token.user as typeof session.user;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

