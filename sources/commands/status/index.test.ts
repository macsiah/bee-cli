import { afterEach, describe, expect, it, spyOn } from "bun:test";
import type { CommandContext } from "@/commands/types";
import { createProxyClient } from "@/client";
import { statusCommand } from "./index";

type BunServer = ReturnType<typeof Bun.serve>;

const activeServers: BunServer[] = [];

afterEach(() => {
  for (const server of activeServers.splice(0, activeServers.length)) {
    server.stop(true);
  }
});

describe("status command", () => {
  it("shows proxy connection details in proxy mode", async () => {
    const upstream = Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      fetch: () =>
        Response.json({
          id: 1,
          first_name: "Proxy",
          last_name: "User",
        }),
    });
    activeServers.push(upstream);

    const context: CommandContext = {
      env: "prod",
      client: createProxyClient("prod", {
        address: `http://127.0.0.1:${upstream.port}`,
      }),
    };

    const logs: string[] = [];
    const logSpy = spyOn(console, "log").mockImplementation((...args) => {
      logs.push(args.join(" "));
    });

    try {
      await statusCommand.run([], context);
    } finally {
      logSpy.mockRestore();
    }

    expect(logs.some((line) => line.includes("Connected via proxy:"))).toBe(true);
    expect(logs.some((line) => line.includes("Verified as Proxy User"))).toBe(true);
  });
});
