import { BRAND_NAVY, BRAND_RED, GOLD, GREEN, GREY_BLUE, PERIWINKLE, SUBMITTED_BLUE, WHITE } from '../theme';

// ---- Status (wksp_requisition.wksp_status) ----

// `color` drives chart bars/dots (a muted grey reads better than pink against a track); `pillBg`/
// `pillFg`/`pillOutline` override the STATUS PILL specifically for Draft, matching the wireframe's
// own DRAFT badge exactly — light pink fill, red border and text — rather than the neutral grey
// every other status pill uses.
export const STATUS_META: { value: number; label: string; color: string; pillBg?: string; pillFg?: string; pillOutline?: boolean }[] = [
  { value: 100000000, label: 'Draft', color: GREY_BLUE, pillBg: '#FFF4F5', pillFg: BRAND_RED, pillOutline: true },
  { value: 100000001, label: 'Submitted', color: SUBMITTED_BLUE },
  { value: 100000002, label: 'In Approval', color: GOLD },
  { value: 100000003, label: 'Approved', color: BRAND_NAVY },
  { value: 100000004, label: 'Rejected', color: BRAND_RED },
  { value: 100000005, label: 'Ordered', color: PERIWINKLE },
  { value: 100000006, label: 'Received', color: GREEN },
];

export function getStatusMeta(value: number | undefined) {
  return (
    STATUS_META.find((m) => m.value === value) ?? {
      value: value ?? -1,
      label: 'Unknown',
      color: GREY_BLUE,
    }
  );
}

export function getStatusPillStyle(value: number | undefined): { bg: string; fg: string; outline: boolean } {
  const meta = getStatusMeta(value);
  return meta.pillOutline
    ? { bg: meta.pillBg ?? meta.color, fg: meta.pillFg ?? WHITE, outline: true }
    : { bg: meta.color, fg: WHITE, outline: false };
}

export const PENDING_STATUS_VALUES = [100000001, 100000002]; // Submitted, In Approval
export const CLOSED_STATUS_VALUES = [100000004, 100000006]; // Rejected, Received

// ---- Value tier (wksp_requisition.wksp_valuetier) ----

export const VALUETIER_META: { value: number; label: string; color: string; approver: string }[] = [
  { value: 100000000, label: 'Under 1,000 AED', color: GREY_BLUE, approver: 'Supervisor' },
  { value: 100000001, label: '1,000-10,000 AED', color: BRAND_NAVY, approver: 'Manager' },
  { value: 100000002, label: 'Above 10,000 AED', color: BRAND_RED, approver: 'Mgr → Finance' },
];

export function getValueTierMeta(value: number | undefined) {
  return (
    VALUETIER_META.find((m) => m.value === value) ?? {
      value: value ?? -1,
      label: 'Unknown',
      color: GREY_BLUE,
      approver: '—',
    }
  );
}

// ---- Risk level (wksp_requisition.wksp_risklevel) ----

export const RISK_LEVEL_META: { value: number; label: string; color: string }[] = [
  { value: 100000000, label: 'Low', color: GREEN },
  { value: 100000001, label: 'Medium', color: GOLD },
  { value: 100000002, label: 'High', color: BRAND_RED },
];

export function getRiskLevelMeta(value: number | undefined) {
  return (
    RISK_LEVEL_META.find((m) => m.value === value) ?? {
      value: value ?? -1,
      label: 'Unscored',
      color: GREY_BLUE,
    }
  );
}

// ---- Approval history level/action (wksp_approvalhistory) ----

export const APPROVAL_LEVEL_META: { value: number; label: string }[] = [
  { value: 100000000, label: 'Supervisor' },
  { value: 100000001, label: 'Manager' },
  { value: 100000002, label: 'Finance' },
];

export function getApprovalLevelLabel(value: number | undefined) {
  return APPROVAL_LEVEL_META.find((m) => m.value === value)?.label ?? '—';
}

export const APPROVAL_ACTION_META: { value: number; label: string }[] = [
  { value: 100000000, label: 'Approved' },
  { value: 100000001, label: 'Rejected' },
];

export function getApprovalActionLabel(value: number | undefined) {
  return APPROVAL_ACTION_META.find((m) => m.value === value)?.label ?? '—';
}

// ---- Priority (wksp_requisition.wksp_priority) ----

export const PRIORITY_META: { value: number; label: string; color: string }[] = [
  { value: 100000000, label: 'Urgent', color: BRAND_RED },
  { value: 100000001, label: 'Normal', color: GREY_BLUE },
  { value: 100000002, label: 'Low', color: GREY_BLUE },
];

export function getPriorityMeta(value: number | undefined) {
  return (
    PRIORITY_META.find((m) => m.value === value) ?? { value: value ?? -1, label: '—', color: GREY_BLUE }
  );
}

// ---- Payment terms (wksp_requisition.wksp_paymentterms) ----

export const PAYMENT_TERMS_META: { value: number; label: string }[] = [
  { value: 100000000, label: '30 Days Credit' },
  { value: 100000001, label: '60 Days Credit' },
  { value: 100000002, label: 'Cash' },
];

export function getPaymentTermsLabel(value: number | undefined) {
  return PAYMENT_TERMS_META.find((m) => m.value === value)?.label ?? '—';
}

// ---- Repair order type (wksp_requisition.wksp_repairordertype) ----

export const REPAIR_ORDER_TYPE_META: { value: number; label: string }[] = [
  { value: 100000000, label: 'Customer Pay' },
  { value: 100000001, label: 'Warranty' },
  { value: 100000002, label: 'Internal' },
];

export function getRepairOrderTypeLabel(value: number | undefined) {
  return REPAIR_ORDER_TYPE_META.find((m) => m.value === value)?.label ?? '—';
}

// ---- Line item category (wksp_requisitionlineitem.wksp_category) ----

export const CATEGORY_META: { value: number; label: string; bg: string; fg: string }[] = [
  { value: 100000000, label: 'Part', bg: '#E6E7EF', fg: BRAND_NAVY },
  { value: 100000001, label: 'Tool', bg: '#E6E7EF', fg: BRAND_NAVY },
  { value: 100000002, label: 'Sublet', bg: '#FFE8E8', fg: '#B8233A' },
  { value: 100000003, label: 'Consumable', bg: '#E6E7EF', fg: BRAND_NAVY },
  { value: 100000004, label: 'Other', bg: '#F3F4F6', fg: '#757575' },
];

export function getCategoryMeta(value: number | undefined) {
  return (
    CATEGORY_META.find((m) => m.value === value) ?? { value: value ?? -1, label: '—', bg: '#F3F4F6', fg: '#757575' }
  );
}

// ---- Supplier contract status (wksp_supplier.wksp_contractstatus) ----

export const CONTRACT_STATUS_META: { value: number; label: string; bg: string; fg: string }[] = [
  { value: 100000000, label: 'On-Contract', bg: '#F3FCF5', fg: '#1F9D45' },
  { value: 100000001, label: 'Off-Contract', bg: '#FFF7E6', fg: '#8A6100' },
];

export function getContractStatusMeta(value: number | undefined) {
  return (
    CONTRACT_STATUS_META.find((m) => m.value === value) ?? { value: value ?? -1, label: '—', bg: '#F3F4F6', fg: '#757575' }
  );
}

// ---- 6-stage tracker (Draft, Submitted, In Approval, Approved, Ordered, Received) ----
// Rejected is a terminal branch off the tracker, not a tracker stage itself.

export const STAGE_LABELS = ['Draft', 'Submitted', 'In Approval', 'Approved', 'Ordered', 'Received'];

const STATUS_TO_STAGE_INDEX: Record<number, number> = {
  100000000: 0, // Draft
  100000001: 1, // Submitted
  100000002: 2, // In Approval
  100000003: 3, // Approved
  100000005: 4, // Ordered
  100000006: 5, // Received
};

export function getStageIndex(status: number | undefined): number {
  if (status === 100000004) return 2; // Rejected — freeze the tracker at "In Approval"
  return STATUS_TO_STAGE_INDEX[status ?? -1] ?? 0;
}

// ---- Formatting helpers ----

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'AED',
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export function formatCurrency(value: number | undefined | null): string {
  return typeof value === 'number' && Number.isFinite(value) ? currencyFormatter.format(value) : '—';
}

export function formatDate(value: string | Date | undefined | null): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}

export function formatDateTime(value: string | Date | undefined | null): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date);
}
