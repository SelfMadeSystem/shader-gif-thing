import { performance } from "perf_hooks";
import { writeFileSync } from "fs";
import os from "os";
import { getGPUInfo } from "./gpu-info.ts";

const OUTPUT_FILE = "output/bench.txt";

type TimeState = {
  accum: number;
  start: number | null;
  count: number;
  children: Map<string, TimeState>;
  parent: TimeState | null;
};

const timeMap = new Map<string, TimeState>();
let current: TimeState | null = null;
let maxMemoryUsage = 0;

export function start(name: string, count: number = 1) {
  const map = current ? current.children : timeMap;

  if (map.has(name)) {
    map.get(name)!.start = performance.now();
    map.get(name)!.count += count;
  } else {
    map.set(name, {
      accum: 0,
      start: performance.now(),
      count,
      children: new Map(),
      parent: current,
    });
  }

  current = map.get(name) ?? null;
}

export function stop(name: string) {
  const map = current?.parent ? current.parent.children : timeMap;

  const state = map.get(name);
  if (state && state.start !== null) {
    state.accum += performance.now() - state.start;
    state.start = null;
  }
  const memoryUsage = process.memoryUsage().heapUsed;
  if (memoryUsage > maxMemoryUsage) {
    maxMemoryUsage = memoryUsage;
  }

  current = state?.parent ?? null;
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

function reportStateTree(name: string, state: TimeState, depth: number = 0): string {
  const indent = "  ".repeat(depth);
  let report = `${indent}${name}: ${reportState(state)}\n`;
  for (const c of state.children) {
    report += reportStateTree(...c, depth + 1);
  }
  return report;
}

export async function report() {
  let report = await getSysInfo();
  report += `Max Memory Usage: ${(maxMemoryUsage / 1024 ** 2).toFixed(
    2
  )} MB\n\n`;
  for (const [name, state] of timeMap) {
    report += reportStateTree(name, state, 0);
  }
  writeFileSync(OUTPUT_FILE, report);
  console.log("Benchmark report written to:", OUTPUT_FILE);
}
