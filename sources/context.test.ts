import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCommandContext } from "@/context";
import { clearProxyConfig, saveProxyConfig } from "@/secureStore";

describe("command context", () => {
  const originalConfigDir = process.env["BEE_CONFIG_DIR"];
  let tempDir = "";

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "bee-cli-context-"));
    process.env["BEE_CONFIG_DIR"] = tempDir;
  });

  afterEach(async () => {
    await clearProxyConfig("prod");
    await clearProxyConfig("staging");
    if (originalConfigDir === undefined) {
      delete process.env["BEE_CONFIG_DIR"];
    } else {
      process.env["BEE_CONFIG_DIR"] = originalConfigDir;
    }
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("uses developer client when no proxy config is present", async () => {
    const context = await createCommandContext("prod");
    expect(context.client.isProxy).toBe(false);
  });

  it("uses proxy client when proxy config exists", async () => {
    await saveProxyConfig("prod", { address: "http://127.0.0.1:8787" });
    const context = await createCommandContext("prod");
    expect(context.client.isProxy).toBe(true);
    expect(context.client.proxyAddress).toBe("http://127.0.0.1:8787");
  });
});
