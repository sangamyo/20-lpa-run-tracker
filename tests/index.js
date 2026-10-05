// Lets `node --test tests/` work on Node versions that resolve a directory argument as a module.
// (`node --test` with no argument also finds tests/logic.test.mjs on its own.)
import("./logic.test.mjs");
