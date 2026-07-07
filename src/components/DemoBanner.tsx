"use client";

import { AlertTriangle, Clock, Phone } from "lucide-react";

export default function DemoBanner({ daysLeft, expired }: { daysLeft: number; expired: boolean }) {
  if (expired) {
    return (
      <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2 text-sm font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Demo süreniz doldu. Hesabınız salt okunur modda. Devam etmek için bizimle iletişime geçin.
        </div>
        <a
          href="https://wa.me/905061227363?text=Merhaba%2C%20TekerTakip%20demo%20sürem%20doldu%2C%20devam%20etmek%20istiyorum."
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
        >
          <Phone className="w-3.5 h-3.5" />
          İletişim
        </a>
      </div>
    );
  }

  if (daysLeft <= 7) {
    return (
      <div className="bg-amber-500 text-white px-4 py-3 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Clock className="w-4 h-4 shrink-0" />
          Demo hesabınızın süresi <strong>{daysLeft} gün</strong> sonra doluyor.
        </div>
        <a
          href="https://wa.me/905061227363?text=Merhaba%2C%20TekerTakip%20demo%20sürem%20bitiyor%2C%20abonelik%20hakkında%20bilgi%20almak%20istiyorum."
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
        >
          <Phone className="w-3.5 h-3.5" />
          İletişim
        </a>
      </div>
    );
  }

  return (
    <div className="bg-blue-600 text-white px-4 py-2.5 flex items-center gap-2 shrink-0">
      <Clock className="w-4 h-4 shrink-0" />
      <span className="text-sm">
        Demo hesap · <strong>{daysLeft} gün</strong> kaldı
      </span>
    </div>
  );
}
