import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { historyReply as reply, tripHistoryResponse } from "@/lib/trip-history-response";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
 try {
 const session = await getServerSession(authOptions);
 if (!session?.user) return reply({ error: "Yeniden giriş yapın." }, 401);
 const user = session.user as { role?: string; companyId?: string };
 if (!user.role || !["admin", "firma"].includes(user.role) || !user.companyId) return reply({ error: "Firma bağlantılı yönetici hesabı gerekli." }, 403);
 return await tripHistoryResponse(req, user.companyId);
 } catch { return reply({ error: "Geçmiş kayıtları alınamadı. Tekrar giriş yapıp deneyin." }, 500); }
}
