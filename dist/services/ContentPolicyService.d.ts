export declare class ContentPolicyService {
    private readonly liveExamPatterns;
    scanText(text: string, examSlug?: string): {
        flagged: boolean;
        reasons: string[];
        severity: 'low' | 'medium' | 'high';
    };
    isLiveExamHelpRequest(text: string): boolean;
    validateSourceDeclaration(declaration: string): boolean;
    getRestrictedKeywords(examSlug: string): string[];
}
//# sourceMappingURL=ContentPolicyService.d.ts.map