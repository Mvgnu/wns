/**
 * This is an empty module implementation to provide fallbacks for Node.js specific
 * modules like async_hooks when used in browser environments.
 */

// Mock AsyncLocalStorage as a no-op implementation
class MockAsyncLocalStorage {
  constructor() {}
  
  // Mock methods that do nothing
  disable() { return this; }
  enable() { return this; }
  enterWith() {}
  getStore() { return null; }
  run(store, callback, ...args) { return callback(...args); }
}

// Export a mock implementation of async_hooks
module.exports = {
  // Async hooks primitives (mock implementations)
  createHook: () => ({
    enable: () => {},
    disable: () => {}
  }),
  executionAsyncId: () => 0,
  triggerAsyncId: () => 0,
  
  // AsyncLocalStorage mock
  AsyncLocalStorage: MockAsyncLocalStorage
}; 