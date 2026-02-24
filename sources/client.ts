import { getEnvironmentConfig, type Environment } from "@/environment";
import type { ProxyConfig } from "@/secureStore";
import {
  expandHomePath,
  isSocketPath,
  normalizeProxyAddress,
} from "@/utils/proxyAddress";

type TlsOptions = {
  ca?: string | string[];
};

type FetchInit = RequestInit & {
  tls?: TlsOptions;
  unix?: string;
};

export type DeveloperClient = {
  env: Environment;
  baseUrl: string;
  isProxy: boolean;
  proxyAddress?: string;
  fetch: (path: string, init?: FetchInit) => Promise<Response>;
};

export function createDeveloperClient(env: Environment): DeveloperClient {
  const config = getEnvironmentConfig(env);
  const ca = [...config.caCerts];

  return {
    env,
    baseUrl: config.apiUrl,
    isProxy: false,
    fetch: (path, init) => {
      const url = new URL(path, config.apiUrl);
      const requestInit: FetchInit = init
        ? { ...init, tls: { ca } }
        : { tls: { ca } };
      return fetch(url, requestInit);
    },
  };
}

export function createProxyClient(
  env: Environment,
  proxyConfig: ProxyConfig
): DeveloperClient {
  const address = normalizeProxyAddress(proxyConfig.address);
  if (!address) {
    throw new Error("Proxy address cannot be empty.");
  }

  if (isSocketPath(address)) {
    const socketPath = expandHomePath(address);
    const baseUrl = "http://localhost/";
    return {
      env,
      baseUrl,
      isProxy: true,
      proxyAddress: address,
      fetch: (path, init) => {
        const url = new URL(path, baseUrl);
        const requestInit: FetchInit = init ? { ...init, unix: socketPath } : { unix: socketPath };
        return fetch(url, requestInit);
      },
    };
  }

  let baseUrl: string;
  try {
    const parsed = new URL(address);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("Proxy URL must start with http:// or https://.");
    }
    baseUrl = parsed.toString();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Invalid proxy address: ${error.message}`);
    }
    throw new Error("Invalid proxy address.");
  }

  return {
    env,
    baseUrl,
    isProxy: true,
    proxyAddress: address,
    fetch: (path, init) => {
      const url = new URL(path, baseUrl);
      return fetch(url, init);
    },
  };
}
