import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import TakvimClient from "./TakvimClient";

const SEED_DATA = [
  // Banka ödemeleri (her ay tekrarlanır)
  { title: "Özgür Akbank Son Ödeme", day: 1, category: "banka", person: "Özgür", recurring: true, color: "#3B82F6" },
  { title: "Yiğit Yapıkredi Son Ödeme", day: 3, category: "banka", person: "Yiğit", recurring: true, color: "#3B82F6" },
  { title: "Mert Halk Bank Son Ödeme", day: 10, category: "banka", person: "Mert", recurring: true, color: "#3B82F6" },
  { title: "Mert Ziraat Son Ödeme", day: 11, category: "banka", person: "Mert", recurring: true, color: "#3B82F6" },
  { title: "Yiğit Akbank Son Ödeme", day: 12, category: "banka", person: "Yiğit", notes: "BORÇ YOK", recurring: true, color: "#3B82F6" },
  { title: "Özgür Yapıkredi Sarı Son Ödeme", day: 13, category: "banka", person: "Özgür", recurring: true, color: "#3B82F6" },
  { title: "Mert QNB Son Ödeme", day: 14, category: "banka", person: "Mert", recurring: true, color: "#3B82F6" },
  { title: "Yiğit TEB Son Ödeme", day: 14, amount: 6394, category: "banka", person: "Yiğit", notes: "Toplam 6394 TL, Askeri 1279 TL", recurring: true, color: "#3B82F6" },
  { title: "Mert Deniz Son Ödeme", day: 22, category: "banka", person: "Mert", recurring: true, color: "#3B82F6" },
  { title: "Özgür Yapıkredi Mor Son Ödeme", day: 28, category: "banka", person: "Özgür", recurring: true, color: "#3B82F6" },
  // Maaş ödemeleri (her ay)
  { title: "Mustafa Hocanın Maaş Ödemesi", day: 24, category: "maas", person: "Mustafa Hoca", recurring: true, color: "#10B981" },
  { title: "Adem Hocanın Maaş Ödemesi", day: 26, category: "maas", person: "Adem Hoca", recurring: true, color: "#10B981" },
  // Taksit (her ay)
  { title: "Fuzül Taksit", day: 28, amount: 58000, category: "taksit", recurring: true, color: "#8B5CF6" },
  // Nisan 2026'ya özel
  { title: "Erkanlar Çek Ödemesi", day: 28, amount: 200000, category: "cek", person: "Erkanlar", recurring: false, specificMonth: 4, specificYear: 2026, color: "#F59E0B" },
  { title: "Atatur Gönenli Fişleri Toplanacak", day: 26, category: "hatirlatma", person: "Atatur", recurring: false, specificMonth: 4, specificYear: 2026, color: "#64748B" },
  { title: "Atatur Gönenli Fişlerin Teslimi", day: 28, category: "hatirlatma", person: "Atatur", recurring: false, specificMonth: 4, specificYear: 2026, color: "#64748B" },
];

export default async function TakvimPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const count = await prisma.paymentCalendar.count();
  if (count === 0) {
    await prisma.paymentCalendar.createMany({ data: SEED_DATA });
  }

  const events = await prisma.paymentCalendar.findMany({
    orderBy: { day: "asc" },
  });

  return <TakvimClient initialEvents={events} />;
}
