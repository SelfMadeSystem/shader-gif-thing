import { performance } from "perf_hooks";
import { writeFileSync } from "fs";
import os from "os";
import { getGPUInfo } from "./gpu-info.ts";

const OUTPUT_FILE = "output/bench.txt";

type TimeState = {
  accum: number;
  min: number;
  max: number;
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
      min: Infinity,
      max: 0,
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
    const elapsed = performance.now() - state.start;
    state.accum += elapsed;
    state.start = null;
    if (elapsed < state.min) {
      state.min = elapsed;
    }
    if (elapsed > state.max) {
      state.max = elapsed;
    }
  }
  const memoryUsage = process.memoryUsage().heapUsed;
  if (memoryUsage > maxMemoryUsage) {
    maxMemoryUsage = memoryUsage;
  }

  current = state?.parent ?? null;
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

function reportState(state: TimeState): string {
  if (state.count === 1) return `${state.accum.toFixed(2)}ms`;
  else
    return `${state.accum.toFixed(2)}ms (${state.count} times, avg: ${(
      state.accum / state.count
    ).toFixed(2)}ms, min: ${state.min.toFixed(2)}ms, max: ${state.max.toFixed(
      2
    )}ms)`;
}

function reportStateTree(
  name: string,
  state: TimeState,
  depth: number = 0,
  isLast: boolean = true,
  prefix: string = ""
): string {
  const indent = depth > 0 ? prefix + (isLast ? "└── " : "├── ") : "";
  let report = `${indent}${name}: ${reportState(state)}\n`;
  const children = Array.from(state.children.entries());
  for (let i = 0; i < children.length; i++) {
    const [childName, childState] = children[i];
    const childIsLast = i === children.length - 1;
    const newPrefix = depth === 0 ? "" : prefix + (isLast ? "    " : "│   ");
    report += reportStateTree(
      childName,
      childState,
      depth + 1,
      childIsLast,
      newPrefix
    );
  }
  return report;
}

export async function report() {
  let report = await getSysInfo();
  report += `Max Memory Usage: ${(maxMemoryUsage / 1024 ** 2).toFixed(
    2
  )} MB\n\n`;
  for (const [name, state] of timeMap) {
    report += reportStateTree(name, state);
  }
  writeFileSync(OUTPUT_FILE, report);
  console.log("Benchmark report written to:", OUTPUT_FILE);
}
