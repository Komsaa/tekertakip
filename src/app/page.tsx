import HomeClient from "./HomeClient";

export const metadata = {
  title: "TekerTakip – Okul ve Personel Servis Firmalarına Özel Filo Yönetimi",
  description:
    "Şöför mobil uygulaması, canlı GPS takibi, veli bildirimleri, yakıt ve belge yönetimi. Aylık ₺6.000 + KDV. GPS cihazına gerek yok.",
};

export default function HomePage() {
  return <HomeClient />;
}
