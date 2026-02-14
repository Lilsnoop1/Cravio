import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { resend } from "@/lib/resend"
import { buildLoginEmail } from "@/lib/emailTemplates"
import "next-auth";
import type { AuthSessionUser, AuthUserProfile } from "@/app/Data/database";

declare module "next-auth" {
  interface User extends AuthUserProfile {
    id: string;
    role: string;
  }

  interface Session {
    user: AuthSessionUser;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: { params: { prompt: "consent", access_type: "offline", response_type: "code" } },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt", // JWT-based session
  },
  callbacks: {
    async signIn({ user }) {
      // Fetch user with role from database
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email! },
        select: { id: true, role: true }
      });

      if (dbUser) {
        const typedUser = user as AuthUserProfile;
        typedUser.id = dbUser.id;
        typedUser.role = dbUser.role;
      }

      return true;
    },
    async jwt({ token, user, account }) {
      // user is only defined on first sign in
      const tokenWithRole = token as { id?: string; role?: string; accessToken?: string | null; email?: string | null };
      if (user) {
        const typedUser = user as AuthUserProfile;
        tokenWithRole.email = user.email;
        tokenWithRole.id = typedUser.id;      // Prisma user ID
        tokenWithRole.role = typedUser.role;  // User role
        tokenWithRole.accessToken = account?.access_token || null;

        // Send login email on successful authentication
        if (process.env.RESEND_API_KEY && user.email) {
          const email = buildLoginEmail({
            userName: user.name,
            userEmail: user.email,
            loginTime: new Date(),
          });
          resend.emails
            .send({
              from: "Cravio <orders@craviopk.com>",
              to: user.email,
              subject: email.subject,
              html: email.html,
            })
            .catch((err) => console.error("Resend login email failed", err));
        }
      } else if (tokenWithRole.email) {
        // Refresh role/id from DB on each JWT issuance to avoid stale role leakage
        const dbUser = await prisma.user.findUnique({
          where: { email: tokenWithRole.email },
          select: { id: true, role: true },
        });
        if (dbUser) {
          tokenWithRole.id = dbUser.id;
          tokenWithRole.role = dbUser.role;
        } else {
          tokenWithRole.role = undefined;
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        const tokenWithRole = token as { id?: string; role?: string; accessToken?: string | null };
        session.user.id = (tokenWithRole.id as string) || session.user.id
        session.user.role = (tokenWithRole.role as string) ?? "USER"
        ;(session as { accessToken?: string | null }).accessToken =
          tokenWithRole.accessToken ?? null
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
