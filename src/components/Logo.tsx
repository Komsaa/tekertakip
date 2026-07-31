// TekerTakip logosu — 3 kollu modern jant + GPS pin hub
// currentColor ile her temada çalışır (sidebar: text-white, açık zemin: text-[#1B2437])

export function LogoIcon({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Dış lastik halkası */}
      <circle cx="50" cy="50" r="43" stroke="currentColor" strokeWidth="9" />

      {/* 3 jant kolu — 120° aralıklı, üstten başlar */}
      {/* Üst kol */}
      <line x1="50" y1="7" x2="50" y2="50" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
      {/* Sol-alt kol */}
      <line x1="12.7" y1="71.5" x2="50" y2="50" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
      {/* Sağ-alt kol */}
      <line x1="87.3" y1="71.5" x2="50" y2="50" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />

      {/* GPS pin — kol kesişimini örter, hub görevi görür */}
      <path
        d="M50 24 C39 24 30 33 30 43 C30 56 50 73 50 73 C50 73 70 56 70 43 C70 33 61 24 50 24Z"
        fill="#DC2626"
      />
      {/* Pin beyaz deliği */}
      <circle cx="50" cy="42" r="10" fill="white" />
    </svg>
  );
}

// Tam logo: ikon + metin
export function LogoFull({
  size = 36,
  textSize = "text-xl",
  className = "",
}: {
  size?: number;
  textSize?: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoIcon size={size} />
      <span className={`font-black tracking-tight ${textSize}`}>
        teker<span className="text-[#DC2626]">takip</span>
      </span>
    </span>
  );
}
