import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

function assertProductionAuthConfiguration() {
  if (process.env.NODE_ENV !== "production") return;

  if (!process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET.length < 32) {
    throw new Error("NEXTAUTH_SECRET must be at least 32 characters in production.");
  }
  if (!process.env.NEXTAUTH_URL?.startsWith("https://")) {
    throw new Error("NEXTAUTH_URL must be an HTTPS URL in production.");
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        assertProductionAuthConfiguration();
        if (!credentials?.username || !credentials?.password) return null;

        const formData = new URLSearchParams();
        formData.append("username", credentials.username);
        formData.append("password", credentials.password);

        try {
          const res = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formData,
          });
          if (!res.ok) {
            return null;
          }

          const data = await res.json();

          if (data?.access_token) {
            return {
              id: credentials.username,
              name: credentials.username,
              accessToken: data.access_token,
            };
          }
        } catch (error) {
          console.error("Authentication service is unavailable:", error);
          return null;
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session) {
        session.user = {
          ...session.user,
          accessToken: token.accessToken,
        };
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};