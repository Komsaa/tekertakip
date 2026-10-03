import type { ReactNode } from "react";
import s from "./workspace.module.css";
export { default as workspaceStyles } from "./workspace.module.css";
export function WorkspaceHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: ReactNode }) {
  return <header className={s.header}><div><span className={s.eyebrow}>{eyebrow}</span><h1>{title}</h1><p>{description}</p></div><div className={s.actions}>{actions}</div></header>;
}
export function MetricCard({ label, value, detail, icon }: { label: string; value: ReactNode; detail: string; icon: ReactNode }) {
  return <div className={s.metric}><div className={s.metricHeading}><span>{label}</span><span className={s.metricIcon}>{icon}</span></div><strong>{value}</strong><p>{detail}</p></div>;
}
