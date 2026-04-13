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
      {/* Sekizgen direksiyon halkası */}
      <path
        d="M34 6 L66 6 L94 34 L94 66 L66 94 L34 94 L6 66 L6 34 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="13"
        strokeLinejoin="round"
      />
      {/* Sol üst kol */}
      <line x1="19" y1="19" x2="45" y2="45" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
      {/* Sağ üst kol */}
      <line x1="81" y1="19" x2="55" y2="45" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
      {/* Alt kol */}
      <line x1="50" y1="88" x2="50" y2="58" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
      {/* GPS pin gövdesi */}
      <path
        d="M50 25 C36 25 25 36 25 50 C25 64 50 83 50 83 C50 83 75 64 75 50 C75 36 64 25 50 25 Z"
        fill="#DC2626"
      />
      {/* GPS pin deliği */}
      <circle cx="50" cy="48" r="11" fill="white" />
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
