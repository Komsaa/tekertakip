"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, RefreshCw } from "lucide-react";
import { WorkspaceHeader, workspaceStyles as s } from "@/components/workspace/Workspace";
import { SETUP_STEPS, isSetupStats, type SetupStats } from "@/lib/setup-guide";
import w from "./wizard.module.css";

export default function SetupWizard() {
  const [stats, setStats] = useState<SetupStats | null>(null);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const initialized = useRef(false);
  const request = useRef<AbortController | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const refresh = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/panel/onboarding", { cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error(response.status === 401 ? "Oturumunuz sona erdi. Yeniden giriş yapın." : response.status === 400 ? "Kurulum için bir firma hesabıyla giriş yapın veya yönetimden bir firma seçin." : "Kurulum durumu yüklenemedi. Tekrar deneyin.");
      const data: unknown = await response.json();
      if (!isSetupStats(data)) throw new Error("Kurulum verisi okunamadı. Tekrar deneyin.");
      if (controller.signal.aborted) return;
      setStats(data);
      if (!initialized.current) {
        const next = SETUP_STEPS.findIndex(step => data[step.key] === 0);
        setSelected(next < 0 ? 0 : next);
        initialized.current = true;
      }
    } catch (e) {
      if (!controller.signal.aborted) { setStats(null); setError(e instanceof Error ? e.message : "Bağlantı kurulamadı."); }
    } finally { if (!controller.signal.aborted) setLoading(false); }
  }, []);
  useEffect(() => {
    void refresh();
    const onFocus = () => { void refresh(); };
    window.addEventListener("focus", onFocus);
    return () => { request.current?.abort(); window.removeEventListener("focus", onFocus); };
  }, [refresh]);
  function go(index: number) { setSelected(index); requestAnimationFrame(() => heading.current?.focus()); }
  const step = SETUP_STEPS[selected];
  const completed = stats ? SETUP_STEPS.filter(item => stats[item.key] > 0).length : 0;
  return <div className={s.workspace}>
    <WorkspaceHeader eyebrow="İlk kullanım" title="Kurulum sihirbazı" description="Firmanızın ilk kayıtlarını adım adım hazırlayın. Her adımda ne yapacağınızı ve bunun ne işe yaradığını görün." actions={<Link href="/panel" className={s.button}>Panele dön</Link>} />
    <p className={w.notice}>Bu rehber firma kayıtlarını hazırlamanıza yardımcı olur. Sunucu kurulumu yapmaz. Bir adımda kayıt bulunması, tüm filonun eksiksiz veya yayına hazır olduğu anlamına gelmez.</p>
    {loading && <p role="status">Kurulum kayıtları kontrol ediliyor…</p>}
    {error && <div className={s.error} role="alert"><p>{error}</p><button className={s.button} onClick={() => void refresh()}>Tekrar dene</button> <Link href="/login" className={s.button}>Giriş ekranı</Link></div>}
    {stats && !error && <>
      <section className={`${s.surface} ${w.progress}`} aria-label="Kurulum ilerlemesi">
        <div className={w.progressHeading}><div><strong>{completed} / {SETUP_STEPS.length} adımda kayıt var</strong><p>İlerleme firmanızdaki gerçek kayıtlardan hesaplanır. İsteğe bağlı adımları sonraya bırakabilirsiniz.</p></div><button className={s.button} disabled={loading} onClick={() => void refresh()}><RefreshCw size={16}/>Durumu yenile</button></div>
        <progress max={SETUP_STEPS.length} value={completed} aria-label="Kayıt bulunan kurulum adımları" />
      </section>
      <div className={w.layout}>
        <nav aria-label="Kurulum adımları" className={w.steps}>{SETUP_STEPS.map((item, index) => <button key={item.key} className={w.step} aria-current={selected === index ? "step" : undefined} onClick={() => go(index)}><span className={w.number}>{index + 1}</span><span><strong>{item.title}</strong><small>{item.optional ? "İsteğe bağlı" : "Temel başlangıç"} · {stats[item.key] > 0 ? "Kayıt var" : "Kayıt bekleniyor"}</small></span>{stats[item.key] > 0 && <CheckCircle2 size={18} aria-label="Kayıt var"/>}</button>)}</nav>
        <section className={`${s.surface} ${w.detail}`} aria-labelledby="setup-step-title">
          <span className={s.eyebrow}>Adım {selected + 1} / {SETUP_STEPS.length}</span>
          <h2 id="setup-step-title" ref={heading} tabIndex={-1}>{step.title}</h2>
          <p className={w.intro}>{step.summary}</p>
          <h3>Ne işe yarar?</h3><p>{step.benefit}</p>
          <h3>Ne yapmalısınız?</h3><ol>{step.tasks.map(task => <li key={task}>{task}</li>)}</ol>
          <div className={w.requirement}><h3>Kontrol ölçütü</h3><p>{step.criteria}</p><p className={w.state}>{stats[step.key] > 0 ? `Bu ölçüte uyan ${stats[step.key]} kayıt var.` : "Henüz bu ölçüte uyan kayıt yok."}</p></div>
          <p className={w.tip}>{step.tip}</p>
          <Link className={`${s.button} ${s.primary}`} href={step.href} target="_blank" rel="noopener noreferrer">{step.action} <ArrowRight size={16}/><span className="sr-only"> (yeni sekmede açılır)</span></Link>
          <p className={w.help}>İşlem yeni sekmede açılır. Kaydı tamamlayıp buraya dönün; durumu yeniden kontrol edelim.</p>
          <div className={w.navigation}><button className={s.button} disabled={selected === 0} onClick={() => go(selected - 1)}><ArrowLeft size={16}/>Önceki adım</button>{selected < SETUP_STEPS.length - 1 ? <button className={s.button} onClick={() => go(selected + 1)}>{step.optional ? "Sonraya bırak / İleri" : "Sonraki adım"}<ArrowRight size={16}/></button> : <Link className={s.button} href="/panel">Panele geç</Link>}</div>
          <p className={w.help}>İleri gitmek bir adımı tamamlandı olarak işaretlemez.</p>
        </section>
      </div>
      {completed === SETUP_STEPS.length && <p role="status" className={w.notice}>Tüm adımlarda ilk kayıtlar mevcut. Kalan araçları, eksik tarihleri ve kullanıcı yetkilerini ayrıca kontrol edin. Mobil GPS ve bildirimleri gerçek cihazda deneyin.</p>}
    </>}
  </div>;
}
