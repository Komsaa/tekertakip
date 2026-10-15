import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: {
    default: "TekerTakip – Filo Yönetim Sistemi",
    template: "%s | TekerTakip",
  },
  description:
    "Okul ve personel servis firmalarına özel filo yönetim sistemi. Şöför mobil uygulaması, canlı GPS takibi, veli bildirimleri.",
  keywords: ["filo yönetimi", "okul servisi", "personel servisi", "GPS takip", "TekerTakip"],
  openGraph: {
    title: "TekerTakip – Filo Yönetim Sistemi",
    description: "Okul ve personel servis firmalarına özel filo yönetim sistemi.",
    locale: "tr_TR",
    type: "website",
    url: "https://tekertakip.com",
  },
  icons: {
    icon: "/favicon.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#1B2437",
              color: "#fff",
              fontSize: "14px",
            },
            success: {
              iconTheme: { primary: "#22c55e", secondary: "#fff" },
            },
            error: {
              iconTheme: { primary: "#DC2626", secondary: "#fff" },
            },
          }}
        />
      </body>
    </html>
  );
}
