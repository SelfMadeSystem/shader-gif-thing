import { performance } from "perf_hooks";
import { writeFileSync } from "fs";
import os from "os";
import { getGPUInfo } from "./gpu-info.ts";

const OUTPUT_FILE = "output/bench.txt";

type TimeState = {
  accum: number;
  start: number | null;
  count: number;
};

const timeMap = new Map<string, TimeState>();
let maxMemoryUsage = 0;

export function start(name: string, count: number = 1) {
  if (timeMap.has(name)) {
    timeMap.get(name)!.start = performance.now();
    timeMap.get(name)!.count += count;
  } else {
    timeMap.set(name, { accum: 0, start: performance.now(), count });
  }
}

export function stop(name: string) {
  const state = timeMap.get(name);
  if (state && state.start !== null) {
    state.accum += performance.now() - state.start;
    state.start = null;
  }
  const memoryUsage = process.memoryUsage().heapUsed;
  if (memoryUsage > maxMemoryUsage) {
    maxMemoryUsage = memoryUsage;
  }
}

function reportState(state: TimeState): string {
  if (state.count === 1) return `${state.accum.toFixed(2)}ms`;
  else
    return `${state.accum.toFixed(2)}ms (${state.count} times, avg: ${(
      state.accum / state.count
    ).toFixed(2)}ms)`;
}

async function getSysInfo(): Promise<string> {
  const platform = os.platform();
  const release = os.release();
  const cpu = os.cpus()[0].model;
  const cores = os.cpus().length;
  const memory = (os.totalmem() / 1024 ** 3).toFixed(2) + " GB";
  const uptime = (os.uptime() / 3600).toFixed(2) + " hours";
  const gpuInfo = await getGPUInfo();

  return `\
System Information:
  Platform: ${platform}
  Release: ${release}
  CPU: ${cpu}
  Cores: ${cores}
  Memory: ${memory}
  Uptime: ${uptime}
${gpuInfo.map((gpu) => `  GPU: ${gpu}\n`).join("")}
`;
}

export async function report() {
  let report = await getSysInfo();
  report += `Max Memory Usage: ${(maxMemoryUsage / 1024 ** 2).toFixed(2)} MB\n\n`;
  for (const [name, state] of timeMap) {
    report += `${name}: ${reportState(state)}\n`;
  }
  writeFileSync(OUTPUT_FILE, report);
  console.log("Benchmark report written to:", OUTPUT_FILE);
}
