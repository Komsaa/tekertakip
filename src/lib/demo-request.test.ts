import { test } from "node:test";
import assert from "node:assert/strict";
import { validateDemoRequest } from "./demo-request";

const valid = {
  companyName: " Örnek Servis ",
  contactName: " Örnek Yetkili ",
  phone: "0532 123 45 67",
  email: "info@example.com",
  vehicleCount: "12",
  serviceType: "okul",
};
test("normalizes a valid request", () => {
  const result = validateDemoRequest(valid);
  assert.ok(result.data);
  assert.equal(result.data.companyName, "Örnek Servis");
  assert.equal(result.data.phone, "05321234567");
  assert.equal(result.data.vehicleCount, 12);
});
test("accepts an omitted optional fleet size and email", () => {
  const result = validateDemoRequest({ ...valid, vehicleCount: "", email: "" });
  assert.equal(result.data?.vehicleCount, null);
  assert.equal(result.data?.email, null);
});
for (const input of [
  null,
  [],
  "invalid",
  { ...valid, companyName: 123 },
  { ...valid, contactName: " " },
  { ...valid, phone: "abc123" },
  { ...valid, email: "wrong@" },
  { ...valid, vehicleCount: "12abc" },
  { ...valid, vehicleCount: "1.5" },
  { ...valid, vehicleCount: 0 },
  { ...valid, vehicleCount: -1 },
  { ...valid, vehicleCount: 100001 },
  { ...valid, vehicleCount: true },
  { ...valid, serviceType: "other" },
  { ...valid, city: "a".repeat(81) },
]) {
  test(`rejects malformed input: ${JSON.stringify(input)}`, () =>
    assert.ok(validateDemoRequest(input).error));
}
