// meta: module=resilience.circuitBreaker purpose="Lightweight circuit breaker for critical services"

type CircuitBreakerOptions = {
  readonly failureThreshold?: number;
  readonly resetTimeoutMs?: number;
  readonly timeoutMs?: number;
};

type CircuitState = {
  failures: number;
  openedAt: number | null;
};

const states = new Map<string, CircuitState>();

const DEFAULT_OPTIONS: Required<CircuitBreakerOptions> = {
  failureThreshold: 3,
  resetTimeoutMs: 30_000,
  timeoutMs: 4_000
};

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  if (timeoutMs <= 0) {
    return promise;
  }

  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Circuit breaker timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timeout);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

function getState(name: string): CircuitState {
  if (!states.has(name)) {
    states.set(name, { failures: 0, openedAt: null });
  }
  return states.get(name)!;
}

function shouldAllowExecution(state: CircuitState, options: Required<CircuitBreakerOptions>) {
  if (state.openedAt === null) {
    return true;
  }

  const now = Date.now();
  if (now - state.openedAt >= options.resetTimeoutMs) {
    // Half-open: allow a probe execution and reset the timer
    state.openedAt = null;
    state.failures = 0;
    return true;
  }

  return false;
}

function recordSuccess(state: CircuitState) {
  state.failures = 0;
  state.openedAt = null;
}

function recordFailure(state: CircuitState, options: Required<CircuitBreakerOptions>) {
  state.failures += 1;
  if (state.failures >= options.failureThreshold) {
    state.openedAt = Date.now();
  }
}

export async function withCircuitBreaker<T>(
  name: string,
  action: () => Promise<T>,
  fallback: () => Promise<T> | T,
  rawOptions: CircuitBreakerOptions = {}
): Promise<T> {
  const options = { ...DEFAULT_OPTIONS, ...rawOptions } as Required<CircuitBreakerOptions>;
  const state = getState(name);

  if (!shouldAllowExecution(state, options)) {
    return await fallback();
  }

  try {
    const result = await withTimeout(action(), options.timeoutMs);
    recordSuccess(state);
    return result;
  } catch (error) {
    recordFailure(state, options);
    console.warn(`[CircuitBreaker:${name}]`, error instanceof Error ? error.message : error);
    return await fallback();
  }
}

export function resetCircuitBreaker(name?: string) {
  if (name) {
    states.delete(name);
    return;
  }
  states.clear();
}

