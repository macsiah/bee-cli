import { afterEach, describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createProxyClient } from "@/client";

type BunServer = ReturnType<typeof Bun.serve>;

const activeServers: BunServer[] = [];
const cleanupPaths: string[] = [];

afterEach(() => {
  for (const server of activeServers.splice(0, activeServers.length)) {
    server.stop(true);
  }
  for (const path of cleanupPaths.splice(0, cleanupPaths.length)) {
    rmSync(path, { recursive: true, force: true });
  }
});

describe("proxy client", () => {
  it("routes HTTP proxy requests through configured base URL", async () => {
    let seenPath = "";
    let seenAuthorization: string | null = null;

    const upstream = Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      fetch: (request) => {
        const url = new URL(request.url);
        seenPath = `${url.pathname}${url.search}`;
        seenAuthorization = request.headers.get("authorization");
        return Response.json({ ok: true });
      },
    });
    activeServers.push(upstream);

    const client = createProxyClient("prod", {
      address: `http://127.0.0.1:${upstream.port}`,
    });

    const response = await client.fetch("/v1/me?x=1", { method: "GET" });
    expect(response.ok).toBe(true);
    expect(seenPath).toBe("/v1/me?x=1");
    expect(seenAuthorization).toBeNull();
  });

  it("routes unix socket proxy requests with unix fetch option", async () => {
    let seenPath = "";
    const dir = mkdtempSync(join(tmpdir(), "bee-cli-proxy-client-"));
    cleanupPaths.push(dir);
    const socketPath = join(dir, "proxy.sock");

    const upstream = Bun.serve({
      unix: socketPath,
      fetch: (request) => {
        const url = new URL(request.url);
        seenPath = url.pathname;
        return Response.json({ ok: true });
      },
    });
    activeServers.push(upstream);

    const client = createProxyClient("prod", { address: socketPath });
    const response = await client.fetch("/v1/me", { method: "GET" });

    expect(response.ok).toBe(true);
    expect(seenPath).toBe("/v1/me");
    expect(client.isProxy).toBe(true);
  });
});
