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
        });
        if (panelUser && panelUser.active) {
          const valid = await bcrypt.compare(credentials.password, panelUser.passwordHash);
          if (valid) {
            return { id: panelUser.id, name: panelUser.name, email: `${panelUser.username}@tekertakip.com`, role: panelUser.role };
          }
        }

        throw new Error("Kullanıcı adı veya şifre yanlış");
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as { id?: string; role?: string }).id = token.id as string;
        (session.user as { id?: string; role?: string }).role = token.role as string;
      }
      return session;
    },
  },
};
