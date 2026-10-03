"use client";

import { useState } from "react";
import Link from "next/link";
import { LogoFull } from "@/components/Logo";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { validateDemoRequest } from "@/lib/demo-request";
import s from "../landing.module.css";

const fields = [
  {
    key: "companyName",
    label: "Firma adı",
    placeholder: "Firma unvanınız",
    required: true,
    autoComplete: "organization",
    max: 160,
  },
  {
    key: "contactName",
    label: "Adınız ve soyadınız",
    placeholder: "Adınız Soyadınız",
    required: true,
    autoComplete: "name",
    max: 120,
  },
  {
    key: "phone",
    label: "Telefon",
    placeholder: "05XX XXX XX XX",
    required: true,
    type: "tel",
    autoComplete: "tel",
    max: 30,
  },
  {
    key: "city",
    label: "Şehir",
    placeholder: "İstanbul",
    autoComplete: "address-level1",
    max: 80,
  },
  {
    key: "email",
    label: "E-posta",
    placeholder: "adiniz@firma.com",
    type: "email",
    autoComplete: "email",
    max: 254,
  },
] as const;

export default function KayitPage() {
  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    phone: "",
    email: "",
    city: "",
    vehicleCount: "",
    serviceType: "karma",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError("");
    const result = validateDemoRequest(form);
    if (result.error) {
      setError(result.error);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/kayit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error || "Talebiniz gönderilemedi. Lütfen tekrar deneyin.",
        );
        return;
      }
      setDone(true);
    } catch {
      setError(
        "Bağlantı kurulamadı. Bilgileriniz burada, lütfen tekrar deneyin.",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className={`${s.page} ${s.signup}`}>
      <header className={s.signupHeader}>
        <Link href="/" aria-label="TekerTakip ana sayfa">
          <LogoFull size={32} />
        </Link>
        <Link href="/" className={s.textButton}>
          <ArrowLeft size={16} /> Ana sayfa
        </Link>
      </header>
      <div className={s.signupGrid}>
        <section className={s.signupIntro}>
          <span className={s.eyebrow}>TANIŞMAK İÇİN İLK ADIM</span>
          <h1>
            Filonuzun yeni
            <br />
            düzeni burada
            <br />
            <span>başlıyor.</span>
          </h1>
          <p>
            İşinizi anlatın. TekerTakip’in günlük operasyonunuza nasıl yardımcı
            olabileceğini birlikte keşfedelim.
          </p>
          <ul>
            {[
              "İhtiyaçlarınıza göre ürün tanıtımı",
              "Araç ve güzergâhlarınız için kurulum planı",
              "Web paneli ve mobil uygulamayı keşfetme",
            ].map((text) => (
              <li key={text}>
                <Check size={17} />
                {text}
              </li>
            ))}
          </ul>
          <div className={s.signupNote}>
            Zaten hesabınız var mı?{" "}
            <Link href="/login">
              Panele giriş yapın <ArrowUpRightIcon />
            </Link>
          </div>
        </section>
        <section className={s.signupCard}>
          {done ? (
            <div className={s.signupSuccess} role="status">
              <CheckCircle2 size={48} />
              <h2>Talebiniz bize ulaştı.</h2>
              <p>
                Ekibimiz sizinle iletişime geçerek demo hesabınızı ve sonraki
                adımları planlayacak.
              </p>
              <Link href="/" className={s.button}>
                Ana sayfaya dön <ArrowRight size={17} />
              </Link>
            </div>
          ) : (
            <>
              <span className={s.eyebrow}>FİRMANIZI TANIYALIM</span>
              <h2>Demo talep edin.</h2>
              <p>
                Formu doldurun, sizinle iletişime geçelim.
                <br />
                Demo talebi ücretsizdir.
              </p>
              <form onSubmit={handleSubmit} aria-busy={loading}>
                <fieldset disabled={loading} className={s.signupFields}>
                  {fields.map((field) => (
                    <div
                      key={field.key}
                      className={
                        field.key === "phone" || field.key === "city"
                          ? ""
                          : s.fullField
                      }
                    >
                      <label htmlFor={field.key}>
                        {field.label}
                        {"required" in field && field.required ? " *" : ""}
                      </label>
                      <input
                        id={field.key}
                        name={field.key}
                        type={"type" in field ? field.type : "text"}
                        required={"required" in field && field.required}
                        maxLength={field.max}
                        autoComplete={field.autoComplete}
                        placeholder={field.placeholder}
                        value={form[field.key]}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            [field.key]: e.target.value,
                          }))
                        }
                      />
                    </div>
                  ))}
                  <div>
                    <label htmlFor="vehicleCount">Araç sayısı</label>
                    <input
                      id="vehicleCount"
                      name="vehicleCount"
                      type="number"
                      min="1"
                      max="100000"
                      step="1"
                      placeholder="Örn. 12"
                      value={form.vehicleCount}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, vehicleCount: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label htmlFor="serviceType">Servis türü</label>
                    <select
                      id="serviceType"
                      name="serviceType"
                      value={form.serviceType}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, serviceType: e.target.value }))
                      }
                    >
                      <option value="karma">Okul ve personel</option>
                      <option value="okul">Okul servisi</option>
                      <option value="personel">Personel servisi</option>
                    </select>
                  </div>
                </fieldset>
                {error && (
                  <p role="alert" className={s.formError}>
                    {error}
                  </p>
                )}
                <button type="submit" disabled={loading} className={s.button}>
                  {loading ? (
                    <>
                      <Loader2 size={17} /> Gönderiliyor…
                    </>
                  ) : (
                    <>
                      Demo talebini gönder <ArrowRight size={17} />
                    </>
                  )}
                </button>
                <p className={s.formPrivacy}>
                  * Zorunlu alanlar. Bilgilerinizin işlenmesi hakkında{" "}
                  <Link href="/gizlilik">gizlilik politikasını</Link>{" "}
                  inceleyebilirsiniz.
                </p>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function ArrowUpRightIcon() {
  return <ArrowRight size={14} />;
}
