import { homedir } from "node:os";
import { join } from "node:path";

export const DEFAULT_PROXY_SOCKET_PATH = "~/.bee/proxy.sock";

export function isSocketPath(value: string): boolean {
  return value.startsWith("/") || value.startsWith("~") || value.endsWith(".sock");
}

export function expandHomePath(value: string): string {
  if (value === "~") {
    return homedir();
  }
  if (value.startsWith("~/")) {
    return join(homedir(), value.slice(2));
  }
  return value;
}

export function normalizeProxyAddress(value: string): string {
  return value.trim();
}
