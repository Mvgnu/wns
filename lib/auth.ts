import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { JWT } from "next-auth/jwt";

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isAdmin?: boolean;
    }
  }
}

// Generate a default secret if NEXTAUTH_SECRET is not set
const getSecret = () => {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    console.warn(
      "⚠️ No NEXTAUTH_SECRET defined. This is insecure! ⚠️\nUsing fallback secret - set NEXTAUTH_SECRET in .env.local"
    );
    return "insecure-fallback-secret-must-change";
  }
  return secret;
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("E-Mail und Passwort sind erforderlich");
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              password: true,
              isAdmin: true
            }
          });

          if (!user || !user.password) {
            throw new Error("Benutzer nicht gefunden");
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            throw new Error("Ungültiges Passwort");
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            isAdmin: user.isAdmin
          };
        } catch (error) {
          console.error("Authentication error:", error);
          if (error instanceof Error) {
            throw new Error(error.message || "Authentication failed");
          }
          throw new Error("Authentication failed");
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        
        // Optionally add additional user data from token
        if (token.isAdmin !== undefined) {
          session.user.isAdmin = token.isAdmin as boolean;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.sub = user.id;
        // Add any additional user properties you want in the JWT
        if ('isAdmin' in user) {
          token.isAdmin = user.isAdmin;
        }
      }
      return token;
    },
    // Add redirect callback to ensure proper post-authentication redirects
    async redirect({ url, baseUrl }) {
      // Always redirect back to the site
      if (url.startsWith(baseUrl)) {
        return url;
      }
      // If it's an absolute URL to another domain, prevent redirect
      if (url.startsWith("http")) {
        return baseUrl;
      }
      // Handle relative URLs
      return baseUrl + url;
    }
  },
  // Ensure proper secret handling
  secret: getSecret(),
  debug: process.env.NODE_ENV !== "production",
  // Enable easier debugging in development
  logger: {
    error(code, metadata) {
      console.error({ type: 'NextAuth error', code, metadata });
    },
    warn(code) {
      console.warn({ type: 'NextAuth warning', code });
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV !== 'production') {
        console.debug({ type: 'NextAuth debug', code, metadata });
      }
    },
  },
  events: {
    async signIn(message) {
      console.log('User signed in:', message.user.email);
    },
    async signOut(message) {
      console.log('User signed out:', message.session?.user?.email);
    },
    async createUser(message) {
      console.log('User created:', message.user.email);
    },
    async linkAccount(message) {
      console.log('Account linked:', message.account.provider);
    },
    async session(message) {
      if (process.env.NODE_ENV !== 'production') {
        console.debug('Session accessed:', message.session.user?.email);
      }
    },
  },
  // Cookie configuration for both environments
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? `__Secure-next-auth.session-token` : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production"
      }
    },
    callbackUrl: {
      name: process.env.NODE_ENV === "production" ? `__Secure-next-auth.callback-url` : `next-auth.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production"
      }
    },
    csrfToken: {
      name: process.env.NODE_ENV === "production" ? `__Host-next-auth.csrf-token` : `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production"
      }
    }
  }
}; 