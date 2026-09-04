/**
 * RecoverFlow Payment Operations & Transaction Domain Types
 */

export interface PaymentItem {
  paymentId: string;
  customerId: string;
  customerName?: string;
  amount: number;
  currency: string;
  status: "FAILED" | "SUCCESS" | "RECOVERED" | "PENDING" | "PROCESSING" | "CANCELLED" | string;
  failureCode?: string | null;
  failureReason?: string | null;
  provider: string;
  createdAt: string;
  updatedAt?: string;
  caseId?: string | null;
  caseState?: "RECOVERED" | "ACTIVE" | "MANUAL_REVIEW" | "QUEUED" | "FAILED" | string | null;
}

export interface PaymentsSummary {
  totalPayments: number;
  failedPayments: number;
  recoveredPayments: number;
  activeRecoveryPayments: number;
  totalVolumeByCurrency: Record<string, number>;
}

export interface PaymentsListResponse {
  summary: PaymentsSummary;
  payments: PaymentItem[];
  isLive: boolean;
}

export interface PaymentTimelineRecord {
  id: string;
  eventType: string;
  timestamp: string;
  title: string;
  description: string;
  status: "SUCCESS" | "FAILED" | "INFO" | "PENDING";
}

export interface PaymentDetailBundle {
  paymentId: string;
  customerId: string;
  customerName?: string;
  customerSegment?: string;
  amount: number;
  currency: string;
  status: "FAILED" | "SUCCESS" | "RECOVERED" | "PENDING" | "PROCESSING" | "CANCELLED" | string;
  failureCode?: string | null;
  failureReason?: string | null;
  provider: string;
  providerReference?: string;
  createdAt: string;
  updatedAt?: string;
  caseId?: string | null;
  caseState?: "RECOVERED" | "ACTIVE" | "MANUAL_REVIEW" | "QUEUED" | "FAILED" | string | null;
  caseAttemptCount?: number;
  caseMaxAttempts?: number;
  timeline: PaymentTimelineRecord[];
  isLive: boolean;
}
