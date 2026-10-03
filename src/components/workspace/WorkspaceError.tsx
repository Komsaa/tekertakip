"use client";
import { AlertTriangle } from "lucide-react";
import { workspaceStyles as s } from "./Workspace";

export default function WorkspaceError({ title, reset }: { title: string; reset: () => void }) {
  return <div className={s.workspace}><div className={s.surface}><div className={s.empty} role="alert">
    <AlertTriangle size={36}/><h2>{title}</h2>
    <p>Verilere şu anda ulaşılamıyor. Bu, kayıtlarınızın boş olduğu anlamına gelmez. Lütfen tekrar deneyin.</p>
    <button className={s.button} onClick={reset}>Tekrar dene</button>
  </div></div></div>;
}
