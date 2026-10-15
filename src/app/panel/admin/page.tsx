import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminClient from "./AdminClient";
import { requireAdmin } from "@/lib/tenant";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (requireAdmin(session)) redirect("/panel");

  return <AdminClient />;
}
