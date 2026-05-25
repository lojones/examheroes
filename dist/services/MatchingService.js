"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchingService = void 0;
const uuid_1 = require("uuid");
function getServiceTopics(location) {
    const topics = location?.topics;
    return Array.isArray(topics) ? topics.filter((topic) => typeof topic === 'string') : [];
}
class MatchingService {
    constructor(store, heroVerificationService, contentPolicyService) {
        this.store = store;
        this.heroVerificationService = heroVerificationService;
        this.contentPolicyService = contentPolicyService;
    }
    createMatchRun(buyerProfileId, examProgramId, request) {
        if (request.requestDescription && this.contentPolicyService.isLiveExamHelpRequest(request.requestDescription)) {
            throw new Error('Live exam help requests are not allowed');
        }
        const matchRun = {
            id: (0, uuid_1.v4)(),
            buyerProfileId,
            examProgramId,
            requestDescription: request.requestDescription ?? '',
            isLiveExamRequest: Boolean(request.requestDescription && this.contentPolicyService.isLiveExamHelpRequest(request.requestDescription)),
            createdAt: new Date(),
        };
        this.store.matchRuns.set(matchRun.id, matchRun);
        const examProgram = this.store.examPrograms.get(examProgramId);
        if (!examProgram) {
            throw new Error('Exam program not found');
        }
        const learnerProfile = Array.from(this.store.learnerExamProfiles.values()).find((profile) => profile.buyerProfileId === buyerProfileId && profile.examProgramId === examProgramId);
        const candidates = Array.from(this.store.sellerProfiles.values()).map((seller) => {
            const service = Array.from(this.store.services.values()).find((listing) => {
                const category = this.store.categories.get(listing.categoryId);
                return listing.sellerId === seller.id && category?.slug === examProgram.slug;
            });
            const sellerUser = this.store.users.get(seller.userId);
            const availability = Array.from(this.store.availabilitySlots.values()).filter((slot) => slot.sellerId === seller.id && !slot.isBooked);
            const reviews = Array.from(this.store.reviews.values()).filter((review) => review.recipientId === seller.id && review.role === 'BUYER');
            const exclusionReasons = [];
            if (seller.verificationStatus !== 'VERIFIED') {
                exclusionReasons.push('Hero must be verified');
            }
            if (!this.heroVerificationService.isHeroVerifiedForExam(seller.id, examProgramId)) {
                exclusionReasons.push('Hero must have verified expertise');
            }
            if (!sellerUser || !this.heroVerificationService.hasAcceptedPolicy(seller.userId, examProgram.slug)) {
                exclusionReasons.push('Hero must have accepted policy');
            }
            if (!service || !service.isActive) {
                exclusionReasons.push('Active service required');
            }
            if (availability.length === 0) {
                exclusionReasons.push('Availability required');
            }
            if (learnerProfile?.budget !== undefined && service && service.price > learnerProfile.budget) {
                exclusionReasons.push('Price exceeds learner budget');
            }
            const componentScores = {
                topicFitScore: service ? this.calculateTopicFit(getServiceTopics(service.location), request.topics ?? [], service.title, service.description) : 0,
                expertiseScore: this.heroVerificationService.isHeroVerifiedForExam(seller.id, examProgramId) ? 1 : 0,
                availabilityScore: availability.length > 0 ? 1 : 0,
                teachingStyleScore: request.teachingStyle && seller.bio?.toLowerCase().includes(request.teachingStyle.toLowerCase()) ? 1 : 0.7,
                priceScore: learnerProfile?.budget && service
                    ? Math.max(0, Math.min(1, 1 - service.price / Math.max(learnerProfile.budget, 1) + 0.25))
                    : service
                        ? 0.8
                        : 0,
                reviewScore: reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / (reviews.length * 5) : seller.reviewCount ? seller.averageRating / 5 : 0.8,
                certificationScore: Array.from(this.store.scoreVerifications.values()).some((item) => item.sellerProfileId === seller.id && item.examProgramId === examProgramId && item.verificationStatus === 'APPROVED')
                    ? 1
                    : 0.6,
                reliabilityScore: this.calculateReliability(seller.id),
            };
            const totalScore = this.calculateMatchScore(componentScores);
            const candidate = {
                id: (0, uuid_1.v4)(),
                matchRunId: matchRun.id,
                sellerProfileId: seller.id,
                totalScore,
                ...componentScores,
                inclusionReasons: exclusionReasons.length === 0 ? ['Passed hard filters'] : [],
                exclusionReason: exclusionReasons[0],
                createdAt: new Date(),
            };
            this.store.matchCandidates.set(candidate.id, candidate);
            return candidate;
        });
        return { matchRun, candidates };
    }
    getMatchResults(matchRunId) {
        return Array.from(this.store.matchCandidates.values())
            .filter((candidate) => candidate.matchRunId === matchRunId)
            .sort((a, b) => b.totalScore - a.totalScore);
    }
    calculateMatchScore(candidate) {
        const weighted = candidate.topicFitScore * 25 +
            candidate.expertiseScore * 20 +
            candidate.availabilityScore * 15 +
            candidate.teachingStyleScore * 10 +
            candidate.priceScore * 10 +
            candidate.reviewScore * 10 +
            candidate.certificationScore * 5 +
            candidate.reliabilityScore * 5;
        return Number(weighted.toFixed(2));
    }
    calculateTopicFit(serviceTopics, requestedTopics, title, description) {
        if (requestedTopics.length === 0) {
            return 0.8;
        }
        const haystack = `${title ?? ''} ${description ?? ''} ${serviceTopics.join(' ')}`.toLowerCase();
        const matches = requestedTopics.filter((topic) => haystack.includes(topic.toLowerCase()));
        return matches.length / requestedTopics.length;
    }
    calculateReliability(sellerProfileId) {
        const bookings = Array.from(this.store.bookings.values()).filter((booking) => booking.sellerId === sellerProfileId);
        if (bookings.length === 0) {
            return 0.8;
        }
        const completed = bookings.filter((booking) => booking.status === 'COMPLETED').length;
        return completed / bookings.length;
    }
}
exports.MatchingService = MatchingService;
//# sourceMappingURL=MatchingService.js.map