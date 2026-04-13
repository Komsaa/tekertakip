// Steering wheel + GPS pin — tekertakip logosu
// Transparan arka plan, her yerde kullanılabilir

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
      {/* Sekizgen direksiyon halkası — logodaki gibi kalın ve yuvarlak köşeli */}
      <path
        d="M29 6 L71 6 L94 29 L94 71 L71 94 L29 94 L6 71 L6 29 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="14"
        strokeLinejoin="round"
      />
      {/* Sol yatay kol (göz etkisi) */}
      <line x1="7" y1="50" x2="34" y2="46" stroke="currentColor" strokeWidth="13" strokeLinecap="round" />
      {/* Sağ yatay kol (göz etkisi) */}
      <line x1="93" y1="50" x2="66" y2="46" stroke="currentColor" strokeWidth="13" strokeLinecap="round" />
      {/* Alt kol */}
      <line x1="50" y1="93" x2="50" y2="70" stroke="currentColor" strokeWidth="13" strokeLinecap="round" />
      {/* GPS pin gövdesi */}
      <path
        d="M50 22 C37 22 26 33 26 46 C26 60 50 80 50 80 C50 80 74 60 74 46 C74 33 63 22 50 22 Z"
        fill="#DC2626"
      />
      {/* GPS pin beyaz delik */}
      <circle cx="50" cy="44" r="11" fill="white" />
    </svg>
  );
}

// Tam logo: ikon + yazı yan yana
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
      <span className={`font-black tracking-tight ${textSize} text-white`}>
        teker<span className="text-[#DC2626]">takip</span>
      </span>
    </span>
  );
}
