export function parseMobileAccount(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Geçersiz form");
  const b = input as Record<string, unknown>;
  const str = (key: string) => typeof b[key] === "string" ? (b[key] as string).trim() : "";
  const name = str("name"), companyId = str("companyId"), mobileUsername = str("mobileUsername").toLowerCase(), mobilePin = str("mobilePin"), phone = str("phone");
  const role = str("role") || "driver";
  if (!["driver", "manager"].includes(role)) throw new Error("Geçersiz hesap türü");
  if (!name || name.length > 100 || !companyId || companyId.length > 100) throw new Error("Ad soyad ve firma zorunlu");
  if (!/^[a-z0-9._-]{3,60}$/.test(mobileUsername)) throw new Error("Kullanıcı adı 3–60 karakter; İngilizce harf, rakam, nokta, tire veya alt çizgi olmalı");
  if (mobilePin.length < 8 || Buffer.byteLength(mobilePin, "utf8") > 72) throw new Error("Şifre en az 8 karakter ve en fazla 72 bayt olmalı");
  if (phone.length > 30) throw new Error("Telefon en fazla 30 karakter olabilir");
  return { name, companyId, mobileUsername, mobilePin, phone, role };
}
