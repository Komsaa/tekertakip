import { NextRequest } from "next/server";
import { getActiveManager } from "@/lib/manager-access";
import { historyReply as reply, tripHistoryResponse } from "@/lib/trip-history-response";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
 try {
 const auth = req.headers.get("Authorization");
 const manager = auth?.startsWith("Bearer ") ? await getActiveManager(auth.slice(7).trim()) : null;
 if (!manager) return reply({ error: "Oturumunuz geçersiz. Yeniden giriş yapın." }, 401);
 if (!["admin", "firma"].includes(manager.role) || !manager.companyId) return reply({ error: "Firma bağlantılı yönetici hesabı gerekli." }, 403);
 return await tripHistoryResponse(req, manager.companyId);
 } catch { return reply({ error: "Geçmiş kayıtları alınamadı. Tekrar deneyin." }, 500); }
}
