"use client";
import WorkspaceError from "@/components/workspace/WorkspaceError";
export default function RouteError({ reset }: { reset: () => void }) {
  return <WorkspaceError title="Güzergâhlar yüklenemedi" reset={reset}/>;
}
