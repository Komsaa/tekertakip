"use client";
import WorkspaceError from "@/components/workspace/WorkspaceError";
export default function DriverError({ reset }: { reset: () => void }) {
  return <WorkspaceError title="Şoförler yüklenemedi" reset={reset}/>;
}
