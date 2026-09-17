// CommonJS preload used only by the AI test scripts (see package.json's
// test:ai:* scripts, loaded via NODE_OPTIONS="--require ...").
//
// tsx compiles each .ts file down to CommonJS and loads it through Node's
// normal `require()` pipeline, so the ESM `module.register()` resolve hook
// (see serverOnlyStub.mjs — kept for reference/possible future ESM test
// runner) never sees these requires; only patching the CJS loader does.
// This intercepts the single literal specifier "server-only" — used
// throughout src/lib/ to guarantee those modules can never reach a client
// bundle — and nothing else, so no other package's resolution is affected.
const Module = require("module");

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "server-only") {
    return {};
  }
  return originalLoad.call(this, request, parent, isMain);
};
