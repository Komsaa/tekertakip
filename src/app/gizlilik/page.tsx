import Link from "next/link";

export const metadata = {
  title: "Gizlilik Politikası | TekerTakip",
  description: "TekerTakip web ve mobil uygulamalarında kişisel veriler, konum, veri paylaşımı ve silme talepleri hakkında bilgi.",
};

export default function GizlilikPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-800 sm:py-16">
      <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <Link href="/" className="text-sm font-semibold text-red-700">← TekerTakip ana sayfa</Link>
        <h1 className="mt-6 text-3xl font-bold">Gizlilik Politikası</h1>
        <p className="mt-2 text-sm text-slate-500">Son güncelleme: 28 Eylül 2026</p>
        <div className="mt-8 space-y-8 text-sm leading-7 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-bold [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_a]:text-red-700 [&_a]:underline">
          <section>
            <h2>1. Kapsam ve iletişim</h2>
            <p>Bu politika, TekerTakip web paneli ve Android paket adı com.tekertakip.driver olan TekerTakip mobil uygulamasının yönetici, şoför ve veli kullanımını kapsar. Servis firmaları, kendi faaliyetleri kapsamında sisteme girdikleri çalışan, yolcu ve veli kayıtlarını yönetir. TekerTakip, bu kayıtları servis ve filo yönetimi hizmetini sağlamak için işler.</p>
            <p>Gizlilik, erişim ve silme talepleri için <a href="mailto:mertyildirim454@gmail.com">mertyildirim454@gmail.com</a> adresinden ve bağlı olduğunuz servis firmasından destek isteyebilirsiniz.</p>
          </section>
          <section>
            <h2>2. İşlenen veriler ve kullanım amaçları</h2>
            <ul>
              <li><strong>Hesap ve iletişim:</strong> Ad soyad, kullanıcı adı, telefon, firma bilgileri, kimlik doğrulama bilgileri ve oturum belirteçleri; giriş, yetkilendirme ve destek için işlenir.</li>
              <li><strong>Servis ve yolcu kayıtları:</strong> Araç plakası, güzergah, durak, görev, yolcu/öğrenci ve veli bilgileri, biniş ve yoklama kayıtları; servis organizasyonu ve ilgili velinin bilgilendirilmesi için kullanılır.</li>
              <li><strong>Konum:</strong> Şoför cihazının enlem, boylam ve konum zamanı; canlı servis takibi ve güzergah geçmişi için sunucuya iletilir.</li>
              <li><strong>Belgeler ve görseller:</strong> Yüklenen ehliyet, SRC, psikoteknik, sağlık raporu, adli sicil, ikamet ve araç belgeleri ile bunlarda yer alan kimlik, belge ve tarih bilgileri; belge yönetimi için işlenir. Bazı belgeler sağlık veya adli sicil gibi hassas bilgiler içerebilir. Hizmet için gerekli olmayan bilgileri yüklemeyin.</li>
              <li><strong>İşletme kayıtları:</strong> Yakıt fişi ve arıza fotoğrafları, bakım, kilometre, ödeme ve gider kayıtları; işletme takibi ve raporlama için kullanılır.</li>
              <li><strong>Teknik veriler:</strong> Bildirim belirteçleri, bağlantı ve hata kayıtları; bildirimlerin iletilmesi, güvenlik ve teknik sorunların incelenmesi için işlenebilir.</li>
            </ul>
          </section>
          <section>
            <h2>3. Konum ve cihaz izinleri</h2>
            <p>Şoför sefer ekranını kullandığında ve gerekli cihaz izinlerini verdiğinde konum takibi başlatılır. Takip etkin olduğu sürece uygulama arka plandayken veya ekran kilitliyken de konum sunucuya gönderilebilir. Uygulamayı arka plana almak takibi durdurmakla aynı şey değildir. Güncelleme sıklığı hareket, ağ, cihaz ve işletim sistemi koşullarına bağlıdır.</p>
            <p>Sefer ekranından çıkışta takip durdurma işlemi çağrılır. Konum iznini telefon ayarlarından kaldırarak erişimi engelleyebilirsiniz; bu durumda canlı takip çalışmayabilir. Takibi durdurmak daha önce gönderilmiş konum kayıtlarını silmez.</p>
            <p>Kamera ve fotoğraf seçimi yakıt fişi veya arıza görsellerini yüklemek için kullanılır; seçmediğiniz fotoğrafların topluca yüklenmesi amaçlanmaz. Bildirim izni sefer ve servis uyarıları içindir. İzinleri cihaz ayarlarından yönetebilirsiniz.</p>
          </section>
          <section>
            <h2>4. Verilerin paylaşıldığı taraflar</h2>
            <ul>
              <li><strong>Yetkili kullanıcılar:</strong> Firma yöneticileri iş kayıtlarına ve şoför konumlarına; ilgili veliler kendilerine sunulan servis, konum ve yolcu bilgilerine erişebilir.</li>
              <li><strong>Barındırma ve dosya depolama:</strong> Uygulamanın sunucu, veritabanı ve dosya depolama altyapısını sağlayan hizmetler, hizmetin işletilmesi için verileri işler.</li>
              <li><strong>Bildirimler:</strong> Expo ve ilgili platform bildirim altyapıları, bildirim belirteçlerini ve gönderilen bildirim içeriğini işler.</li>
              <li><strong>Google Gemini:</strong> Yapay zeka ile fiş veya belge okuma işlevi etkin olup kullanıldığında ilgili görsel/PDF içeriği, tutar, tarih ve belge alanlarını çıkarmak için Google Gemini hizmetine gönderilebilir. Bu aktarım dosyanın içindeki kişisel bilgileri de içerebilir; yalnızca çıkarılan tarih ile sınırlı değildir.</li>
              <li><strong>Harita ve navigasyon:</strong> Harita/navigasyon işlevlerinde ilgili sağlayıcıya hedef koordinatları veya durak bilgileri iletilebilir. Harici hizmetler kendi gizlilik politikalarına tabidir.</li>
            </ul>
            <p>Bu hizmetlerin kullanımı verilerin Türkiye dışındaki altyapılarda işlenmesini gerektirebilir. Kişisel veriler reklam amacıyla satılmaz. Hizmet sağlayıcılara yapılan işlevsel aktarımlar, verilerin hiç kimseyle paylaşılmadığı anlamına gelmez.</p>
          </section>
          <section>
            <h2>5. Saklama ve güvenlik</h2>
            <p>Uygulama sunucuyla HTTPS üzerinden iletişim kurar. Hesap erişimi oturum ve yetkilendirme kontrolleriyle sınırlandırılır. Hiçbir sistem için mutlak güvenlik garantisi verilemez.</p>
            <p>Hesap, belge ve işletme kayıtlarının saklanması; hizmetin devamına, servis firmasının kayıt ihtiyacına ve varsa geçerli saklama yükümlülüklerine bağlıdır. Tüm kayıtlar için uygulanmış tek bir otomatik silme süresi bulunmamaktadır.</p>
            <p>Konum geçmişinde, yeni geçmiş kaydı yazılırken ilgili şoförün yedi günden eski geçmiş kayıtlarını temizleyen bir işlem bulunur. Yeni kayıt gelmediğinde bu temizlik çalışmayabileceğinden yedi gün kesin silinme garantisi değildir. Son bilinen konum ayrıca şoför kaydında tutulabilir.</p>
          </section>
          <section id="hesap-silme">
            <h2>6. Mobil erişimi kaldırma ve veri silme talebi</h2>
            <p>Şoför ve veli ekranlarındaki “Mobil erişimi kaldır” (eski sürümlerde “Hesabı Sil”) işlemi başarılı olduğunda mobil giriş/oturum bilgilerini kaldırır; veli bildirim belirtecini temizler ve şoför için sunucudaki takip durumunu kapatır. Bu işlem şoför/yolcu kaydı, belgeler, konum geçmişi ve işletme kayıtlarının tamamını otomatik silmez. Tam silme talebi için aşağıdaki iletişim yolunu kullanın.</p>
            <p>Hesabınızın ve ilişkili kişisel verilerinizin silinmesini istemek için uygulamaya giriş yapmadan <a href="mailto:mertyildirim454@gmail.com?subject=TekerTakip%20hesap%20ve%20veri%20silme%20talebi">mertyildirim454@gmail.com adresine hesap ve veri silme talebi</a> gönderebilirsiniz. Talebinizde kullanıcı adınızı, bağlı olduğunuz firmayı ve talebinizin kapsamını belirtin. Şifre, PIN veya kimlik belgesi göndermeyin.</p>
            <p>Talep, hesap sahipliğinin doğrulanması ve ilgili servis firmasıyla kayıtların değerlendirilmesini gerektirebilir. Silinemeyen kayıtlar için saklama gerekçesi ve süresi hakkında bilgi isteyebilirsiniz. Uygulamadan çıkış yapmak veya uygulamayı telefondan kaldırmak sunucudaki verileri silmez.</p>
          </section>
          <section>
            <h2>7. Bilgi ve düzeltme talepleri</h2>
            <p>Hakkınızda işlenen veriler, kullanım amaçları, alıcılar ve saklama hakkında bilgi; yanlış kayıtların düzeltilmesini veya verilerinizin silinmesini talep edebilirsiniz. İlgili talepler için yukarıdaki iletişim adresini ve bağlı olduğunuz servis firmasını kullanabilirsiniz.</p>
          </section>
          <section>
            <h2>8. Öğrenci bilgileri ve güncellemeler</h2>
            <p>Mobil uygulamadaki yönetici, şoför ve veli ekranları yetişkin kullanıcıların servis yönetimi içindir. Bu, öğrenci verisi işlenmediği anlamına gelmez: okul servisi kapsamında öğrenci adı, durak, güzergah ve yoklama bilgileri işlenebilir.</p>
            <p>Politikanın güncel sürümü bu sayfada yayımlanır. Veri işleme biçimi değiştiğinde metin ve güncelleme tarihi yenilenir.</p>
          </section>
        </div>
      </article>
    </main>
  );
}
