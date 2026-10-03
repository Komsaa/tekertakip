import { verifyManagerTokenFull } from "./manager-token";
import { companyAccessError } from "./access-policy";
import { prisma } from "./prisma";

export async function getActiveManager(token: string) {
  const identity = verifyManagerTokenFull(token);
  if (!identity) return null;
  if (identity.source === "env") {
    for (let i = 1; i <= 5; i++) {
      if (
        process.env[`ADMIN${i}_USERNAME`] === identity.username &&
        process.env[`ADMIN${i}_PASSWORD`]
      ) {
        return {
          ...identity,
          id: `admin${i}`,
          name: identity.username,
          companyType: "firma",
        };
      }
    }
    return null;
  }
  const user = await prisma.panelUser.findUnique({
    where: { username: identity.username },
    select: {
      id: true,
      name: true,
      active: true,
      role: true,
      companyId: true,
      company: {
        select: { active: true, isDemo: true, demoExpiresAt: true, type: true },
      },
    },
  });
  if (
    !user?.active ||
    user.role !== identity.role ||
    user.companyId !== identity.companyId
  )
    return null;
  if (
    (user.companyId || user.role !== "admin") &&
    companyAccessError(user.company)
  )
    return null;
  return {
    ...identity,
    id: user.id,
    name: user.name,
    companyType: user.company?.type ?? "firma",
  };
}
