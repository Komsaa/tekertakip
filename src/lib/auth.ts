import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { companyAccessError } from "./access-policy";

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
          where: { username: credentials.username.trim().toLowerCase() },
          select: { id: true, name: true, passwordHash: true, active: true, role: true, companyId: true, company: { select: { type: true, isDemo: true, demoExpiresAt: true, active: true } } },
        });
        if (panelUser && panelUser.active) {
          const valid = await bcrypt.compare(credentials.password, panelUser.passwordHash);
          if (valid) {
            const co = panelUser.company;
            if (panelUser.companyId || panelUser.role !== "admin") {
              const accessError = companyAccessError(co);
              if (accessError) throw new Error(accessError);
            }
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
      // A signed cookie is not proof that its account still has access.
      const identityId = typeof token.id === "string" ? token.id : "";
      const envAdmin = /^admin([1-5])$/.exec(identityId);
      if (envAdmin) {
        const envName = process.env[`ADMIN${envAdmin[1]}_USERNAME`];
        const envPassword = process.env[`ADMIN${envAdmin[1]}_PASSWORD`];
        if (!envName || !envPassword || token.name !== envName || token.role !== "admin") {
          throw new Error("Session revoked");
        }
        if (!token.impersonating && token.companyId) throw new Error("Session scope changed");
      } else {
        if (!identityId) throw new Error("Session identity missing");
        const current = await prisma.panelUser.findUnique({
          where: { id: identityId },
          select: { active: true, role: true, companyId: true, updatedAt: true,
            company: { select: { active: true, isDemo: true, demoExpiresAt: true, type: true } } },
        });
        if (!current?.active || current.role !== token.role) throw new Error("Session revoked");
        if (token.impersonating) {
          if (current.role !== "admin" || current.companyId) throw new Error("Session scope changed");
        } else {
          if (current.companyId !== (token.companyId ?? null)) throw new Error("Session scope changed");
          if ((current.companyId || current.role !== "admin") && companyAccessError(current.company)) {
            throw new Error("Company access revoked");
          }
          token.companyType = current.company?.type ?? "firma";
        }
        const version = current.updatedAt.getTime();
        if (!user && token.accountVersion !== undefined && token.accountVersion !== version) {
          throw new Error("Account changed; please sign in again");
        }
        token.accountVersion = version;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).companyId = token.companyId ?? null;
        (session.user as any).companyType = token.companyType ?? "firma";
        (session.user as any).impersonating = token.impersonating ?? false;
        (session.user as any).impersonatedCompanyName = token.impersonatedCompanyName ?? null;
      }
      return session;
    },
  },
};
