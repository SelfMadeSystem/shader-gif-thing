type TimeState = {
  accum: number;
  start: number | null;
  count: number;
};

const timeMap = new Map<string, TimeState>();

export function start(name: string) {
  if (timeMap.has(name)) {
    timeMap.get(name)!.start = performance.now();
  } else {
    timeMap.set(name, { accum: 0, start: performance.now(), count: 0 });
  }
}

export function stop(name: string) {
  const state = timeMap.get(name);
  if (state && state.start !== null) {
    state.accum += performance.now() - state.start;
    state.start = null;
    state.count++;
  }
}

function reportState(state: TimeState): string {
  if (state.count === 1) return `${state.accum.toFixed(2)}ms`;
  else
    return `${state.accum.toFixed(2)}ms (${state.count} times, avg: ${(
      state.accum / state.count
    ).toFixed(2)}ms)`;
}

export function report() {
  for (const [name, state] of timeMap) {
    console.log(`${name}: ${reportState(state)}`);
  }
}
