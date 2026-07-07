import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Settings, Bot, Database, Users, Phone, Building2, Shield } from "lucide-react";

export default async function AyarlarPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const companyId = (session.user as any)?.companyId;
  const role = (session.user as any)?.role;
  const isAdmin = !role || role === "admin";

  let company: { name: string; code: string; type: string; isDemo: boolean; demoExpiresAt: Date | null; driverLimit: number; createdAt: Date } | null = null;
  if (companyId) {
    company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true, code: true, type: true, isDemo: true, demoExpiresAt: true, driverLimit: true, createdAt: true },
    });
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Ayarlar</h1>
        <p className="text-slate-500 text-sm mt-1">Hesap bilgileri ve sistem ayarları</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Firma / Hesap Bilgileri */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#DC2626]" />
            {isAdmin ? "Süper Admin" : "Firma Bilgileri"}
          </h2>
          {isAdmin ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-slate-500">Rol</span>
                <span className="font-semibold text-[#DC2626]">Süper Admin</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Kullanıcı</span>
                <span className="font-semibold">{session.user?.name}</span>
              </div>
            </div>
          ) : company ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-slate-500">Firma Adı</span>
                <span className="font-semibold">{company.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-slate-500">Firma Kodu</span>
                <span className="font-mono font-bold text-[#DC2626]">{company.code}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-slate-500">Hesap Türü</span>
                <span className="font-semibold capitalize">{company.type === "okul" ? "Okul Servisi" : "Taşımacılık Firması"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-slate-500">Şöför Limiti</span>
                <span className="font-semibold">{company.driverLimit} şöför</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-slate-500">Durum</span>
                {company.isDemo ? (
                  <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                    Demo
                    {company.demoExpiresAt && ` · ${Math.ceil((company.demoExpiresAt.getTime() - Date.now()) / 86400000)} gün kaldı`}
                  </span>
                ) : (
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold">Aktif</span>
                )}
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Kayıt Tarihi</span>
                <span className="font-semibold">{company.createdAt.toLocaleDateString("tr-TR")}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Firma bilgisi bulunamadı.</p>
          )}
        </div>

        {/* WhatsApp Bot */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Bot className="w-5 h-5 text-green-500" />
            WhatsApp Bot
          </h2>
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 font-mono text-sm">
              <div className="text-slate-500 text-xs mb-2 font-sans font-semibold">Bot başlatma komutu:</div>
              <code className="text-slate-700">npm run bot</code>
            </div>
            <div className="text-sm text-slate-600 space-y-2">
              <p><span className="font-semibold">1.</span> Fazlalık telefona WhatsApp kur</p>
              <p><span className="font-semibold">2.</span> VPS&apos;te <code className="bg-slate-100 px-1 rounded text-xs">npm run bot</code> çalıştır</p>
              <p><span className="font-semibold">3.</span> Terminaldeki QR kodu tara</p>
              <p><span className="font-semibold">4.</span> Bot grubu dinlemeye başlar</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
              <strong>Grup adı</strong> .env dosyasındaki <code>WHATSAPP_GROUP_NAME</code> ile eşleşmeli.
            </div>
          </div>
        </div>

        {/* Panel Kullanıcıları */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Panel Kullanıcıları
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Panel şifresi değişikliği için tekertakip.com destek hattıyla iletişime geçin.
          </p>
          <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-2">
            <div className="flex items-center gap-2 text-slate-600">
              <Shield className="w-4 h-4 text-blue-500 flex-shrink-0" />
              Şifreler güvenli hash ile saklanır
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Shield className="w-4 h-4 text-blue-500 flex-shrink-0" />
              Oturum süresi 30 gündür
            </div>
          </div>
          <a
            href="https://wa.me/905061227363?text=Merhaba%2C%20TekerTakip%20panel%20kullanıcı%20yönetimi%20hakkında%20yardım%20almak%20istiyorum."
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-all"
          >
            <Phone className="w-4 h-4" />
            Destek Al
          </a>
        </div>

        {/* Veritabanı */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-500" />
            Sistem
          </h2>
          <div className="space-y-3 text-sm">
            <div className="bg-slate-50 rounded-xl p-3 font-mono text-xs space-y-1">
              <div className="text-slate-400"># Şema güncelleme:</div>
              <div className="text-slate-700">npm run db:push</div>
              <div className="text-slate-400 mt-2"># Görsel yönetim:</div>
              <div className="text-slate-700">npm run db:studio</div>
              <div className="text-slate-400 mt-2"># İlk veri:</div>
              <div className="text-slate-700">npm run db:seed</div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
              Coolify&apos;da PostgreSQL servisi eklediğinde bağlantı stringini <strong>DATABASE_URL</strong> olarak ayarla.
            </div>
          </div>
        </div>
      </div>

      {/* Belge Süreleri Hatırlatıcısı */}
      <div className="bg-[#1B2437] rounded-2xl p-6 text-white">
        <h2 className="font-bold mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#DC2626]" />
          Belge Yenileme Takvimi
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          {[
            { label: "SRC-2 Belgesi", period: "5 yılda bir", type: "Şöför" },
            { label: "Psikoteknik", period: "5 yılda bir (2 yıl olabilir)", type: "Şöför" },
            { label: "Adli Sicil Kaydı", period: "Yıllık (3 ay geçerli)", type: "Şöför" },
            { label: "Sağlık Raporu", period: "Yıllık", type: "Şöför" },
            { label: "Teknik Muayene", period: "6 AYDA BİR", type: "Araç", urgent: true },
            { label: "Trafik Sigortası", period: "Yıllık", type: "Araç" },
            { label: "Güzergah İzni", period: "Yıllık", type: "Araç" },
            { label: "Okul Uygunluk / J Plaka", period: "Yıllık (her Eylül)", type: "Araç" },
          ].map((item) => (
            <div key={item.label} className={`rounded-xl p-3 ${"urgent" in item && item.urgent ? "bg-red-500/20 border border-red-500/30" : "bg-white/5 border border-white/10"}`}>
              <div className={`text-xs font-semibold mb-1 ${item.type === "Şöför" ? "text-blue-300" : "text-amber-300"}`}>{item.type}</div>
              <div className="font-medium">{item.label}</div>
              <div className={`text-xs mt-1 ${"urgent" in item && item.urgent ? "text-red-300 font-bold" : "text-slate-400"}`}>{item.period}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
