import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { companyAccessError } from "@/lib/access-policy";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string } | undefined)?.id;
  if (!userId || /^admin[1-5]?$/.test(userId)) {
    return NextResponse.json(
      {
        error:
          "Bu yönetici hesabının şifresi sunucu ayarlarından değiştirilir.",
      },
      { status: 400 },
    );
  }
  const body = await req.json().catch(() => null);
  if (
    !body ||
    typeof body.currentPassword !== "string" ||
    typeof body.newPassword !== "string" ||
    !body.currentPassword
  ) {
    return NextResponse.json(
      { error: "Mevcut ve yeni şifre zorunludur" },
      { status: 400 },
    );
  }
  const { currentPassword, newPassword } = body;
  if (
    newPassword.length < 6 ||
    Buffer.byteLength(newPassword, "utf8") > 72 ||
    currentPassword.length > 1024
  ) {
    return NextResponse.json(
      {
        error:
          "Yeni şifre en az 6 karakter ve UTF-8 olarak en fazla 72 bayt olmalıdır.",
      },
      { status: 400 },
    );
  }
  try {
    const user = await prisma.panelUser.findUnique({
      where: { id: userId },
      include: {
        company: {
          select: { active: true, isDemo: true, demoExpiresAt: true },
        },
      },
    });
    if (!user?.active)
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı veya hesap pasif." },
        { status: 403 },
      );
    if (
      (user.companyId || user.role !== "admin") &&
      companyAccessError(user.company)
    ) {
      return NextResponse.json(
        { error: "İşletmenin erişimi kapalı." },
        { status: 403 },
      );
    }
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return NextResponse.json(
        { error: "Mevcut şifre yanlış" },
        { status: 400 },
      );
    }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    // Prevent a concurrent request from overwriting a password that has just changed.
    const updated = await prisma.panelUser.updateMany({
      where: { id: userId, passwordHash: user.passwordHash, active: true },
      data: { passwordHash },
    });
    if (updated.count !== 1)
      return NextResponse.json(
        { error: "Şifreniz değişmiş olabilir. Lütfen yeniden deneyin." },
        { status: 409 },
      );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[change-password]", error);
    return NextResponse.json(
      { error: "Şifre güncellenemedi. Lütfen tekrar deneyin." },
      { status: 500 },
    );
  }
}
