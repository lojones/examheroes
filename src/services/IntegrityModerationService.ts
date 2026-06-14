import { v4 as uuidv4 } from 'uuid';
import { ContentPolicyService } from './ContentPolicyService';
import { type BookingRequestInput, type MarketMeshStore } from '../types/marketmesh';

export class IntegrityModerationService {
  constructor(private readonly store: MarketMeshStore, private readonly contentPolicyService: ContentPolicyService) {}

  createReport(data: {
    reporterUserId: string;
    reportedUserId?: string;
    bookingId?: string;
    reportType: string;
    description: string;
    evidenceUrls?: string[];
  }) {
    const now = new Date();
    const report = {
      id: uuidv4(),
      reporterUserId: data.reporterUserId,
      reportedUserId: data.reportedUserId,
      bookingId: data.bookingId,
      reportType: data.reportType,
      description: data.description,
      evidenceUrls: data.evidenceUrls ?? [],
      status: 'OPEN' as const,
      createdAt: now,
      updatedAt: now,
    };
    this.store.integrityReports.set(report.id, report);
    return report;
  }

  reviewReport(reportId: string, action: string, moderatorId: string, reason: string) {
    const report = this.store.integrityReports.get(reportId);
    if (!report) {
      throw new Error('Report not found');
    }
    report.status = action === 'dismiss' ? 'DISMISSED' : 'RESOLVED';
    report.updatedAt = new Date();
    this.store.integrityReports.set(report.id, report);
    const moderationAction = {
      id: uuidv4(),
      integrityReportId: reportId,
      moderatorUserId: moderatorId,
      action,
      reason,
      createdAt: new Date(),
    };
    this.store.moderationActions.set(moderationAction.id, moderationAction);
    return { report, moderationAction };
  }

  blockLiveExamHelp(text: string, examSlug: string): { allowed: boolean; reasons: string[] } {
    const scan = this.contentPolicyService.scanText(text, examSlug);
    return {
      allowed: !scan.flagged,
      reasons: scan.reasons,
    };
  }

  canBookingProceed(bookingData: BookingRequestInput): { allowed: boolean; reasons: string[] } {
    const reasons: string[] = [];
    const service = this.store.services.get(bookingData.serviceId);
    const seller = this.store.sellerProfiles.get(bookingData.sellerId);
    const buyer = this.store.buyerProfiles.get(bookingData.buyerId);
    const slot = bookingData.startTime && bookingData.endTime
      ? Array.from(this.store.availabilitySlots.values()).find(
          (item) => item.sellerId === bookingData.sellerId && item.startTime.getTime() === bookingData.startTime!.getTime() && item.endTime.getTime() === bookingData.endTime!.getTime(),
        )
      : undefined;

    if (!service || !seller || !buyer) {
      reasons.push('Booking references missing records');
      return { allowed: false, reasons };
    }

    if (!service.isActive) {
      reasons.push('Service is inactive');
    }

    if (seller.verificationStatus !== 'VERIFIED') {
      reasons.push('Hero is not verified');
    }

    const category = this.store.categories.get(bookingData.categoryId || service.categoryId);
    const examProgram = Array.from(this.store.examPrograms.values()).find((item) => item.slug === category?.slug);
    if (!examProgram) {
      reasons.push('Exam program not found');
    } else {
      const expertise = Array.from(this.store.heroExamExpertise.values()).find(
        (item) => item.sellerProfileId === seller.id && item.examProgramId === examProgram.id && item.verificationStatus === 'VERIFIED',
      );
      if (!expertise) {
        reasons.push('Hero lacks verified expertise for the exam');
      }

      const currentPolicy = Array.from(this.store.integrityPolicies.values())
        .filter((policy) => policy.examProgramId === examProgram.id)
        .sort((a, b) => b.effectiveAt.getTime() - a.effectiveAt.getTime())[0];
      if (currentPolicy) {
        const attestation = Array.from(this.store.integrityAttestations.values()).find(
          (item) => item.userId === buyer.userId && item.integrityPolicyId === currentPolicy.id,
        );
        if (!attestation) {
          reasons.push('Learner has not attested to the current integrity policy');
        }
      }
    }

    if (slot?.isBooked) {
      reasons.push('Availability slot already booked');
    }

    const requestDescription = typeof bookingData.requestDetails?.requestDescription === 'string' ? bookingData.requestDetails.requestDescription : undefined;
    if (requestDescription) {
      const scan = this.contentPolicyService.scanText(requestDescription, category?.slug);
      if (scan.flagged) {
        reasons.push(...scan.reasons);
      }
    }

    if (bookingData.contentUploadIds?.length) {
      const blockedUpload = bookingData.contentUploadIds
        .map((id) => this.store.contentUploads.get(id))
        .find((upload) => !upload || upload.status !== 'APPROVED');
      if (blockedUpload) {
        reasons.push('All uploads must be approved before booking');
      }
    }

    if (bookingData.packagePurchaseId) {
      const purchase = this.store.packagePurchases.get(bookingData.packagePurchaseId);
      if (!purchase) {
        reasons.push('Package purchase not found');
      } else if (purchase.status !== 'ACTIVE' || purchase.usedSessions >= purchase.totalSessions || purchase.expiresAt.getTime() < Date.now()) {
        reasons.push('Package credits are not available');
      }
    }

    return { allowed: reasons.length === 0, reasons };
  }
}
