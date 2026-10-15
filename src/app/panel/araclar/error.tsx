"use client";
import { AlertTriangle } from "lucide-react";
import { workspaceStyles as s } from "@/components/workspace/Workspace";
export default function FleetError({ reset }: { reset: () => void }) {
  return <div className={s.workspace}><div className={s.surface}><div className={s.empty} role="alert"><AlertTriangle size={36}/><h2>Araçlar yüklenemedi</h2><p>Verilere şu anda ulaşılamıyor. Bu, filonuzun boş olduğu anlamına gelmez. Lütfen tekrar deneyin.</p><button className={s.button} onClick={reset}>Tekrar dene</button></div></div></div>;
}
