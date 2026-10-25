export type Config = {
  listenHost: string;
  listenPort: number;
  healthHost: string;
  healthPort: number;
  statusToken?: string;
  ingestUrl: string;
  deviceCheckUrl: string;
  ingestSecret: string;
  deviceAuthSecret: string;
  maxConnections: number;
  maxConnectionsPerIp: number;
  authTimeoutMs: number;
  idleTimeoutMs: number;
  maxMessagesPerSecond: number;
  tzOffsetMinutes: number;
  maxFutureSkewMs: number;
  maxAgeMs: number;
  httpTimeoutMs: number;
  logLevel: "debug" | "info" | "warn" | "error";
};

function int(env: NodeJS.ProcessEnv, name: string, fallback: number, min = 0): number {
  const raw = env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min) throw new Error(`${name} must be an integer >= ${min}`);
  return n;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const ingestUrl = env.GPS_INGEST_URL;
  const ingestSecret = env.GPS_INGEST_SECRET;
  const deviceAuthSecret = env.GPS_DEVICE_AUTH_SECRET;
  if (!ingestUrl) throw new Error("GPS_INGEST_URL is required (e.g. https://dttbhutan.com/api/gps/ingest)");
  if (!ingestSecret) throw new Error("GPS_INGEST_SECRET is required");
  if (!deviceAuthSecret || deviceAuthSecret.length < 24) {
    throw new Error("GPS_DEVICE_AUTH_SECRET is required and must be at least 24 characters");
  }
  if (deviceAuthSecret === ingestSecret) {
    throw new Error("GPS_DEVICE_AUTH_SECRET must differ from GPS_INGEST_SECRET");
  }

  const url = new URL(ingestUrl);
  const loopback = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname);
  if (url.protocol !== "https:" && !(loopback || env.GPS_ALLOW_INSECURE_INGEST === "1")) {
    throw new Error("GPS_INGEST_URL must be https:// (set GPS_ALLOW_INSECURE_INGEST=1 only for a private test network)");
  }
  const deviceCheckUrl = env.GPS_DEVICE_CHECK_URL ?? ingestUrl.replace(/\/ingest\/?$/, "/device");

  const level = (env.LOG_LEVEL ?? "info") as Config["logLevel"];
  if (!["debug", "info", "warn", "error"].includes(level)) throw new Error("LOG_LEVEL must be debug|info|warn|error");

  return {
    listenHost: env.GPS_LISTEN_HOST ?? "0.0.0.0",
    listenPort: int(env, "GPS_LISTEN_PORT", 8808, 0),
    healthHost: env.GPS_HEALTH_HOST ?? "127.0.0.1",
    healthPort: int(env, "GPS_HEALTH_PORT", 8809, 0),
    statusToken: env.GPS_STATUS_TOKEN || undefined,
    ingestUrl,
    deviceCheckUrl,
    ingestSecret,
    deviceAuthSecret,
    maxConnections: int(env, "GPS_MAX_CONNECTIONS", 500, 1),
    maxConnectionsPerIp: int(env, "GPS_MAX_CONNECTIONS_PER_IP", 20, 1),
    authTimeoutMs: int(env, "GPS_AUTH_TIMEOUT_MS", 30_000, 1000),
    idleTimeoutMs: int(env, "GPS_IDLE_TIMEOUT_MS", 300_000, 1000),
    maxMessagesPerSecond: int(env, "GPS_MAX_MESSAGES_PER_SECOND", 20, 1),
    // The spec says every time is GMT+8. Check this against a real device.
    tzOffsetMinutes: int(env, "GPS_DEVICE_TZ_OFFSET_MINUTES", 480, -720),
    maxFutureSkewMs: int(env, "GPS_MAX_FUTURE_SKEW_SECONDS", 600, 0) * 1000,
    maxAgeMs: int(env, "GPS_MAX_POSITION_AGE_DAYS", 30, 1) * 86_400_000,
    httpTimeoutMs: int(env, "GPS_HTTP_TIMEOUT_MS", 5000, 500),
    logLevel: level,
  };
}
