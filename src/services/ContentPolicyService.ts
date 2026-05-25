import { IntegrityPolicies } from '../policies/IntegrityPolicies';

export class ContentPolicyService {
  private readonly liveExamPatterns = [
    /live exam/i,
    /currently taking/i,
    /taking .* right now/i,
    /i(?:'| a)m in the exam/i,
    /answer this for me/i,
    /send me the answer/i,
    /proctored test/i,
    /proxy test/i,
  ];

  scanText(text: string, examSlug?: string): { flagged: boolean; reasons: string[]; severity: 'low' | 'medium' | 'high' } {
    const normalized = text.toLowerCase();
    const reasons: string[] = [];
    const keywords = examSlug ? this.getRestrictedKeywords(examSlug) : Object.values(IntegrityPolicies).flatMap((policy) => policy.restrictedKeywords);

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

  isLiveExamHelpRequest(text: string): boolean {
    return this.liveExamPatterns.some((pattern) => pattern.test(text));
  }

  validateSourceDeclaration(declaration: string): boolean {
    return /(original|licensed|public|owned|creative commons|permission)/i.test(declaration);
  }

  getRestrictedKeywords(examSlug: string): string[] {
    return IntegrityPolicies[examSlug]?.restrictedKeywords ?? [];
  }
}
