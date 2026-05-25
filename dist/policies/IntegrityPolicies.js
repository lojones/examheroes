"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrityPolicies = void 0;
function createPolicy(examSlug, restrictedKeywords) {
    return {
        examSlug,
        version: '2025.1',
        prohibitsLiveExamHelp: true,
        prohibitsBrainDumps: true,
        prohibitsSecureContent: true,
        prohibitsProctoringBypass: true,
        prohibitsProxyTesting: true,
        allowedMaterials: ['original-notes', 'licensed-practice', 'public-domain-content'],
        restrictedKeywords,
        fullPolicyText: `${examSlug.toUpperCase()} tutoring on Exam Heroes prohibits live exam assistance, secure-content sharing, brain dumps, proxy testing, and proctoring bypass support.`,
    };
}
exports.IntegrityPolicies = {
    lsat: createPolicy('lsat', ['brain dump', 'recent lsat questions', 'secure test form', 'live proctor']),
    mcat: createPolicy('mcat', ['aamc confidential', 'secure passage', 'live mcat', 'test center question']),
    gre: createPolicy('gre', ['ets secure content', 'live gre', 'current gre answer']),
    gmat: createPolicy('gmat', ['gmac secure question', 'live gmat', 'test center prompt']),
    sat: createPolicy('sat', ['college board secure', 'live sat', 'answer key leak']),
    act: createPolicy('act', ['act secure booklet', 'live act', 'test booklet photo']),
    'bar-exam': createPolicy('bar-exam', ['secure mbe item', 'live bar exam', 'essay prompt leak']),
    cpa: createPolicy('cpa', ['secure cpa item', 'live cpa', 'prometric answer']),
    cfa: createPolicy('cfa', ['cfa institute secure', 'live cfa', 'question recall']),
    nclex: createPolicy('nclex', ['nclex secure item', 'live nclex', 'pearson vue answer']),
    'aws-certification': createPolicy('aws-certification', ['nda exam question', 'live aws exam', 'question bank dump']),
    comptia: createPolicy('comptia', ['braindump', 'live comptia', 'secure question bank']),
};
//# sourceMappingURL=IntegrityPolicies.js.map