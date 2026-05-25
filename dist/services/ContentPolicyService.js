"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentPolicyService = void 0;
const IntegrityPolicies_1 = require("../policies/IntegrityPolicies");
class ContentPolicyService {
    constructor() {
        this.liveExamPatterns = [
            /live exam/i,
            /currently taking/i,
            /taking .* right now/i,
            /i(?:'| a)m in the exam/i,
            /answer this for me/i,
            /send me the answer/i,
            /proctored test/i,
            /proxy test/i,
        ];
    }
    scanText(text, examSlug) {
        const normalized = text.toLowerCase();
        const reasons = [];
        const keywords = examSlug ? this.getRestrictedKeywords(examSlug) : Object.values(IntegrityPolicies_1.IntegrityPolicies).flatMap((policy) => policy.restrictedKeywords);
        for (const keyword of keywords) {
            if (normalized.includes(keyword.toLowerCase())) {
                reasons.push(`Matched restricted keyword: ${keyword}`);
            }
        }
        if (this.isLiveExamHelpRequest(text)) {
            reasons.push('Detected live exam help request');
        }
        return {
            flagged: reasons.length > 0,
            reasons,
            severity: reasons.some((reason) => reason.includes('live exam') || reason.includes('secure')) ? 'high' : reasons.length > 1 ? 'medium' : 'low',
        };
    }
    isLiveExamHelpRequest(text) {
        return this.liveExamPatterns.some((pattern) => pattern.test(text));
    }
    validateSourceDeclaration(declaration) {
        return /(original|licensed|public|owned|creative commons|permission)/i.test(declaration);
    }
    getRestrictedKeywords(examSlug) {
        return IntegrityPolicies_1.IntegrityPolicies[examSlug]?.restrictedKeywords ?? [];
    }
}
exports.ContentPolicyService = ContentPolicyService;
//# sourceMappingURL=ContentPolicyService.js.map