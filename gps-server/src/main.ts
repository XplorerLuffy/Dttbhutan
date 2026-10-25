import { loadConfig } from "./config";
import { createHealthServer } from "./health";
import { createLogger } from "./logger";
import { GpsServer } from "./server";
import { HttpDeviceRegistry, HttpPositionSink, WebsiteHealth } from "./website";

async function main() {
  const cfg = loadConfig();
  const log = createLogger(cfg.logLevel);
  const health = new WebsiteHealth();
  const gps = new GpsServer({
    cfg,
    log,
    sink: new HttpPositionSink(cfg, log, health),
    registry: new HttpDeviceRegistry(cfg, log, health),
  });
  await gps.start();
  const healthServer = createHealthServer(cfg, gps, health);
  healthServer.listen(cfg.healthPort, cfg.healthHost);
  log.info("jt808 server listening", {
    port: gps.port(),
    health: `${cfg.healthHost}:${cfg.healthPort}`,
    ingest: new URL(cfg.ingestUrl).origin,
    tzOffsetMinutes: cfg.tzOffsetMinutes,
  });

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    log.info("shutting down", { signal });
    healthServer.close();
    await gps.stop();
    process.exit(0);
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((err) => {
  console.error(JSON.stringify({ level: "error", msg: "failed to start", error: err instanceof Error ? err.message : String(err) }));
  process.exit(1);
});
