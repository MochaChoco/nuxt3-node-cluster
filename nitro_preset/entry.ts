import cluster from "node:cluster";
import os from "node:os";
import { getGracefulShutdownConfig } from "nitropack/runtime/shutdown";
import { trapUnhandledNodeErrors } from "nitropack/runtime/utils";

let idx = 0;

function runMaster() {
  const numberOfWorkers =
    Number.parseInt(process.env.NITRO_CLUSTER_WORKERS) ||
    (os.cpus().length > 0 ? os.cpus().length : 1);
  for (let i = 0; i < numberOfWorkers; i++) {
    const worker = cluster.fork();

    worker.on("message", (id) => {});
  }
  let isShuttingDown = false;
  cluster.on("exit", () => {
    if (!isShuttingDown) {
      cluster.fork();
    }
  });
  const shutdownConfig = getGracefulShutdownConfig();
  if (!shutdownConfig.disabled) {
    async function onShutdown() {
      if (isShuttingDown) {
        return;
      }
      isShuttingDown = true;
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.warn(
            "[nitro] [cluster] Timeout reached for graceful shutdown. Forcing exit."
          );
          resolve();
        }, shutdownConfig.timeout);
        cluster.on("exit", () => {
          if (Object.values(cluster.workers).every((w) => w.isDead())) {
            clearTimeout(timeout);
            resolve();
          } else {
          }
        });
      });
      if (shutdownConfig.forceExit) {
        process.exit(0);
      }
    }
    for (const signal of shutdownConfig.signals) {
      process.once(signal, onShutdown);
    }
  }
}
function runWorker() {
  import("./node-server.mjs").catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
trapUnhandledNodeErrors();
if (cluster.isPrimary) {
  runMaster();
} else {
  runWorker();
}
