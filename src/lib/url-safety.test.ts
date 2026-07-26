import { describe, expect, it } from "vitest";

import {
  UrlSafetyError,
  validatePublicHttpUrl,
} from "./url-safety";

describe("validatePublicHttpUrl", () => {
  it("accepts a normal HTTPS URL", () => {
    const result = validatePublicHttpUrl(
      "https://example.com/jobs/123",
    );

    expect(result.hostname).toBe("example.com");
    expect(result.protocol).toBe("https:");
  });

  it("rejects localhost", () => {
    expect(() =>
      validatePublicHttpUrl(
        "http://localhost:3000/private",
      ),
    ).toThrow(UrlSafetyError);
  });

  it("rejects private IP addresses", () => {
    expect(() =>
      validatePublicHttpUrl(
        "http://192.168.1.20/jobs",
      ),
    ).toThrow(UrlSafetyError);
  });

  it("rejects URL credentials", () => {
    expect(() =>
      validatePublicHttpUrl(
        "https://user:password@example.com/jobs",
      ),
    ).toThrow(UrlSafetyError);
  });

  it("rejects non-web protocols", () => {
    expect(() =>
      validatePublicHttpUrl(
        "file:///C:/private-file.txt",
      ),
    ).toThrow(UrlSafetyError);
  });

  it("rejects nonstandard ports", () => {
    expect(() =>
      validatePublicHttpUrl(
        "https://example.com:8080/jobs",
      ),
    ).toThrow(UrlSafetyError);
  });
});