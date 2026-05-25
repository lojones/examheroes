"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeJobs = initializeJobs;
function initializeJobs(store) {
    return {
        status: 'ready',
        pendingDiagnostics: store.diagnosticAttempts.size,
    };
}
//# sourceMappingURL=index.js.map