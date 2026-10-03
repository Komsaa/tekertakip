import HomeClient from "./HomeClient";

export const metadata = {
  title: "TekerTakip – Okul ve Personel Servis Firmalarına Özel Filo Yönetimi",
  description:
    "Araçlarınız, şoförleriniz ve günlük operasyonunuz tek ekranda. Canlı konum, güzergâh, yakıt, belge ve finans yönetimi. TekerTakip ile tanışın.",
};

export default function HomePage() {
  return <HomeClient />;
}
