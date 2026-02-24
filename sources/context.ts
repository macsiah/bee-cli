import { createDeveloperClient, createProxyClient } from "@/client";
import type { CommandContext } from "@/commands/types";
import type { Environment } from "@/environment";
import { loadProxyConfig } from "@/secureStore";

export async function createCommandContext(env: Environment): Promise<CommandContext> {
  const proxyConfig = await loadProxyConfig(env);
  if (proxyConfig) {
    return {
      env,
      client: createProxyClient(env, proxyConfig),
    };
  }

  return {
    env,
    client: createDeveloperClient(env),
  };
}
