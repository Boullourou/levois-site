import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import {
  assertMutationSecurity,
  authenticateCockpit,
  createCsrfToken,
  privateHeaders,
  SecurityError,
  type CockpitEnv,
} from "./security";

async function accessFixture(
  overrides: Record<string, unknown> = {},
  options: { issuer?: string; audience?: string; expiration?: string | null } = {},
) {
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  const jwk = await exportJWK(publicKey);
  const local = createLocalJWKSet({ keys: [{ ...jwk, kid: "test-key", alg: "RS256", use: "sig" }] });
  const env: CockpitEnv = {
    CF_ACCESS_TEAM_DOMAIN: "https://levois-test.cloudflareaccess.com",
    CF_ACCESS_AUD: "cockpit-audience",
    COCKPIT_ALLOWED_HOSTS: "cockpit.levois.test",
    COCKPIT_ALLOWED_EMAIL: "operator@example.invalid",
    COCKPIT_ALLOWED_SUB: "operator-subject",
    COCKPIT_CSRF_SECRET: "test-only-csrf-secret-at-least-24-characters",
  };
  let tokenBuilder = new SignJWT({
    email: "operator@example.invalid",
    type: "app",
    ...overrides,
  })
    .setProtectedHeader({ alg: "RS256", kid: "test-key" })
    .setIssuer(options.issuer ?? "https://levois-test.cloudflareaccess.com")
    .setAudience(options.audience ?? "cockpit-audience")
    .setSubject("operator-subject")
    .setIssuedAt();
  if (options.expiration !== null) tokenBuilder = tokenBuilder.setExpirationTime(options.expiration ?? "5m");
  const token = await tokenBuilder.sign(privateKey);
  return { env, token, local };
}

describe("cockpit Access boundary", () => {
  it("accepts only a signed Access identity on an allowlisted host", async () => {
    const { env, token, local } = await accessFixture();
    const request = new Request("https://cockpit.levois.test/api/cockpit/session", {
      headers: { "Cf-Access-Jwt-Assertion": token },
    });
    await expect(authenticateCockpit(request, env, local)).resolves.toMatchObject({
      id: "operator-subject",
      email: "operator@example.invalid",
      local: false,
    });
  });

  it("refuses a missing, bad-audience or non-allowlisted identity", async () => {
    const { env, token, local } = await accessFixture({ email: "someone-else@example.invalid" });
    await expect(authenticateCockpit(new Request("https://cockpit.levois.test/api/cockpit/session"), env, local))
      .rejects.toMatchObject({ code: "ACCESS_REQUIRED", status: 401 });
    await expect(authenticateCockpit(new Request("https://cockpit.levois.test/api/cockpit/session", {
      headers: { "Cf-Access-Jwt-Assertion": token },
    }), env, local)).rejects.toMatchObject({ code: "IDENTITY_NOT_ALLOWED", status: 403 });
  });

  it("refuses a wrong issuer, audience, missing expiration and expired assertion", async () => {
    for (const options of [
      { issuer: "https://wrong.cloudflareaccess.com" },
      { audience: "wrong-audience" },
      { expiration: null },
      { expiration: "-1h" },
    ]) {
      const { env, token, local } = await accessFixture({}, options);
      await expect(authenticateCockpit(new Request("https://cockpit.levois.test/api/cockpit/session", {
        headers: { "Cf-Access-Jwt-Assertion": token },
      }), env, local)).rejects.toMatchObject({ code: "ACCESS_INVALID", status: 401 });
    }
  });

  it("never enables the local bypass on a remote hostname", async () => {
    const env: CockpitEnv = { COCKPIT_LOCAL_BYPASS: "1", COCKPIT_ALLOWED_HOSTS: "preview.example.test" };
    await expect(authenticateCockpit(new Request("https://preview.example.test/cockpit/"), env))
      .rejects.toMatchObject({ code: "ACCESS_REQUIRED", status: 401 });
    await expect(authenticateCockpit(new Request("http://127.0.0.1:8788/cockpit/"), env))
      .resolves.toMatchObject({ local: true });
  });

  it("requires exact same-origin and a valid CSRF token for mutations", async () => {
    const { env } = await accessFixture();
    const actor = { id: "operator-subject", email: "operator@example.invalid", local: false };
    const sessionRequest = new Request("https://cockpit.levois.test/api/cockpit/session");
    const token = await createCsrfToken(sessionRequest, actor, env);
    const valid = new Request("https://cockpit.levois.test/api/cockpit/clients/create", {
      method: "POST",
      headers: {
        Origin: "https://cockpit.levois.test",
        "Content-Type": "application/json",
        "X-LEVOIS-CSRF": token,
      },
      body: "{}",
    });
    await expect(assertMutationSecurity(valid, actor, env)).resolves.toBeUndefined();
    const invalid = new Request(valid, { headers: { ...Object.fromEntries(valid.headers), Origin: "https://attacker.invalid" } });
    await expect(assertMutationSecurity(invalid, actor, env)).rejects.toBeInstanceOf(SecurityError);
  });

  it("marks every private response no-store and noindex", () => {
    const headers = privateHeaders("application/json");
    expect(headers.get("Cache-Control")).toContain("no-store");
    expect(headers.get("X-Robots-Tag")).toContain("noindex");
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("Content-Security-Policy")).toContain("frame-ancestors 'none'");
  });
});
