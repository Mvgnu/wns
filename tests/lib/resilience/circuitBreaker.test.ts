import { describe, expect, it, vi, beforeEach } from 'vitest';
import { withCircuitBreaker, resetCircuitBreaker } from '@/lib/circuitBreaker';

describe('withCircuitBreaker', () => {
  beforeEach(() => {
    resetCircuitBreaker();
  });

  it('returns action result when successful', async () => {
    const action = vi.fn().mockResolvedValue('ok');
    const fallback = vi.fn();

    const result = await withCircuitBreaker('success', action, fallback);

    expect(result).toBe('ok');
    expect(action).toHaveBeenCalledTimes(1);
    expect(fallback).not.toHaveBeenCalled();
  });

  it('uses fallback after reaching failure threshold', async () => {
    const action = vi.fn().mockRejectedValue(new Error('boom'));
    const fallback = vi.fn().mockResolvedValue('fallback');

    const result1 = await withCircuitBreaker('failure', action, fallback, { failureThreshold: 2 });
    const result2 = await withCircuitBreaker('failure', action, fallback, { failureThreshold: 2 });
    const result3 = await withCircuitBreaker('failure', action, fallback, { failureThreshold: 2 });

    expect(result1).toBe('fallback');
    expect(result2).toBe('fallback');
    expect(result3).toBe('fallback');
    expect(fallback).toHaveBeenCalledTimes(3);
  });

  it('resets after timeout', async () => {
    const action = vi.fn().mockRejectedValueOnce(new Error('timeout')).mockResolvedValue('recovered');
    const fallback = vi.fn().mockResolvedValue('fallback');

    const first = await withCircuitBreaker('reset', action, fallback, { failureThreshold: 1, resetTimeoutMs: 10 });
    expect(first).toBe('fallback');

    await new Promise((resolve) => setTimeout(resolve, 20));

    const second = await withCircuitBreaker('reset', action, fallback, { failureThreshold: 1, resetTimeoutMs: 10 });
    expect(second).toBe('recovered');
  });
});
