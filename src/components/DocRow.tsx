"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FileText, Upload, ExternalLink, Loader2 } from "lucide-react";
import { getDocStatus, getDocStatusColor, getDocStatusLabel, formatDate } from "@/lib/utils";
import { validDocumentDate } from "@/lib/document-dates";
interface Props { label:string; expiry:Date|null|undefined; fileUrl?:string|null; entityType:"driver"|"vehicle"; entityId:string; docType:string; notes?:string }
export default function DocRow({label,expiry,fileUrl,entityType,entityId,docType,notes}:Props) {
  const router=useRouter(), input=useRef<HTMLInputElement>(null), busy=useRef(false);
  const [uploading,setUploading]=useState(false), [saving,setSaving]=useState(false);
  const [pending,setPending]=useState<File|null>(null), [editing,setEditing]=useState(false);
  const [date,setDate]=useState(""), [message,setMessage]=useState("");
  const noExpiry=entityType==="driver"&&docType==="src";
  const issueDate=docType==="residenceDoc";
  const status=getDocStatus(noExpiry||issueDate ? null : expiry);
  async function upload() {
    if (!pending||busy.current) return;
    busy.current=true;setUploading(true);setMessage("");
    try {
      const body=new FormData();body.append("file",pending);body.append("entityType",entityType);body.append("entityId",entityId);body.append("docType",docType);
      const response=await fetch("/api/upload",{method:"POST",body});const result=await response.json();
      if (!response.ok) throw new Error(result.error||"Dosya yüklenemedi");
      setPending(null);if(input.current)input.current.value="";
      toast.success(`${label} yüklendi`);
      if (!noExpiry) {
        const suggestion=issueDate?result.parsed?.issueDate:result.parsed?.expiryDate;
        setDate(validDocumentDate(suggestion)?suggestion:"");setEditing(true);
        setMessage(validDocumentDate(suggestion)?"Belgeden tarih okundu. Belgeyle karşılaştırıp onaylayın; mevcut tarih henüz değişmedi.":"Dosya yüklendi ancak tarih okunamadı. Açık tarih varsa elle girin; belgeden süre tahmin edilmez.");
      }
      router.refresh();
    } catch(e) {toast.error(e instanceof Error?e.message:"Yükleme başarısız");}
    finally{busy.current=false;setUploading(false);}
  }
  async function save() {
    if (!validDocumentDate(date)||busy.current||noExpiry) return;
    busy.current=true;setSaving(true);
    try {
      const response=await fetch("/api/documents/date",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({entityType,entityId,docType,date})});
      if(!response.ok)throw new Error("Tarih kaydedilemedi");
      setEditing(false);setMessage("");toast.success("Tarih kaydedildi");router.refresh();
    }catch{toast.error("Tarih kaydedilemedi. Tekrar deneyin.");}finally{busy.current=false;setSaving(false);}
  }
  return <section aria-label={label} className="py-4 border-b border-slate-100 last:border-0" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(!busy.current&&e.dataTransfer.files[0])setPending(e.dataTransfer.files[0]);}}>
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-3 min-w-0"><FileText size={20} className="text-slate-400 shrink-0"/><div><h3 className="text-sm font-semibold text-slate-700">{label}</h3>{notes&&<p className="text-xs text-slate-500 break-words">{notes}</p>}</div></div>
      <div className="flex items-center gap-3 flex-wrap">
        {noExpiry?<span className="text-xs text-slate-600">Süre takibi yok · {fileUrl?"Dosya yüklü":"Dosya bekleniyor"}</span>:<>
          {expiry&&<span className="text-sm text-slate-700">{issueDate?"Düzenleme: ":""}{formatDate(expiry)}</span>}
          {!issueDate&&<span className={`text-xs px-2 py-1 rounded-full border ${getDocStatusColor(status)}`}>{getDocStatusLabel(status)}</span>}
          <button disabled={uploading||saving} onClick={()=>{setDate(expiry?new Date(expiry).toISOString().slice(0,10):"");setMessage("");setEditing(true);}} className="text-sm text-blue-700">{expiry?"Tarihi düzenle":"Tarih gir"}</button>
        </>}
        {fileUrl&&<a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-700 inline-flex gap-1 items-center"><ExternalLink size={14}/>Görüntüle</a>}
        <button disabled={uploading||saving} onClick={()=>input.current?.click()} className="inline-flex gap-1 items-center text-sm text-slate-600 py-2">{uploading?<Loader2 size={15} className="animate-spin"/>:<Upload size={15}/>} {uploading?"Yükleniyor ve okunuyor…":fileUrl?"Güncelle":"Yükle"}</button>
      </div>
    </div>
    {pending&&<div className="flex flex-wrap gap-3 items-center mt-3 text-sm"><span className="break-all">{pending.name}</span><button disabled={uploading||saving} onClick={()=>void upload()} className="text-green-700 font-semibold">Dosyayı yükle</button><button disabled={uploading||saving} onClick={()=>{setPending(null);if(input.current)input.current.value="";}}>Vazgeç</button></div>}
    {message&&<p role="status" className="text-sm text-slate-600 mt-3">{message}</p>}
    {editing&&!noExpiry&&<div className="flex gap-3 items-center flex-wrap mt-3 bg-slate-50 p-3 rounded-xl"><label className="text-sm">{issueDate?"Düzenleme tarihi":"Belgedeki son geçerlilik tarihi"}<input aria-label={`${label} tarihi`} type="date" value={date} disabled={saving||uploading} onChange={e=>setDate(e.target.value)}/></label><button disabled={saving||uploading||!validDocumentDate(date)} onClick={()=>void save()} className="text-sm text-green-700 disabled:opacity-50">{saving?"Kaydediliyor…":"Tarihi onayla"}</button><button disabled={saving||uploading} onClick={()=>{setEditing(false);setMessage("");}} className="text-sm text-slate-500">Vazgeç</button></div>}
    {!noExpiry&&<p className="text-xs text-slate-500 mt-2">Otomatik tarih okuma için dosya mevcut yapay zekâ hizmetine gönderilir. Sonucu kaydetmeden önce kontrol edin.</p>}
    <input ref={input} aria-label={`${label} dosyası`} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" disabled={uploading||saving} onChange={e=>{if(e.target.files?.[0])setPending(e.target.files[0]);}}/>
  </section>;
}
