"use client";

import { useRef, useState } from "react";
import { Camera, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function VehiclePhoto({
  vehicleId,
  photoUrl,
}: {
  vehicleId: string;
  photoUrl: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(photoUrl);
  const router = useRouter();

  async function handleFile(file: File) {
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      alert("Sadece JPG veya PNG yüklenebilir");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("entityType", "vehicle");
      fd.append("entityId", vehicleId);
      fd.append("docType", "photo");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) {
        setPreview(data.url);
        router.refresh();
      } else {
        alert(data.error ?? "Yükleme başarısız");
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-start gap-4">
      {/* Fotoğraf kutusu */}
      <div
        className="relative w-32 h-24 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden cursor-pointer hover:border-slate-400 transition-colors flex-shrink-0"
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <>
            <Image
              src={preview}
              alt="Araç fotoğrafı"
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </>
        ) : (
          <div className="text-center text-slate-400">
            <Camera className="w-8 h-8 mx-auto mb-1" />
            <span className="text-xs">Fotoğraf ekle</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-[#DC2626] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Yükle butonu */}
      <div className="flex flex-col gap-2 pt-1">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 text-sm px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          {preview ? "Fotoğrafı Değiştir" : "Fotoğraf Yükle"}
        </button>
        <p className="text-xs text-slate-400">JPG veya PNG · Araç fotoğrafı</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
