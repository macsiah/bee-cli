import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { clearProxyConfig, loadProxyConfig, saveProxyConfig } from "@/secureStore";

describe("proxy config store", () => {
  const originalConfigDir = process.env["BEE_CONFIG_DIR"];
  let tempDir = "";

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "bee-cli-proxy-store-"));
    process.env["BEE_CONFIG_DIR"] = tempDir;
  });

  afterEach(() => {
    if (originalConfigDir === undefined) {
      delete process.env["BEE_CONFIG_DIR"];
    } else {
      process.env["BEE_CONFIG_DIR"] = originalConfigDir;
    }
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("saves, loads, and clears proxy config", async () => {
    await saveProxyConfig("prod", { address: "http://127.0.0.1:8787" });

    await expect(loadProxyConfig("prod")).resolves.toEqual({
      address: "http://127.0.0.1:8787",
    });

    await clearProxyConfig("prod");
    await expect(loadProxyConfig("prod")).resolves.toBeNull();
  });

  it("returns null for malformed proxy config", async () => {
    const configDir = tempDir;
    mkdirSync(configDir, { recursive: true });
    writeFileSync(join(configDir, "proxy-prod.json"), "{not-valid-json", "utf8");

    await expect(loadProxyConfig("prod")).resolves.toBeNull();
  });
});
