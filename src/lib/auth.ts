import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 gün
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Kullanıcı Adı", type: "text" },
        password: { label: "Şifre", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Kullanıcı adı ve şifre gerekli");
        }

        // Env'deki admin hesaplarını kontrol et
        for (let i = 1; i <= 5; i++) {
          const envUser = process.env[`ADMIN${i}_USERNAME`];
          const envPass = process.env[`ADMIN${i}_PASSWORD`];
          if (!envUser) break;
          if (credentials.username === envUser && credentials.password === envPass) {
            return { id: `admin${i}`, name: envUser, email: `${envUser}@tekertakip.com`, role: "admin" };
          }
        }

        // DB'deki panel kullanıcılarını kontrol et
        const panelUser = await prisma.panelUser.findUnique({
          where: { username: credentials.username },
          select: { id: true, name: true, passwordHash: true, active: true, role: true, companyId: true, company: { select: { type: true } } },
        });
        if (panelUser && panelUser.active) {
          const valid = await bcrypt.compare(credentials.password, panelUser.passwordHash);
          if (valid) {
            return { id: panelUser.id, name: panelUser.name, email: `${credentials.username}@tekertakip.com`, role: panelUser.role, companyId: panelUser.companyId, companyType: panelUser.company?.type ?? "firma" };
          }
        }

        throw new Error("Kullanıcı adı veya şifre yanlış");
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.companyId = (user as any).companyId ?? null;
        token.companyType = (user as any).companyType ?? "firma";
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).companyId = token.companyId ?? null;
        (session.user as any).companyType = token.companyType ?? "firma";
      }
      return session;
    },
  },
};
