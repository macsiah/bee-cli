import { afterEach, describe, expect, it } from "bun:test";
import type { CommandContext } from "@/commands/types";
import { createProxyClient } from "@/client";
import { requireClientToken, requestClientJson } from "./clientApi";

type BunServer = ReturnType<typeof Bun.serve>;

const activeServers: BunServer[] = [];

afterEach(() => {
  for (const server of activeServers.splice(0, activeServers.length)) {
    server.stop(true);
  }
});

describe("client API auth", () => {
  it("skips token requirement in proxy mode", async () => {
    const context: CommandContext = {
      env: "prod",
      client: createProxyClient("prod", { address: "http://127.0.0.1:8787" }),
    };

    await expect(requireClientToken(context)).resolves.toBeNull();
  });

  it("does not inject Authorization header in proxy mode requests", async () => {
    let seenAuthorization: string | null = null;
    const proxy = Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      fetch: (request) => {
        seenAuthorization = request.headers.get("authorization");
        return Response.json({ ok: true });
      },
    });
    activeServers.push(proxy);

    const context: CommandContext = {
      env: "prod",
      client: createProxyClient("prod", {
        address: `http://127.0.0.1:${proxy.port}`,
      }),
    };

    const data = await requestClientJson(context, "/v1/me", { method: "GET" });
    expect(data).toEqual({ ok: true });
    expect(seenAuthorization).toBeNull();
  });
});
