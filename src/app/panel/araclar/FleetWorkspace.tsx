"use client";
import { useState } from "react";
import Link from "next/link";
import { Truck, Search, ShieldCheck, AlertTriangle, Users, ArrowUpRight, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { MetricCard, WorkspaceHeader, workspaceStyles as s } from "@/components/workspace/Workspace";
import AddVehicleModal from "./AddVehicleModal";
import ExcelImportButton from "../soforler/ExcelImportButton";

type Vehicle = { id: string; plate: string; description: string; capacity: number | null; status: string; drivers: string; inspection: string; documentState: "attention" | "missing" | "valid"; jobs: number; fuelEntries: number };
const docLabels = { attention: "Kontrol gerekli", missing: "Eksik tarih", valid: "Tarihler güncel" };
export default function FleetWorkspace({ vehicles }: { vehicles: Vehicle[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const term = query.trim().toLocaleLowerCase("tr-TR");
  const filtered = vehicles.filter(v => [v.plate, v.description, v.drivers].join(" ").toLocaleLowerCase("tr-TR").includes(term) && (filter === "all" || (filter === "active" ? v.status === "active" : v.documentState === filter)));
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * 10, currentPage * 10);
  const badge = (v: Vehicle) => <span className={s.badge + " " + s[v.documentState === "valid" ? "active" : v.documentState]}>{docLabels[v.documentState]}</span>;
  return <div className={s.workspace}>
    <WorkspaceHeader eyebrow="Filo yönetimi" title="Araçlarınız, tek bir yerde." description="Filonuzu yönetin, belge tarihlerini takip edin ve araç detaylarına hızlıca ulaşın." actions={<AddVehicleModal />} />
    <div className={s.metrics}>
      <MetricCard label="Toplam araç" value={vehicles.length} detail="Filonuzdaki kayıtlı araçlar" icon={<Truck size={17}/>} />
      <MetricCard label="Aktif araç" value={vehicles.filter(v=>v.status === "active").length} detail="Aktif olarak işaretlenenler" icon={<ShieldCheck size={17}/>} />
      <MetricCard label="Belge takibi" value={vehicles.filter(v=>v.documentState === "attention").length} detail="Yaklaşan veya geçmiş tarihler" icon={<AlertTriangle size={17}/>} />
      <MetricCard label="Şoför atanmamış" value={vehicles.filter(v=>!v.drivers).length} detail="Atama bekleyen araçlar" icon={<Users size={17}/>} />
    </div>
    <section className={s.surface} aria-label="Araç listesi">
      <div className={s.toolbar}>
        <div className={s.search}><Search size={18}/><input aria-label="Araç ara" placeholder="Plaka, marka veya şoför ara…" value={query} onChange={e=>{setQuery(e.target.value);setPage(1);}} /></div>
        <div className={s.filters} aria-label="Araç filtreleri">{[["all","Tümü"],["active","Aktif"],["attention","Belge takibi"],["missing","Eksik tarih"]].map(([key,label])=><button key={key} aria-pressed={filter===key} onClick={()=>{setFilter(key);setPage(1);}}>{label}</button>)}</div>
      </div>
      {!filtered.length ? <div className={s.empty}><Truck size={38}/><h2>{vehicles.length ? "Aramanıza uygun araç bulunamadı" : "Filonuzun ilk aracını ekleyin"}</h2><p>{vehicles.length ? "Farklı bir plaka veya şoför adı deneyin; filtreleri temizleyerek tüm araçları görün." : "Araçlarınızı eklediğinizde belge tarihleri ve şoför atamaları burada görünür."}</p>{vehicles.length ? <button className={s.button} onClick={()=>{setQuery("");setFilter("all");setPage(1);}}>Filtreleri temizle</button> : <div className="flex justify-center"><AddVehicleModal /></div>}</div> : <>
        <div className={s.tableWrap}><table className={s.table}><thead><tr><th>Araç / plaka</th><th>Şoför</th><th>Muayene tarihi</th><th>Belge durumu</th><th>Durum</th><th><span className="sr-only">İşlem</span></th></tr></thead><tbody>{visible.map(v=><tr key={v.id}><td><Link className={s.plate} href={"/panel/araclar/"+v.id}>{v.plate}</Link><span className={s.secondary}>{v.description || "Araç bilgisi girilmedi"}{v.capacity ? " · "+v.capacity+" kişi" : ""}</span></td><td>{v.drivers || "Atanmadı"}<span className={s.secondary}>{v.jobs} sefer · {v.fuelEntries} yakıt kaydı</span></td><td>{v.inspection}</td><td>{badge(v)}</td><td><span className={s.badge+" "+s[v.status === "active" ? "active" : "inactive"]}>{v.status === "active" ? "Aktif" : "Pasif"}</span></td><td><Link href={"/panel/araclar/"+v.id} aria-label={v.plate+" araç detayları"} className={s.button}><ArrowUpRight size={16}/></Link></td></tr>)}</tbody></table></div>
        <div className={s.mobileCards}>{visible.map(v=><article key={v.id} className={s.mobileCard}><div className={s.mobileCardHeader}><div><Link href={"/panel/araclar/"+v.id} className={s.plate}>{v.plate}</Link><span className={s.secondary}>{v.description || "Araç bilgisi girilmedi"}</span></div><span className={s.badge+" "+s[v.status==="active"?"active":"inactive"]}>{v.status==="active"?"Aktif":"Pasif"}</span></div><div className={s.mobileDetails}>{badge(v)}<span className={s.secondary}>Muayene: {v.inspection}</span></div><div className={s.mobileDetails}><span className={s.secondary}>{v.drivers || "Şoför atanmadı"} · {v.jobs} sefer</span><Link className={s.button} href={"/panel/araclar/"+v.id}>Detaylar <ArrowUpRight size={15}/></Link></div></article>)}</div>
      </>}
      <div className={s.footer}><span aria-live="polite">{filtered.length} araç · Sayfa {currentPage} / {pages}</span><div className={s.actions}><button className={s.button} aria-label="Önceki sayfa" disabled={currentPage===1} onClick={()=>setPage(currentPage-1)}><ChevronLeft size={16}/></button><button className={s.button} aria-label="Sonraki sayfa" disabled={currentPage===pages} onClick={()=>setPage(currentPage+1)}><ChevronRight size={16}/></button></div></div>
    </section>
    <div className={s.footer}><span>Belge özeti: muayene, sigorta, güzergâh izni ve uygunluk tarihleri.</span><div className={s.actions}><a className={s.button} href="/api/excel/template?type=vehicles">Şablon indir</a><a className={s.button} href="/api/excel/export?type=vehicles"><Download size={16}/> Excel'e aktar</a><ExcelImportButton type="vehicles"/></div></div>
  </div>;
}
