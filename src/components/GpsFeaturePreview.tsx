export default function GpsFeaturePreview() {
  return (
    <figure className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50" aria-label="Örnek araç konumları">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-3 text-xs">
        <span className="font-semibold text-slate-800">Filo konum görünümü</span>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">Örnek görünüm</span>
      </div>
      <svg viewBox="0 0 480 260" className="block h-auto w-full" role="img" aria-label="Şematik güzergâhta 45 HB 123, 34 AB 456 ve 35 CD 789 plakalı üç örnek araç">
        <rect width="480" height="260" fill="#edf2ec" />
        <path d="M0 8L95 0 152 85 105 135 0 110ZM310 0H480V85L395 110 340 62ZM280 185L350 170 480 210V260H275Z" fill="#dce7d7" />
        <path d="M195 -20C140 65 268 110 200 180S198 250 235 280" fill="none" stroke="#bddde5" strokeWidth="38" />
        <g fill="none" stroke="#fff" strokeWidth="13">
          <path d="M-20 205L115 145 280 150 500 75M60 -10L110 90 100 280M300 -10L290 85 380 180 390 280M-10 50L155 90 290 85 490 165" />
        </g>
        <path d="M85 135L115 145 280 150 342 129" fill="none" stroke="#dc2626" strokeWidth="4" strokeDasharray="7 6" strokeLinecap="round" />
        {[{ x: 85, y: 135, plate: "45 HB 123", color: "#047857" }, { x: 260, y: 150, plate: "34 AB 456", color: "#b45309" }, { x: 369, y: 97, plate: "35 CD 789", color: "#047857" }].map(pin => (
          <g key={pin.plate} transform={`translate(${pin.x} ${pin.y})`}>
            <circle r="23" fill={pin.color} opacity="0.12" />
            <circle r="15" fill={pin.color} stroke="white" strokeWidth="3" />
            <path d="M-7 -5H3V4H-7ZM3 -2H7L9 1V4H3" fill="none" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="-4" cy="5" r="2" fill="white" /><circle cx="6" cy="5" r="2" fill="white" />
            <rect x="-48" y="24" width="96" height="27" rx="7" fill="white" stroke="#cbd5e1" />
            <text x="0" y="42" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="13" fontWeight="700" fill="#1e293b">{pin.plate}</text>
          </g>
        ))}
      </svg>
      <figcaption className="border-t border-slate-200 bg-white px-4 py-3 text-xs leading-relaxed text-slate-500">Şematik tanıtım görselidir; gerçek araç konumu içermez.</figcaption>
    </figure>
  );
}
