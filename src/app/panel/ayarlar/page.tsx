import { redirect } from "next/navigation";

// Preserve bookmarks without keeping the removed settings screen accessible.
export default function RemovedSettingsPage() {
  redirect("/panel");
}
