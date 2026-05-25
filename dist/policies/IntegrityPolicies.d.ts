export interface IntegrityPolicyDefinition {
    examSlug: string;
    version: string;
    prohibitsLiveExamHelp: boolean;
    prohibitsBrainDumps: boolean;
    prohibitsSecureContent: boolean;
    prohibitsProctoringBypass: boolean;
    prohibitsProxyTesting: boolean;
    allowedMaterials: string[];
    restrictedKeywords: string[];
    fullPolicyText: string;
}
export declare const IntegrityPolicies: Record<string, IntegrityPolicyDefinition>;
//# sourceMappingURL=IntegrityPolicies.d.ts.map