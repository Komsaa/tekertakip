export function validateDemoRequest(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    return { error: "Geçersiz başvuru bilgileri." } as const;
  const body = input as Record<string, unknown>;
  const limits = {
    companyName: 160,
    contactName: 120,
    phone: 30,
    email: 254,
    city: 80,
  };
  const values: Record<string, string> = {};
  for (const [field, limit] of Object.entries(limits)) {
    const value = body[field];
    if (value != null && typeof value !== "string")
      return { error: "Lütfen alanları metin olarak doldurun." } as const;
    values[field] = typeof value === "string" ? value.trim() : "";
    if (values[field].length > limit)
      return { error: "Girdiğiniz bilgiler çok uzun." } as const;
  }
  if (!values.companyName || !values.contactName || !values.phone)
    return { error: "Firma adı, yetkili adı ve telefon zorunludur." } as const;
  const phone = values.phone.replace(/[\s()-]/g, "");
  if (!/^(?:\+90|0090|90|0)?[1-9]\d{9}$/.test(phone))
    return { error: "Geçerli bir Türkiye telefon numarası girin." } as const;
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
    return { error: "Geçerli bir e-posta adresi girin." } as const;
  const rawCount = body.vehicleCount;
  let vehicleCount: number | null = null;
  if (rawCount != null && rawCount !== "") {
    if (
      !(
        (typeof rawCount === "string" && /^\d+$/.test(rawCount)) ||
        typeof rawCount === "number"
      )
    )
      return { error: "Araç sayısı pozitif bir tam sayı olmalıdır." } as const;
    vehicleCount = Number(rawCount);
    if (
      !Number.isSafeInteger(vehicleCount) ||
      vehicleCount < 1 ||
      vehicleCount > 100000
    )
      return {
        error: "Araç sayısı 1 ile 100.000 arasında olmalıdır.",
      } as const;
  }
  const serviceType = body.serviceType ?? "karma";
  if (
    typeof serviceType !== "string" ||
    !["okul", "personel", "karma"].includes(serviceType)
  )
    return { error: "Geçerli bir servis türü seçin." } as const;
  return {
    data: {
      companyName: values.companyName,
      contactName: values.contactName,
      phone,
      email: values.email || null,
      city: values.city || null,
      vehicleCount,
      serviceType,
    },
  } as const;
}
