"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  MapPin,
  Route,
  Fuel,
  FileText,
  Wallet,
  Bell,
  Menu,
  X,
  Check,
  Truck,
  LayoutDashboard,
  Users,
  ChevronDown,
  Navigation,
  Smartphone,
} from "lucide-react";
import { LogoFull } from "@/components/Logo";
import s from "./landing.module.css";

const links = [
  ["#gercek-ekranlar", "Ürün ekranları"],
  ["#ozellikler", "Özellikler"],
  ["#nasil-calisir", "Nasıl çalışır?"],
  ["#fiyatlandirma", "Fiyatlandırma"],
];
const routes = [
  {
    name: "Kadıköy · Okul servisi",
    plate: "34 AB 001",
    passengers: "12 / 16",
    status: "Seferde",
    x: 43,
    y: 48,
  },
  {
    name: "Ataşehir · Personel servisi",
    plate: "34 CD 002",
    passengers: "18 / 20",
    status: "Seferde",
    x: 72,
    y: 32,
  },
  {
    name: "Üsküdar · Okul servisi",
    plate: "34 EF 003",
    passengers: "0 / 16",
    status: "Hazırlanıyor",
    x: 51,
    y: 23,
  },
];
const features = [
  {
    icon: Route,
    title: "Güzergâhlar belli. Gününüz planlı.",
    text: "Araç, şoför, durak ve yolcu bilgilerini bir araya getirin. Seferlerinizi ve yoklamaları aynı yerden takip edin.",
  },
  {
    icon: Fuel,
    title: "Her yakıt gideri kayıt altında.",
    text: "Yakıt girişlerini araç bazında inceleyin. Fişleri ve harcamaları düzenli tutun, aylık giderlerinizi görün.",
  },
  {
    icon: FileText,
    title: "Evrakların tarihi aklınızda kalmasın.",
    text: "Muayene, sigorta ve şoför belgelerini tek yerde saklayın. Yaklaşan bitiş tarihlerini panelden takip edin.",
  },
  {
    icon: Wallet,
    title: "İşin finans tarafı da burada.",
    text: "Faturalar, maaşlar, gelirler ve ödemeler. Operasyonunuzun mali durumunu toplu olarak değerlendirin.",
  },
];
const faqs = [
  [
    "Ayrı bir GPS cihazı gerekiyor mu?",
    "Konum paylaşımı şoförün telefonundaki uygulama üzerinden yapılır. Telefonun konum izinlerinin açık ve internet bağlantısının aktif olması gerekir.",
  ],
  [
    "Okul ve personel servisleri için uygun mu?",
    "Evet. Araç, şoför, güzergâh ve ödeme yönetimini her iki servis türü için kullanabilirsiniz. Okul servislerinde veli takibi ve yoklama akışları da bulunur.",
  ],
  [
    "Demo talebinden sonra ne oluyor?",
    "Firma bilgilerinizi ilettikten sonra ekibimiz sizinle iletişime geçer. İhtiyaçlarınızı birlikte değerlendirip demo hesabınızı ve kurulum adımlarını planlarız.",
  ],
  [
    "Aylık ve yıllık planın farkı nedir?",
    "İki planda da aynı özellikler bulunur. Aylık plan 6.000 TL + KDV, yıllık plan peşin 60.000 TL + KDV’dir. Yıllık ödeme, 12 aylık aylık ödemeye göre 12.000 TL avantaj sağlar.",
  ],
];

function ProductScreens() {
  const [selected, setSelected] = useState(0);
  const screens = [
    {key:"araclar",label:"Araç yönetimi",text:"Plakalar, araç atamaları ve belge tarihleri aynı listede."},
    {key:"soforler",label:"Şoför kayıtları",text:"Ekibinizin araç atamalarını ve ehliyet tarihlerini takip edin."},
    {key:"guzergahlar",label:"Güzergâhlar",text:"Okul ve personel hatlarını, durakları ve atamaları birlikte görün."},
  ];
  const current = screens[selected];
  return <section id="gercek-ekranlar" className={s.productSection} aria-labelledby="product-title">
    <div className={s.sectionHeading}><div><span className={s.eyebrow}>UYGULAMANIN İÇİNDEN</span><h2 id="product-title">Günlük işlerinize<br/>daha net bir bakış.</h2></div><p>Gerçek TekerTakip ekranları. Gösterilen firma, şoför ve plakalar tanıtım amaçlı örnek verilerdir.</p></div>
    <div className={s.productChoices} role="group" aria-label="Ürün ekranı seçimi">{screens.map((screen,index)=><button type="button" key={screen.key} aria-pressed={selected===index} onClick={()=>setSelected(index)}>{screen.label}</button>)}</div>
    <figure className={s.productFigure}><Image unoptimized key={current.key} src={`/product/${current.key}.jpg`} alt={`TekerTakip ${current.label} ekranı, örnek firma verileri`} width={1440} height={1000} sizes="(max-width: 768px) 100vw, 1200px"/><figcaption><span aria-live="polite">{current.text}</span><a href={`/product/${current.key}.jpg`} target="_blank" rel="noopener noreferrer">Tam boy görüntüle <span className="sr-only">(yeni sekme)</span><ArrowUpRight size={16}/></a></figcaption></figure>
  </section>;
}

function DashboardPreview() {
  const [selected, setSelected] = useState(0);
  const current = routes[selected];
  return (
    <div className={s.dashboard} id="urun-onizleme">
      <div className={s.dashTop}>
        <span>
          <i className={s.dot} /> Operasyon merkezi
        </span>
        <span>Örnek verilerle ürün önizlemesi</span>
      </div>
      <div className={s.dashBody}>
        <aside className={s.dashSide} aria-hidden="true">
          <LayoutDashboard />
          <MapPin />
          <Truck />
          <Users />
          <Wallet />
          <FileText />
        </aside>
        <div className={s.dashContent}>
          <div className={s.dashHeading}>
            <div>
              <span className={s.eyebrow}>FİLONUZUN BUGÜNÜ</span>
              <h3>Her şey yolunda.</h3>
            </div>
            <span className={s.live}>
              <i className={s.dot} /> Servis takibi
            </span>
          </div>
          <div className={s.dashStats}>
            {[
              ["Toplam araç", "24", "Filoya kayıtlı"],
              ["Aktif sefer", "18", "Yolculuk devam ediyor"],
              ["Tamamlanan", "06", "Varış noktasına ulaştı"],
            ].map(([label, value, hint]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
                <small>{hint}</small>
              </div>
            ))}
          </div>
          <div className={s.mapLayout}>
            <div className={s.routeList}>
              <div className={s.listTitle}>
                Güzergâhlar <span>03</span>
              </div>
              {routes.map((route, i) => (
                <button
                  key={route.plate}
                  type="button"
                  aria-pressed={selected === i}
                  onClick={() => setSelected(i)}
                >
                  <span className={s.routeTitle}>
                    <Truck size={15} />
                    {route.plate}
                    <ArrowUpRight size={14} />
                  </span>
                  <span>{route.name}</span>
                  <small>
                    <i className={s.dot} />
                    {route.status}
                  </small>
                </button>
              ))}
              <p>Haritadaki aracı görmek için bir güzergâh seçin.</p>
            </div>
            <div
              className={s.map}
              aria-label={`${current.name}, ${current.plate}, ${current.status}`}
            >
              <svg
                viewBox="0 0 600 380"
                preserveAspectRatio="xMidYMid slice"
                aria-hidden="true"
              >
                <rect width="600" height="380" fill="#eef0e8" />
                <path
                  d="M0 0H210C300 90 90 170 240 230S280 340 240 380H0Z"
                  fill="#bdd8d9"
                />
                <g fill="#dbe5d1">
                  <path d="M300 20h90l-20 75-70-15z" />
                  <path d="M420 235l110-20 50 115-140 20z" />
                  <path d="M255 270l70 20-30 65-55-25z" />
                </g>
                <g fill="none" stroke="#fff" strokeWidth="10">
                  <path d="M230 0L360 380M440 0L290 380M580 0L400 380M180 130L600 210M200 300L600 50M280 20L590 350" />
                  <path d="M250 70L600 110M230 240L600 300" strokeWidth="5" />
                </g>
                <path
                  d="M300 75L350 160 290 215 410 245 455 120"
                  fill="none"
                  stroke="#d23b36"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="8 5"
                />
              </svg>
              <span className={s.district} style={{ left: "44%", top: "13%" }}>
                ÜSKÜDAR
              </span>
              <span className={s.district} style={{ left: "65%", top: "63%" }}>
                ATAŞEHİR
              </span>
              <span className={s.district} style={{ left: "38%", top: "74%" }}>
                KADIKÖY
              </span>
              <span className={s.sea}>İstanbul</span>
              <div
                className={s.mapPin}
                style={{ left: `${current.x}%`, top: `${current.y}%` }}
              >
                <Navigation size={18} fill="currentColor" />
                <span>{current.plate}</span>
              </div>
              <div className={s.mapInfo} aria-live="polite">
                <Truck size={22} />
                <div>
                  <strong>{current.name}</strong>
                  <span>
                    {current.passengers} yolcu · {current.status}
                  </span>
                </div>
                <i className={s.dot} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomeClient() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [annual, setAnnual] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  return (
    <div className={s.page}>
      <a className={s.skip} href="#main">
        İçeriğe geç
      </a>
      <header className={s.header}>
        <nav className={s.nav} aria-label="Ana menü">
          <Link href="/" aria-label="TekerTakip ana sayfa">
            <LogoFull size={32} />
          </Link>
          <div className={s.desktopLinks}>
            {links.map(([href, label]) => (
              <a key={href} href={href}>
                {label}
              </a>
            ))}
          </div>
          <div className={s.navActions}>
            <Link href="/login">
              Panel girişi <ArrowUpRight size={15} />
            </Link>
            <Link href="/kayit" className={s.button}>
              Demo talep et <ArrowRight size={16} />
            </Link>
          </div>
          <button
            ref={menuButton}
            type="button"
            className={s.menuButton}
            aria-label={mobileOpen ? "Menüyü kapat" : "Menüyü aç"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </nav>
        {mobileOpen && (
          <nav
            id="mobile-menu"
            className={s.mobileMenu}
            aria-label="Mobil menü"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setMobileOpen(false);
                menuButton.current?.focus();
              }
            }}
          >
            {links.map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMobileOpen(false)}>
                {label}
              </a>
            ))}
            <Link href="/login">Panel girişi</Link>
            <Link href="/kayit" className={s.button}>
              Demo talep et <ArrowRight size={16} />
            </Link>
          </nav>
        )}
      </header>
      <main id="main">
        <section className={s.hero}>
          <div className={s.heroIntro}>
            <span className={s.eyebrow}>
              <i className={s.dot} /> OKUL VE PERSONEL SERVİSLERİ İÇİN
            </span>
            <h1>
              Yollar hareketli.
              <br />
              İşler <span>kontrolünüzde.</span>
            </h1>
            <p>
              Araçlarınız, şoförleriniz ve günlük operasyonunuz tek ekranda.
              <br />
              TekerTakip ile filonuzu takip edin, işinize odaklanın.
            </p>
            <div className={s.heroActions}>
              <Link href="/kayit" className={s.button}>
                Ücretsiz demo talep et <ArrowRight size={18} />
              </Link>
              <a href="#urun-onizleme" className={s.textButton}>
                Platformu keşfet <ArrowRight size={17} />
              </a>
            </div>
            <div className={s.heroNotes}>
              <span>
                <Check size={15} /> Ek GPS cihazı gerekmez
              </span>
              <span>
                <Check size={15} /> Web paneli ve mobil uygulama
              </span>
            </div>
          </div>
          <div className={s.previewWrap}>
            <div className={s.previewCaption}>
              <span>DAHA NET BİR BAKIŞ. DAHA RAHAT BİR GÜN.</span>
              <span>01 / OPERASYON</span>
            </div>
            <DashboardPreview />
          </div>
        </section>
        <div className={s.strip}>
          <span>
            Sahadan ofise,
            <br />
            <strong>aynı bilgi, aynı ekran.</strong>
          </span>
          <div>
            <Truck /> Filo yönetimi
          </div>
          <div>
            <MapPin /> Konum takibi
          </div>
          <div>
            <Smartphone /> Şoför uygulaması
          </div>
          <div>
            <Bell /> Veli bildirimleri
          </div>
        </div>
        <ProductScreens />
        <section id="ozellikler" className={s.section}>
          <div className={s.sectionHeading}>
            <div>
              <span className={s.eyebrow}>İŞİNİZİN HER DETAYI</span>
              <h2>
                Bir servis günü.
                <br />
                Birbirine bağlı tüm işler.
              </h2>
            </div>
            <p>
              Sabahın ilk seferinden ay sonu hesaplarına kadar, ihtiyacınız olan
              araçlar aynı platformda.
            </p>
          </div>
          <div className={s.featureGrid}>
            {features.map(({ icon: Icon, title, text }, i) => (
              <article key={title}>
                <div className={s.featureTop}>
                  <Icon size={26} strokeWidth={1.5} />
                  <span>0{i + 1}</span>
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className={s.mobileSection}>
          <div className={s.mobileInner}>
            <div className={s.mobileCopy}>
              <span className={s.eyebrow}>SAHAYLA BAĞINIZ HEP AÇIK</span>
              <h2>
                Ofiste siz.
                <br />
                Yolda ekibiniz.
                <br />
                <span>Aynı ritimde.</span>
              </h2>
              <p>
                Şoförünüz seferi başlatır, yoklamayı alır ve konumunu paylaşır.
                Siz operasyonu panelden izlerken veliler de yolculuktan haberdar
                olur.
              </p>
              <Link href="/kayit" className={s.lightButton}>
                Mobil uygulamayı tanıyın <ArrowUpRight size={18} />
              </Link>
            </div>
            <div className={s.phoneScene}>
              <div className={s.phone}>
                <div className={s.phoneBar}>
                  08:15 <span>● ▰</span>
                </div>
                <div className={s.phoneHeader}>
                  <LogoFull size={23} textSize="text-base" />
                  <span>Şoför uygulaması · Örnek ekran</span>
                </div>
                <div className={s.phoneTrip}>
                  <span>BUGÜNKÜ GÜZERGÂH</span>
                  <h3>Kadıköy → Okul</h3>
                  <p>
                    34 AB 001 <span>Seferde</span>
                  </p>
                </div>
                <div className={s.attendance}>
                  <span>
                    Yolcu yoklaması <strong>12 / 16</strong>
                  </span>
                  {["Ayşe Y.", "Mert K.", "Zeynep D."].map((name, i) => (
                    <div key={name}>
                      <span>{name.charAt(0)}</span>
                      <strong>{name}</strong>
                      <small>{i === 2 ? "Bekleniyor" : "Bindi"}</small>
                      {i !== 2 && <Check size={15} />}
                    </div>
                  ))}
                </div>
                <div className={s.phoneBottom}>
                  <MapPin size={16} /> Konum paylaşımı aktif
                </div>
              </div>
              <div className={s.notification}>
                <Bell size={22} />
                <div>
                  <strong>Veliler de haberdar.</strong>
                  <p>Öğrenciniz servise bindi.</p>
                  <small>Örnek bildirim</small>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="nasil-calisir" className={s.section}>
          <div className={s.sectionHeading}>
            <div>
              <span className={s.eyebrow}>BAŞLAMAK KOLAY</span>
              <h2>Birlikte yola çıkalım.</h2>
            </div>
            <Link href="/kayit" className={s.textButton}>
              İlk adımı atın <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className={s.steps}>
            {[
              [
                "Tanışalım",
                "Demo formunu doldurun. Filonuzu ve ihtiyaçlarınızı birlikte değerlendirelim.",
              ],
              [
                "Filonuzu hazırlayalım",
                "Araç, şoför ve güzergâh bilgilerinizi ekleyerek operasyonunuzu oluşturun.",
              ],
              [
                "Takibe başlayın",
                "Ekibiniz mobil uygulamayı kullanırken siz günlük işlerinizi panelden yönetin.",
              ],
            ].map(([title, text], i) => (
              <article key={title}>
                <span>0{i + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section id="fiyatlandirma" className={s.pricingSection}>
          <div className={s.pricingInner}>
            <div>
              <span className={s.eyebrow}>NET FİYAT. TAM KAPSAM.</span>
              <h2>
                Filonuz için
                <br />
                tek bir plan.
              </h2>
              <p>
                İhtiyacınız olan özellikler bir arada.
                <br />
                Size uygun ödeme dönemini seçin.
              </p>
              <div className={s.billing} role="group" aria-label="Ödeme dönemi">
                <button
                  type="button"
                  aria-pressed={!annual}
                  onClick={() => setAnnual(false)}
                >
                  Aylık
                </button>
                <button
                  type="button"
                  aria-pressed={annual}
                  onClick={() => setAnnual(true)}
                >
                  Yıllık <span>2 ay avantaj</span>
                </button>
              </div>
            </div>
            <div className={s.priceCard}>
              <span className={s.eyebrow}>TEKERTAKİP · TÜM ÖZELLİKLER</span>
              <div aria-live="polite" aria-atomic="true">
                <div className={s.price}>
                  {annual ? "₺60.000" : "₺6.000"}
                  <span>/ {annual ? "yıl" : "ay"}</span>
                </div>
                <p>
                  {annual
                    ? "Yıllık peşin ödeme + KDV · Ayda ₺5.000’a denk gelir"
                    : "Aylık ödeme + KDV"}
                </p>
              </div>
              <ul>
                {[
                  "Araç ve şoför yönetimi",
                  "Canlı konum ve güzergâh takibi",
                  "Mobil uygulama ve veli bildirimleri",
                  "Yakıt, belge ve finans yönetimi",
                  "Raporlama ve kurulum desteği",
                ].map((text) => (
                  <li key={text}>
                    <Check size={17} />
                    {text}
                  </li>
                ))}
              </ul>
              <Link href="/kayit" className={s.button}>
                Demo talep et <ArrowRight size={18} />
              </Link>
              <small>
                Önce tanışalım, filonuz için birlikte değerlendirelim.
              </small>
            </div>
          </div>
        </section>
        <section className={`${s.section} ${s.faqSection}`}>
          <div>
            <span className={s.eyebrow}>AKLINIZDAKİ SORULAR</span>
            <h2>Yola çıkmadan.</h2>
            <p>Platform hakkında merak edilenler.</p>
          </div>
          <div className={s.faqs}>
            {faqs.map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <ChevronDown size={18} />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className={s.finalCta}>
          <span className={s.eyebrow}>BİR SONRAKİ SEFERİNİZDEN ÖNCE</span>
          <h2>İşlerinizi bir düzene koyalım.</h2>
          <Link href="/kayit" className={s.button}>
            TekerTakip ile tanışın <ArrowRight size={18} />
          </Link>
        </section>
      </main>
      <footer className={s.footer}>
        <div>
          <Link href="/" aria-label="TekerTakip ana sayfa">
            <LogoFull size={30} />
          </Link>
          <p>Servis yönetimi, yolunda.</p>
        </div>
        <nav aria-label="Alt menü">
          <Link href="/kayit">İletişim ve demo</Link>
          <Link href="/login">Panel girişi</Link>
          <Link href="/gizlilik">Gizlilik politikası</Link>
        </nav>
        <small>© {new Date().getFullYear()} TekerTakip</small>
      </footer>
    </div>
  );
}
