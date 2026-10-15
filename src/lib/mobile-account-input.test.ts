import test from "node:test";
import assert from "node:assert/strict";
import { parseMobileAccount } from "./mobile-account-input";
import { requireAdmin } from "./tenant";
import type { Session } from "next-auth";

const valid = { name: "Review Driver", companyId: "review-company", mobileUsername: "Review.Driver", mobilePin: "ExampleTest123", role: "driver" };
test("normalizes login and keeps selected company", () => {
  const result = parseMobileAccount(valid);
  assert.equal(result.mobileUsername, "review.driver");
  assert.equal(result.companyId, "review-company");
});
test("requires company", () => assert.throws(() => parseMobileAccount({ ...valid, companyId: "" })));
test("does not accept admin privilege request", () => assert.throws(() => parseMobileAccount({ ...valid, role: "admin" })));
test("accepts company manager", () => assert.equal(parseMobileAccount({ ...valid, role: "manager" }).role, "manager"));
test("rejects malformed request bodies", () => {
  for (const body of [null, [], "test", { ...valid, name: {} }]) assert.throws(() => parseMobileAccount(body));
});
test("enforces password length and bcrypt byte limit", () => {
  for (const mobilePin of ["1234", "a".repeat(73), "ü".repeat(37)]) assert.throws(() => parseMobileAccount({ ...valid, mobilePin }));
});
test("rejects invalid usernames", () => {
  for (const mobileUsername of ["ab", "user name", "<script>", "a".repeat(61)]) assert.throws(() => parseMobileAccount({ ...valid, mobileUsername }));
});
const session = (role: string, companyId: string | null) => ({ user: { role, companyId }, expires: "2099-01-01" }) as unknown as Session;
test("global administrator may manage accounts", () => assert.equal(requireAdmin(session("admin", null)), null));
test("company user and company-scoped admin cannot manage global accounts", () => {
  assert.equal(requireAdmin(session("firma", "company"))?.status, 403);
  assert.equal(requireAdmin(session("admin", "company"))?.status, 403);
  assert.equal(requireAdmin(session("firma", null))?.status, 403);
});
