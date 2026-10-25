import http from "node:http";
import type { Config } from "./config";
import type { GpsServer } from "./server";
import type { WebsiteHealth } from "./website";

/**
 * Small HTTP side-port for monitoring, bound to localhost by default.
 *  /healthz  process is up
 *  /readyz   listening, and the last website call did not fail
 *  /status   counters and per-device last-message times (needs the bearer
 *            token if GPS_STATUS_TOKEN is set). No coordinates, no codes.
 */
export function createHealthServer(cfg: Config, gps: GpsServer, website: WebsiteHealth): http.Server {
  return http.createServer((req, res) => {
    const send = (code: number, body: unknown) => {
      res.writeHead(code, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
    };
    if (req.method !== "GET") return send(405, { error: "method" });
    if (req.url === "/healthz") return send(200, { status: "ok" });
    if (req.url === "/readyz") {
      const ready = gps.listening && website.healthy;
      return send(ready ? 200 : 503, { ready, listening: gps.listening, websiteHealthy: website.healthy });
    }
    if (req.url === "/status") {
      if (cfg.statusToken && req.headers.authorization !== `Bearer ${cfg.statusToken}`) {
        return send(401, { error: "unauthorized" });
      }
      return send(200, {
        uptimeSeconds: Math.round(process.uptime()),
        counters: gps.counters,
        website: {
          lastOkAt: website.lastOkAt ? new Date(website.lastOkAt).toISOString() : null,
          lastErrorAt: website.lastErrorAt ? new Date(website.lastErrorAt).toISOString() : null,
        },
        connections: gps.connections(),
      });
    }
    send(404, { error: "not found" });
  });
}
