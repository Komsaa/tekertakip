import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/tenant";
import bcrypt from "bcryptjs";
import { parseMobileAccount } from "@/lib/mobile-account-input";
import { companyAccessError } from "@/lib/access-policy";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireAdmin(session); if (denied) return denied;
  let input;
  try { input = parseMobileAccount(await req.json()); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Geçersiz form" }, { status: 400 }); }
  const { role, companyId, name, phone, mobileUsername, mobilePin } = input;
  for (let i = 1; i <= 5; i++) {
    if ((process.env[`ADMIN${i}_USERNAME`] ?? "").toLowerCase() === mobileUsername)
      return NextResponse.json({ error: "Kullanıcı adı kullanımda" }, { status: 409 });
  }
  try {
    const hash = await bcrypt.hash(mobilePin, 10);
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.findUnique({ where: { id: companyId } });
      const accessError = companyAccessError(company);
      if (accessError) throw new Error(accessError);
      const [driver, parent, manager] = await Promise.all([
        tx.driver.findFirst({ where: { mobileUsername: { equals: mobileUsername, mode: "insensitive" } }, select: { id: true } }),
        tx.routePassenger.findFirst({ where: { veliUsername: { equals: mobileUsername, mode: "insensitive" } }, select: { id: true } }),
        tx.panelUser.findFirst({ where: { OR: [{ username: { equals: mobileUsername, mode: "insensitive" } }, { mobileUsername: { equals: mobileUsername, mode: "insensitive" } }] }, select: { id: true } }),
      ]);
      if (driver || parent || manager) throw new Error("Kullanıcı adı kullanımda");
      if (role === "manager") return tx.panelUser.create({
        data: { name, phone: phone || null, companyId, username: mobileUsername, passwordHash: hash, mobileUsername, mobilePin: hash, role: "firma", active: true },
        select: { id: true, name: true, mobileUsername: true },
      });
      const count = await tx.driver.count({ where: { companyId, status: { not: "deleted" } } });
      if (count >= company!.driverLimit) throw new Error("Firmanın şoför limiti dolu");
      return tx.driver.create({ data: { name, phone: phone || null, companyId, mobileUsername, mobilePin: hash, status: "active" }, select: { id: true, name: true, mobileUsername: true } });
    }, { isolationLevel: "Serializable" });
    return NextResponse.json({ ...result, role }, { status: 201 });
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === "P2002" || code === "P2034") return NextResponse.json({ error: "Kullanıcı adı kullanımda veya eşzamanlı işlem var; kontrol edip yeniden deneyin" }, { status: 409 });
    const message = e instanceof Error ? e.message : "";
    const expected = ["Kullanıcı adı kullanımda", "Firmanın şoför limiti dolu", "Şirket bilgisi bulunamadı. Lütfen destek ile iletişime geçin.", "Bu işletmenin erişimi askıya alınmış", "Demo süreniz dolmuştur. Abonelik için destek ile iletişime geçin."];
    return NextResponse.json({ error: expected.includes(message) ? message : "Hesap oluşturulamadı" }, { status: expected.includes(message) ? 400 : 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const _adminErr = requireAdmin(session); if (_adminErr) return _adminErr;

  const drivers = await prisma.driver.findMany({
    where: { mobileUsername: { not: null } },
    select: {
      id: true,
      name: true,
      phone: true,
      mobileUsername: true,
      status: true,
      createdAt: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(drivers);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const _adminErr = requireAdmin(session); if (_adminErr) return _adminErr;

  const { id, mobileUsername, mobilePin } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const driver = await prisma.driver.update({
    where: { id },
    data: {
      ...(mobileUsername !== undefined ? { mobileUsername: mobileUsername || null } : {}),
      ...(mobilePin !== undefined && mobilePin.trim() !== "" ? {
        mobilePin: await bcrypt.hash(mobilePin.trim(), 10),
      } : {}),
    },
    select: { id: true, name: true, mobileUsername: true },
  });

  return NextResponse.json(driver);
}
