/**
 * Jest global setup — runs before every test file.
 *
 * Sets IS_REACT_ACT_ENVIRONMENT so React 18's act() works correctly inside
 * jsdom and does not emit "not configured to support act()" warnings.
 */

// Tell React 18 we are inside a test environment that supports act().
// Without this, createRoot().render() inside act() emits a noisy warning.
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
