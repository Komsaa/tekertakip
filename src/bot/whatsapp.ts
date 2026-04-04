/**
 * MertTur WhatsApp Bot - Baileys tabanlı
 *
 * Kurulum:
 * 1. npm install @whiskeysockets/baileys qrcode-terminal
 * 2. .env dosyasına WHATSAPP_GROUP_NAME ekle
 * 3. npm run bot
 * 4. QR kodu telefonla tara
 *
 * Nasıl çalışır:
 * - Bot, belirlenen WhatsApp grubunu dinler
 * - Şöför fiş fotoğrafı + km bilgisi atınca otomatik parse eder
 * - /api/fuel endpoint'ine kayıt yapar
 *
 * Şöförlere anlatılacak format:
 * 📸 Fiş fotoğrafı
 * + mesaj: "45J9443 - 125400 km"
 * VEYA sadece: "45J9443 125400"
 */

// Baileys'i kurmak için: npm install @whiskeysockets/baileys
// Bu dosya ayrı bir process olarak çalışır

const GROUP_NAME = process.env.WHATSAPP_GROUP_NAME ?? "Mert Tur Yakıt";
const REPORT_GROUP = process.env.WHATSAPP_REPORT_GROUP ?? GROUP_NAME; // rapor gönderilecek grup (varsayılan aynı grup)
const API_BASE = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

async function buildDailyReport(): Promise<string> {
  try {
    const today = new Date();
    const todayStr = today.toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" });
    const start = new Date(today); start.setHours(0, 0, 0, 0);
    const end = new Date(today); end.setHours(23, 59, 59, 999);

    // Prisma direkt kullan (bot aynı process içinde çalışıyor)
    const { prisma } = await import("@/lib/prisma");

    const [todayJobs, monthFuel, expiringVehicles, openReports] = await Promise.all([
      prisma.job.findMany({
        where: { date: { gte: start, lte: end }, status: { not: "cancelled" } },
        include: { driver: { select: { name: true } }, vehicle: { select: { plate: true } } },
      }),
      prisma.fuelEntry.aggregate({
        _sum: { totalAmount: true, liters: true },
        where: { date: { gte: new Date(today.getFullYear(), today.getMonth(), 1) } },
      }),
      prisma.vehicle.findMany({
        where: {
          status: "active",
          OR: [
            { insuranceExpiry: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } },
            { inspectionExpiry: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } },
          ],
        },
        select: { plate: true, insuranceExpiry: true, inspectionExpiry: true },
      }),
      prisma.vehicleReport.findMany({
        where: { status: "open" },
        include: { driver: { select: { name: true } }, vehicle: { select: { plate: true } } },
      }).catch(() => []),
    ]);

    let msg = `🚌 *tekertakip — Günlük Rapor*\n📅 ${todayStr}\n\n`;

    // Bugünkü seferler
    if (todayJobs.length === 0) {
      msg += `📋 *Bugün sefer yok*\n\n`;
    } else {
      msg += `📋 *Bugünkü Seferler (${todayJobs.length})*\n`;
      for (const j of todayJobs) {
        msg += `  • ${j.startTime} ${j.title} — ${j.driver?.name ?? "?"} / ${j.vehicle?.plate ?? "?"}\n`;
      }
      msg += "\n";
    }

    // Bu ay yakıt
    const monthTotal = monthFuel._sum.totalAmount ?? 0;
    const monthLiters = monthFuel._sum.liters ?? 0;
    if (monthTotal > 0) {
      msg += `⛽ *Bu Ay Yakıt:* ${monthLiters.toFixed(0)} lt · ₺${monthTotal.toLocaleString("tr-TR", { minimumFractionDigits: 0 })}\n\n`;
    }

    // Yaklaşan belgeler
    if (expiringVehicles.length > 0) {
      msg += `⚠️ *30 Gün İçinde Biten Belgeler:*\n`;
      for (const v of expiringVehicles) {
        if (v.insuranceExpiry && v.insuranceExpiry <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
          const days = Math.ceil((v.insuranceExpiry.getTime() - Date.now()) / 86400000);
          msg += `  • ${v.plate} sigortası — ${days} gün\n`;
        }
        if (v.inspectionExpiry && v.inspectionExpiry <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
          const days = Math.ceil((v.inspectionExpiry.getTime() - Date.now()) / 86400000);
          msg += `  • ${v.plate} muayenesi — ${days} gün\n`;
        }
      }
      msg += "\n";
    }

    // Açık arızalar
    if (openReports.length > 0) {
      msg += `🔧 *Açık Arızalar (${openReports.length}):*\n`;
      for (const r of openReports) {
        msg += `  • ${r.vehicle?.plate ?? "?"} — ${r.description.slice(0, 50)}\n`;
      }
      msg += "\n";
    }

    msg += `🔗 ${API_BASE}/panel`;
    return msg;
  } catch (e) {
    console.error("Rapor oluşturulamadı:", e);
    return `🚌 tekertakip günlük raporu oluşturulamadı. Panel: ${API_BASE}/panel`;
  }
}

function scheduleDailyReport(sock: any) {
  async function sendReport() {
    try {
      const groups = await sock.groupFetchAllParticipating();
      const group = Object.values(groups as Record<string, { id: string; subject: string }>)
        .find((g) => g.subject.includes(REPORT_GROUP.slice(0, 8)));
      if (!group) { console.log("Rapor grubu bulunamadı"); return; }

      const msg = await buildDailyReport();
      await sock.sendMessage(group.id, { text: msg });
      console.log("✅ Günlük rapor gönderildi");
    } catch (e) {
      console.error("Rapor gönderilemedi:", e);
    }
  }

  function scheduleNext() {
    const now = new Date();
    const next = new Date();
    next.setHours(7, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    const ms = next.getTime() - now.getTime();
    console.log(`⏰ Sonraki rapor: ${next.toLocaleString("tr-TR")} (${Math.round(ms / 60000)} dk sonra)`);
    setTimeout(async () => { await sendReport(); scheduleNext(); }, ms);
  }

  scheduleNext();
}

// Plaka + KM parser
function parseMessage(text: string): { plate: string; km: number | null } | null {
  if (!text) return null;

  // Plakayı bul: 45J9443, 45 J 9443, 45j9443 gibi formatlar
  const plateMatch = text.match(/(\d{2})\s*([A-Za-z]{1,3})\s*(\d{2,4})/);
  if (!plateMatch) return null;
  const plate = `${plateMatch[1]} ${plateMatch[2].toUpperCase()} ${plateMatch[3]}`;

  // KM bul
  const kmMatch = text.match(/(\d{4,7})\s*(km|KM)?/g);
  let km: number | null = null;
  if (kmMatch) {
    for (const m of kmMatch) {
      const num = parseInt(m.replace(/[^0-9]/g, ""));
      if (num > 10000 && num < 9999999) { km = num; break; }
    }
  }

  return { plate, km };
}

async function startBot() {
  try {
    // Dynamic import - Baileys kurulu değilse hata vermez
    const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = await import(
      "@whiskeysockets/baileys" as string
    );

    console.log("🤖 MertTur WhatsApp Bot başlatılıyor...");
    console.log(`📱 Grup: "${GROUP_NAME}"`);

    const { state, saveCreds } = await useMultiFileAuthState("./bot-auth");

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update: { connection?: string; lastDisconnect?: { error?: { output?: { statusCode?: number } } } }) => {
      const { connection, lastDisconnect } = update;
      if (connection === "close") {
        const shouldReconnect = (lastDisconnect?.error as { output?: { statusCode?: number } })?.output?.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) {
          console.log("🔄 Yeniden bağlanılıyor...");
          startBot();
        }
      } else if (connection === "open") {
        console.log("✅ WhatsApp bağlantısı kuruldu!");
      }
    });

    // Gelen mesajları dinle
    sock.ev.on("messages.upsert", async ({ messages }: { messages: Array<{
      key: { remoteJid?: string; fromMe?: boolean };
      message?: {
        conversation?: string;
        extendedTextMessage?: { text?: string };
        imageMessage?: { caption?: string };
      };
    }> }) => {
      for (const msg of messages) {
        if (msg.key.fromMe) continue;
        if (!msg.message) continue;

        // Sadece hedef grubu dinle
        const chatId = msg.key.remoteJid ?? "";
        if (!chatId.endsWith("@g.us")) continue;

        // Grup adını kontrol et
        try {
          const groupMeta = await sock.groupMetadata(chatId);
          if (!groupMeta.subject.includes(GROUP_NAME.slice(0, 8))) continue;
        } catch {
          continue;
        }

        // Mesaj içeriğini al
        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          msg.message.imageMessage?.caption ||
          "";

        if (!text.trim()) continue;

        console.log(`📨 Yeni mesaj: "${text.slice(0, 80)}"`);

        // Parse et
        const parsed = parseMessage(text);
        if (!parsed) {
          console.log("  ⚠️  Plaka bulunamadı, atlanıyor");
          continue;
        }

        console.log(`  🚌 Plaka: ${parsed.plate}, KM: ${parsed.km ?? "yok"}`);

        // Araç ID'sini bul
        try {
          const res = await fetch(`${API_BASE}/api/vehicles`);
          if (!res.ok) continue;
          const vehicles = await res.json() as Array<{ id: string; plate: string }>;
          const vehicle = vehicles.find(
            (v) => v.plate.replace(/\s/g, "").toLowerCase() === parsed.plate.replace(/\s/g, "").toLowerCase()
          );

          if (!vehicle) {
            console.log(`  ❌ Araç bulunamadı: ${parsed.plate}`);
            await sock.sendMessage(chatId, {
              text: `⚠️ ${parsed.plate} plakası sistemde bulunamadı. Lütfen manuel giriş yapın.`,
            });
            continue;
          }

          // Yakıt kaydı oluştur (tutar/litre olmadan - onay bekler)
          const fuelRes = await fetch(`${API_BASE}/api/fuel`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              vehicleId: vehicle.id,
              date: new Date().toISOString().split("T")[0],
              liters: 0,
              totalAmount: 0,
              odometer: parsed.km,
              paymentType: "veresiye",
              parsedFrom: "whatsapp",
              rawText: text,
              notes: "WhatsApp'tan otomatik - tutar girilmeli",
            }),
          });

          if (fuelRes.ok) {
            console.log(`  ✅ Kaydedildi: ${parsed.plate}`);
            await sock.sendMessage(chatId, {
              text: `✅ ${parsed.plate} kaydedildi${parsed.km ? ` (${parsed.km.toLocaleString("tr-TR")} km)` : ""}.\n💡 Litre ve tutarı panel üzerinden tamamlayın: ${API_BASE}/panel/yakit`,
            });
          }
        } catch (err) {
          console.error("  ❌ API hatası:", err);
        }
      }
    });

    // Günlük sabah raporu - her gün 07:00'de gönder
    scheduleDailyReport(sock);

    console.log("\n📋 Şöförlere söylenecek format:");
    console.log("   📸 Fiş fotoğrafı + mesaj: '45J9443 - 125400 km'");
    console.log(`   Panel: ${API_BASE}/panel/yakit`);

  } catch (err) {
    if ((err as { code?: string }).code === "MODULE_NOT_FOUND") {
      console.error("\n❌ Baileys kurulu değil!");
      console.error("Kurmak için: npm install @whiskeysockets/baileys qrcode-terminal");
    } else {
      console.error("Bot hatası:", err);
    }
  }
}

startBot();
