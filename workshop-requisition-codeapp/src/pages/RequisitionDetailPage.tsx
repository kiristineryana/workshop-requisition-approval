import { useEffect, useMemo, useState } from 'react';
import { Wksp_requisitionsService } from '../generated/services/Wksp_requisitionsService';
import { Wksp_requisitionlineitemsService } from '../generated/services/Wksp_requisitionlineitemsService';
import { Wksp_approvalhistoriesService } from '../generated/services/Wksp_approvalhistoriesService';
import { Wksp_suppliersService } from '../generated/services/Wksp_suppliersService';
import { Wksp_costcentresService } from '../generated/services/Wksp_costcentresService';
import type { Wksp_requisitions, Wksp_requisitionsBase } from '../generated/models/Wksp_requisitionsModel';
import type { Wksp_requisitionlineitems } from '../generated/models/Wksp_requisitionlineitemsModel';
import type { Wksp_approvalhistories } from '../generated/models/Wksp_approvalhistoriesModel';
import type { Wksp_suppliers } from '../generated/models/Wksp_suppliersModel';
import type { Wksp_costcentres } from '../generated/models/Wksp_costcentresModel';
import { BRAND_NAVY, BRAND_RED, GOLD, GREEN, STAGE_BLUE, SURFACE_MUTED, TEXT_MUTED, TEXT_PRIMARY, BORDER, WHITE, FONT_DISPLAY } from '../theme';
import {
  getStatusMeta,
  getStatusPillStyle,
  getValueTierMeta,
  getRiskLevelMeta,
  getCategoryMeta,
  getApprovalActionLabel,
  getApprovalLevelLabel,
  PRIORITY_META,
  PAYMENT_TERMS_META,
  REPAIR_ORDER_TYPE_META,
  CATEGORY_META,
  getPaymentTermsLabel,
  getRepairOrderTypeLabel,
  getPriorityMeta,
  formatCurrency,
  formatDate,
} from '../lib/choiceMeta';
import { Pill } from '../components/Pill';
import { StageTracker } from '../components/StageTracker';
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  AlertTriangleIcon,
  CategoryPartIcon,
  CategoryToolIcon,
  CategorySubletIcon,
  CategoryConsumableIcon,
  CategoryOtherIcon,
} from '../components/icons';

// Icon per line-item category — indexed to match CATEGORY_META's order (Part, Tool, Sublet,
// Consumable, Other) in lib/choiceMeta.ts.
const CATEGORY_ICONS: Record<number, (props: { size?: number; color?: string }) => React.ReactElement> = {
  100000000: CategoryPartIcon,
  100000001: CategoryToolIcon,
  100000002: CategorySubletIcon,
  100000003: CategoryConsumableIcon,
  100000004: CategoryOtherIcon,
};
import { useUserDirectory } from '../lib/users';

const JUSTIFICATION_THRESHOLD = 10000;
const JOB_CARD_PATTERN = /^JC-[A-Za-z0-9]+(-[A-Za-z0-9]+)*$/;
const JOB_CARD_HINT = "Must start with 'JC-', e.g. JC-2026-04213";

type FormState = {
  branchworkshop: string;
  costCentreId: string;
  jobcardnumber: string;
  repairordertype: number | '';
  customername: string;
  vehiclemodelyear: string;
  regnovin: string;
  odometerkm: string;
  vehicleoffroad: boolean;
  requiredby: string;
  supplierId: string;
  quotesattached: string;
  paymentterms: number | '';
  priority: number | '';
  justification: string;
};

function toFormState(r: Wksp_requisitions): FormState {
  return {
    branchworkshop: r.wksp_branchworkshop ?? '',
    costCentreId: r._wksp_costcentreid_value ?? '',
    jobcardnumber: r.wksp_jobcardnumber ?? '',
    repairordertype: (r.wksp_repairordertype as unknown as number) ?? '',
    customername: r.wksp_customername ?? '',
    vehiclemodelyear: r.wksp_vehiclemodelyear ?? '',
    regnovin: r.wksp_regnovin ?? '',
    odometerkm: r.wksp_odometerkm !== undefined && r.wksp_odometerkm !== null ? String(r.wksp_odometerkm) : '',
    vehicleoffroad: r.wksp_vehicleoffroad ?? false,
    requiredby: r.wksp_requiredby ? r.wksp_requiredby.slice(0, 10) : '',
    supplierId: r._wksp_supplierid_value ?? '',
    quotesattached: r.wksp_quotesattached !== undefined && r.wksp_quotesattached !== null ? String(r.wksp_quotesattached) : '',
    paymentterms: (r.wksp_paymentterms as unknown as number) ?? '',
    priority: (r.wksp_priority as unknown as number) ?? '',
    justification: r.wksp_justification ?? '',
  };
}

const fieldLabel: React.CSSProperties = { fontSize: 11, color: TEXT_MUTED, marginBottom: 6 };
const inputStyle: React.CSSProperties = {
  height: 34,
  border: `1px solid ${BORDER}`,
  borderRadius: 6,
  padding: '0 10px',
  fontSize: 12.5,
  color: TEXT_PRIMARY,
  width: '100%',
  boxSizing: 'border-box',
  background: WHITE,
};
const readOnlyStyle: React.CSSProperties = {
  ...inputStyle,
  background: SURFACE_MUTED,
  display: 'flex',
  alignItems: 'center',
  color: TEXT_PRIMARY,
};
const sectionTitle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.04em',
  color: BRAND_NAVY,
  textTransform: 'uppercase',
  paddingBottom: 10,
  borderBottom: `1px solid ${BORDER}`,
  marginTop: 22,
};
const gridForm: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '14px 18px',
  padding: '16px 0 6px',
};
const sidebarCard: React.CSSProperties = {
  border: `1px solid ${BORDER}`,
  borderRadius: 8,
  padding: 14,
  background: WHITE,
};

export function RequisitionDetailPage({
  requisitionId,
  onBack,
  onNavigate,
}: {
  requisitionId: string;
  onBack: () => void;
  onNavigate: (id: string) => void;
}) {
  const [req, setReq] = useState<Wksp_requisitions | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [lineItems, setLineItems] = useState<Wksp_requisitionlineitems[]>([]);
  const [history, setHistory] = useState<Wksp_approvalhistories[]>([]);
  const [costCentre, setCostCentre] = useState<Wksp_costcentres | null>(null);
  const [duplicateOf, setDuplicateOf] = useState<Wksp_requisitions | null>(null);
  const [suppliers, setSuppliers] = useState<Wksp_suppliers[]>([]);
  const [costCentres, setCostCentres] = useState<Wksp_costcentres[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [banner, setBanner] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const { nameById } = useUserDirectory();

  const load = () => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      Wksp_requisitionsService.get(requisitionId),
      Wksp_requisitionlineitemsService.getAll({
        filter: `_wksp_parentrequisitionid_value eq ${requisitionId}`,
        maxPageSize: 200,
      }),
      Wksp_approvalhistoriesService.getAll({
        filter: `_wksp_requisitionid_value eq ${requisitionId}`,
        orderBy: ['wksp_decisiondate asc'],
        maxPageSize: 50,
      }),
      Wksp_suppliersService.getAll({ select: ['wksp_supplierid', 'wksp_suppliername', 'wksp_contractstatus'], maxPageSize: 500 }),
      Wksp_costcentresService.getAll({
        select: ['wksp_costcentreid', 'wksp_name', 'wksp_monthlybudget', 'wksp_committedamount'],
        maxPageSize: 500,
      }),
    ]).then(async ([reqResult, lineResult, historyResult, supplierResult, ccResult]) => {
      if (cancelled) return;
      if (!reqResult.success || !reqResult.data) {
        setError(reqResult.error?.message ?? 'Unable to load this requisition.');
        setLoading(false);
        return;
      }
      const r = reqResult.data;
      setReq(r);
      setForm(toFormState(r));
      setLineItems(lineResult.success ? lineResult.data ?? [] : []);
      setHistory(historyResult.success ? historyResult.data ?? [] : []);
      setSuppliers(supplierResult.success ? supplierResult.data ?? [] : []);
      setCostCentres(ccResult.success ? ccResult.data ?? [] : []);

      if (r._wksp_costcentreid_value) {
        const cc = await Wksp_costcentresService.get(r._wksp_costcentreid_value);
        if (!cancelled && cc.success) setCostCentre(cc.data ?? null);
      } else {
        setCostCentre(null);
      }
      if (r._wksp_duplicateofid_value) {
        const dup = await Wksp_requisitionsService.get(r._wksp_duplicateofid_value, {
          select: ['wksp_requisitionid', 'wksp_requisitionnumber', 'wksp_status'],
        });
        if (!cancelled && dup.success) setDuplicateOf(dup.data ?? null);
      } else {
        setDuplicateOf(null);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  };

  useEffect(() => {
    setBanner(null);
    return load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requisitionId]);

  const status = req?.wksp_status as unknown as number | undefined;
  const isDraft = status === 100000000;

  const subtotal = useMemo(
    () => lineItems.reduce((sum, li) => sum + (li.wksp_linetotal ?? li.wksp_quantity * li.wksp_unitprice), 0),
    [lineItems],
  );
  const displayTotal = isDraft ? subtotal : req?.wksp_totalvalue ?? 0;
  const justificationRequired = displayTotal >= JUSTIFICATION_THRESHOLD;
  const jobCardInvalid = !!form && form.jobcardnumber.trim() !== '' && !JOB_CARD_PATTERN.test(form.jobcardnumber.trim());

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: TEXT_MUTED }}>Loading requisition…</div>;
  }
  if (error || !req || !form) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <BackButton onBack={onBack} />
        <div style={{ background: '#FFF4F5', color: BRAND_RED, padding: 14, borderRadius: 8, fontSize: 13 }}>
          {error ?? 'Requisition not found.'}
        </div>
      </div>
    );
  }

  const statusMeta = getStatusMeta(status);
  const statusPillStyle = getStatusPillStyle(status);
  const tierMeta = getValueTierMeta(req.wksp_valuetier as unknown as number);
  const riskMeta = getRiskLevelMeta(req.wksp_risklevel as unknown as number);
  const requesterName = (req._wksp_requesterid_value && nameById.get(req._wksp_requesterid_value)) ?? '—';
  const currentApproverName = (req._wksp_currentapproverid_value && nameById.get(req._wksp_currentapproverid_value)) ?? '—';
  const supplierName = suppliers.find((s) => s.wksp_supplierid === req._wksp_supplierid_value)?.wksp_suppliername ?? '—';

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function computeFormChanges(): Partial<Omit<Wksp_requisitionsBase, 'wksp_requisitionid'>> {
    const changes: Partial<Omit<Wksp_requisitionsBase, 'wksp_requisitionid'>> = {};
    if (!form || !req) return changes;
    const initial = toFormState(req);
    if (form.branchworkshop !== initial.branchworkshop) changes.wksp_branchworkshop = form.branchworkshop;
    if (form.jobcardnumber !== initial.jobcardnumber) changes.wksp_jobcardnumber = form.jobcardnumber;
    if (form.customername !== initial.customername) changes.wksp_customername = form.customername;
    if (form.vehiclemodelyear !== initial.vehiclemodelyear) changes.wksp_vehiclemodelyear = form.vehiclemodelyear;
    if (form.regnovin !== initial.regnovin) changes.wksp_regnovin = form.regnovin;
    if (form.vehicleoffroad !== initial.vehicleoffroad) changes.wksp_vehicleoffroad = form.vehicleoffroad;
    if (form.justification !== initial.justification) changes.wksp_justification = form.justification;
    if (form.odometerkm !== initial.odometerkm) changes.wksp_odometerkm = form.odometerkm ? Number(form.odometerkm) : undefined;
    if (form.quotesattached !== initial.quotesattached) changes.wksp_quotesattached = form.quotesattached ? Number(form.quotesattached) : undefined;
    if (form.requiredby !== initial.requiredby) changes.wksp_requiredby = form.requiredby ? new Date(form.requiredby).toISOString() : undefined;
    if (form.repairordertype !== initial.repairordertype)
      changes.wksp_repairordertype = form.repairordertype === '' ? undefined : (form.repairordertype as never);
    if (form.paymentterms !== initial.paymentterms)
      changes.wksp_paymentterms = form.paymentterms === '' ? undefined : (form.paymentterms as never);
    if (form.priority !== initial.priority) changes.wksp_priority = form.priority === '' ? undefined : (form.priority as never);
    if (form.costCentreId !== initial.costCentreId && form.costCentreId) {
      changes['wksp_CostCentreId@odata.bind'] = `/wksp_costcentres(${form.costCentreId})`;
    }
    if (form.supplierId !== initial.supplierId && form.supplierId) {
      changes['wksp_SupplierId@odata.bind'] = `/wksp_suppliers(${form.supplierId})`;
    }
    return changes;
  }

  async function handleSave() {
    if (!form || !req) return;
    setSaving(true);
    setBanner(null);
    const changes = computeFormChanges();

    if (Object.keys(changes).length === 0) {
      setSaving(false);
      setBanner({ kind: 'success', text: 'No changes to save.' });
      return;
    }

    const result = await Wksp_requisitionsService.update(requisitionId, changes);
    setSaving(false);
    if (result.success) {
      setBanner({ kind: 'success', text: 'Saved.' });
      load();
    } else {
      setBanner({ kind: 'error', text: result.error?.message ?? 'Save failed.' });
    }
  }

  async function handleSubmitForApproval() {
    if (!form) return;
    const missing: string[] = [];
    if (!form.branchworkshop) missing.push('Branch / Workshop');
    if (!form.costCentreId) missing.push('Cost centre');
    if (!form.jobcardnumber) missing.push('Job card number');
    if (!form.requiredby) missing.push('Required by');
    if (!form.supplierId) missing.push('Supplier');
    if (form.jobcardnumber.trim() && !JOB_CARD_PATTERN.test(form.jobcardnumber.trim())) missing.push(`Job card number (${JOB_CARD_HINT})`);
    if (lineItems.length === 0) missing.push('At least one line item');
    if (justificationRequired && !form.justification.trim()) missing.push('Justification');

    if (missing.length > 0) {
      setBanner({ kind: 'error', text: `Complete required fields before submitting: ${missing.join(', ')}.` });
      return;
    }

    setSubmitting(true);
    setBanner(null);
    const result = await Wksp_requisitionsService.update(requisitionId, {
      ...computeFormChanges(),
      wksp_status: 100000001 as never,
      wksp_datesubmitted: new Date().toISOString(),
    });
    setSubmitting(false);
    if (result.success) {
      setBanner({ kind: 'success', text: 'Submitted for approval.' });
      load();
    } else {
      setBanner({ kind: 'error', text: result.error?.message ?? 'Submit failed.' });
    }
  }

  async function handleMarkOrdered() {
    setUpdatingStatus(true);
    setBanner(null);
    const result = await Wksp_requisitionsService.update(requisitionId, { wksp_status: 100000005 as never });
    setUpdatingStatus(false);
    if (result.success) {
      setBanner({ kind: 'success', text: 'Marked as Ordered.' });
      load();
    } else {
      setBanner({ kind: 'error', text: result.error?.message ?? 'Could not update status.' });
    }
  }

  async function handleMarkReceived() {
    setUpdatingStatus(true);
    setBanner(null);
    const result = await Wksp_requisitionsService.update(requisitionId, { wksp_status: 100000006 as never });
    setUpdatingStatus(false);
    if (result.success) {
      setBanner({ kind: 'success', text: 'Marked as Received.' });
      load();
    } else {
      setBanner({ kind: 'error', text: result.error?.message ?? 'Could not update status.' });
    }
  }

  async function refreshLineItems() {
    const lineResult = await Wksp_requisitionlineitemsService.getAll({
      filter: `_wksp_parentrequisitionid_value eq ${requisitionId}`,
      maxPageSize: 200,
    });
    if (lineResult.success) setLineItems(lineResult.data ?? []);
  }

  async function handleAddLine() {
    const result = await Wksp_requisitionlineitemsService.create({
      statecode: 0 as never,
      wksp_itemdescription: 'New line item',
      wksp_category: 100000000 as never,
      wksp_quantity: 1,
      wksp_unitprice: 0,
      'wksp_ParentRequisitionId@odata.bind': `/wksp_requisitions(${requisitionId})`,
    });
    if (result.success) {
      await refreshLineItems();
    } else {
      setBanner({ kind: 'error', text: result.error?.message ?? 'Could not add line item.' });
    }
  }

  async function handleUpdateLine(id: string, changes: Partial<Wksp_requisitionlineitems>) {
    const result = await Wksp_requisitionlineitemsService.update(id, changes);
    if (result.success) {
      await refreshLineItems();
    } else {
      setBanner({ kind: 'error', text: result.error?.message ?? 'Could not update line item.' });
    }
  }

  async function handleDeleteLine(id: string) {
    await Wksp_requisitionlineitemsService.delete(id);
    await refreshLineItems();
  }

  const budget = costCentre?.wksp_monthlybudget ?? 0;
  const committed = costCentre?.wksp_committedamount ?? 0;
  const hasBudget = budget > 0;
  const committedPct = hasBudget ? Math.round((committed / budget) * 100) : null;
  const deltaPct = hasBudget ? Math.round((displayTotal / budget) * 100) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <BackButton onBack={onBack} />

      {banner && (
        <div
          style={{
            background: banner.kind === 'error' ? '#FFF4F5' : '#F3FCF5',
            color: banner.kind === 'error' ? BRAND_RED : '#1F9D45',
            padding: 12,
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {banner.text}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11.5, color: TEXT_MUTED, marginBottom: 6 }}>Requisition</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: BRAND_NAVY }}>{req.wksp_requisitionnumber}</div>
            <Pill label={statusMeta.label.toUpperCase()} {...statusPillStyle} />
            <Pill label={`${tierMeta.label} · ${tierMeta.approver}`} bg={SURFACE_MUTED} fg={TEXT_MUTED} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 30, textAlign: 'right', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 10.5, color: TEXT_MUTED, marginBottom: 6 }}>Total Value</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: BRAND_NAVY }}>{formatCurrency(displayTotal)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: TEXT_MUTED, marginBottom: 6 }}>Current Approver</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>
              {isDraft ? '— set on submit —' : currentApproverName}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: TEXT_MUTED, marginBottom: 6 }}>Requester</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{requesterName}</div>
          </div>
        </div>
      </div>

      <StageTracker status={status} />

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {isDraft && (
          <button
            onClick={handleSubmitForApproval}
            disabled={submitting}
            style={{
              background: BRAND_RED,
              color: WHITE,
              border: 'none',
              borderRadius: 6,
              height: 34,
              padding: '0 18px',
              fontFamily: FONT_DISPLAY,
              fontSize: 13,
              fontWeight: 700,
              cursor: submitting ? 'default' : 'pointer',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? 'Submitting…' : 'Submit for approval'}
          </button>
        )}
        {isDraft && (
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              border: `1px solid ${BORDER}`,
              background: WHITE,
              borderRadius: 6,
              padding: '9px 16px',
              fontSize: 13,
              fontWeight: 600,
              color: TEXT_PRIMARY,
              cursor: saving ? 'default' : 'pointer',
            }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        )}
        {status === 100000003 && (
          <button
            onClick={handleMarkOrdered}
            disabled={updatingStatus}
            style={{
              background: STAGE_BLUE,
              color: WHITE,
              border: 'none',
              borderRadius: 6,
              height: 34,
              padding: '0 18px',
              fontFamily: FONT_DISPLAY,
              fontSize: 13,
              fontWeight: 700,
              cursor: updatingStatus ? 'default' : 'pointer',
              opacity: updatingStatus ? 0.7 : 1,
            }}
          >
            {updatingStatus ? 'Updating…' : 'Mark as Ordered'}
          </button>
        )}
        {status === 100000005 && (
          <button
            onClick={handleMarkReceived}
            disabled={updatingStatus}
            style={{
              background: STAGE_BLUE,
              color: WHITE,
              border: 'none',
              borderRadius: 6,
              height: 34,
              padding: '0 18px',
              fontFamily: FONT_DISPLAY,
              fontSize: 13,
              fontWeight: 700,
              cursor: updatingStatus ? 'default' : 'pointer',
              opacity: updatingStatus ? 0.7 : 1,
            }}
          >
            {updatingStatus ? 'Updating…' : 'Mark as Received'}
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 330px', gap: 20, alignItems: 'flex-start' }}>
        <div>
          <div style={sectionTitle}>Requester & job context</div>
          <div style={gridForm}>
            <Field label="Requester (auto)">
              <div style={readOnlyStyle}>{requesterName}</div>
            </Field>
            <Field label="Branch / Workshop" required>
              {isDraft ? (
                <input
                  style={inputStyle}
                  placeholder="e.g. Al Quoz Main Workshop"
                  value={form.branchworkshop}
                  onChange={(e) => setField('branchworkshop', e.target.value)}
                />
              ) : (
                <div style={readOnlyStyle}>{req.wksp_branchworkshop ?? '—'}</div>
              )}
            </Field>
            <Field label="Cost centre" required>
              {isDraft ? (
                <select style={inputStyle} value={form.costCentreId} onChange={(e) => setField('costCentreId', e.target.value)}>
                  <option value="">Select…</option>
                  {costCentres.map((c) => (
                    <option key={c.wksp_costcentreid} value={c.wksp_costcentreid}>
                      {c.wksp_name}
                    </option>
                  ))}
                </select>
              ) : (
                <div style={readOnlyStyle}>{costCentre?.wksp_name ?? '—'}</div>
              )}
            </Field>
            <Field label="Job card no." required>
              {isDraft ? (
                <>
                  <input
                    style={{ ...inputStyle, border: `1px solid ${jobCardInvalid ? BRAND_RED : BORDER}` }}
                    placeholder="e.g. JC-2026-04213"
                    value={form.jobcardnumber}
                    onChange={(e) => setField('jobcardnumber', e.target.value)}
                  />
                  <div style={{ fontSize: 10.5, marginTop: 4, color: jobCardInvalid ? BRAND_RED : TEXT_MUTED }}>{JOB_CARD_HINT}</div>
                </>
              ) : (
                <div style={readOnlyStyle}>{req.wksp_jobcardnumber ?? '—'}</div>
              )}
            </Field>
            <Field label="Repair order type">
              {isDraft ? (
                <select
                  style={inputStyle}
                  value={form.repairordertype}
                  onChange={(e) => setField('repairordertype', e.target.value === '' ? '' : Number(e.target.value))}
                >
                  <option value="">Select…</option>
                  {REPAIR_ORDER_TYPE_META.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div style={readOnlyStyle}>{getRepairOrderTypeLabel(req.wksp_repairordertype as unknown as number)}</div>
              )}
            </Field>
            <Field label="Customer name">
              {isDraft ? (
                <input
                  style={inputStyle}
                  placeholder="e.g. Ahmed Al Mansoori"
                  value={form.customername}
                  onChange={(e) => setField('customername', e.target.value)}
                />
              ) : (
                <div style={readOnlyStyle}>{req.wksp_customername ?? '—'}</div>
              )}
            </Field>
            <Field label="Vehicle model / year">
              {isDraft ? (
                <input
                  style={inputStyle}
                  placeholder="e.g. Toyota Land Cruiser 2023"
                  value={form.vehiclemodelyear}
                  onChange={(e) => setField('vehiclemodelyear', e.target.value)}
                />
              ) : (
                <div style={readOnlyStyle}>{req.wksp_vehiclemodelyear ?? '—'}</div>
              )}
            </Field>
            <Field label="Reg. no. / VIN">
              {isDraft ? (
                <input
                  style={inputStyle}
                  placeholder="e.g. DXB-A-12345"
                  value={form.regnovin}
                  onChange={(e) => setField('regnovin', e.target.value)}
                />
              ) : (
                <div style={readOnlyStyle}>{req.wksp_regnovin ?? '—'}</div>
              )}
            </Field>
            <Field label="Odometer (KM)">
              {isDraft ? (
                <input
                  type="number"
                  style={inputStyle}
                  placeholder="e.g. 45000"
                  value={form.odometerkm}
                  onChange={(e) => setField('odometerkm', e.target.value)}
                />
              ) : (
                <div style={readOnlyStyle}>{req.wksp_odometerkm ?? '—'}</div>
              )}
            </Field>
            <Field label="Vehicle off road?">
              {isDraft ? (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, height: 34 }}>
                  <input
                    type="checkbox"
                    checked={form.vehicleoffroad}
                    onChange={(e) => setField('vehicleoffroad', e.target.checked)}
                  />
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: form.vehicleoffroad ? BRAND_RED : TEXT_MUTED }}>
                    {form.vehicleoffroad ? 'Yes' : 'No'}
                  </span>
                </label>
              ) : (
                <div style={readOnlyStyle}>{req.wksp_vehicleoffroad ? 'Yes' : 'No'}</div>
              )}
            </Field>
            <Field label="Required by" required>
              {isDraft ? (
                <input type="date" style={inputStyle} value={form.requiredby} onChange={(e) => setField('requiredby', e.target.value)} />
              ) : (
                <div style={readOnlyStyle}>{formatDate(req.wksp_requiredby)}</div>
              )}
            </Field>
          </div>

          <div style={sectionTitle}>
            Line items{' '}
            <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: TEXT_MUTED }}>· Requisition Line Item table</span>
          </div>
          <div style={{ border: `1px solid ${BORDER}`, borderTop: 'none', borderRadius: '0 0 6px 6px', overflow: 'hidden', marginTop: 0 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '32px 2.4fr 1fr 0.6fr 0.9fr 1fr 28px',
                gap: 10,
                padding: '10px 12px',
                background: SURFACE_MUTED,
                fontSize: 10.5,
                fontWeight: 700,
                color: TEXT_MUTED,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}
            >
              <div>#</div>
              <div>Item description</div>
              <div>Category</div>
              <div style={{ textAlign: 'right' }}>Qty</div>
              <div style={{ textAlign: 'right' }}>Unit price</div>
              <div style={{ textAlign: 'right' }}>Line total</div>
              <div />
            </div>
            {lineItems.length === 0 ? (
              <div style={{ padding: 16, fontSize: 13, color: TEXT_MUTED, borderTop: `1px solid ${BORDER}` }}>No line items yet.</div>
            ) : (
              lineItems.map((li, idx) => (
                <LineItemRow
                  key={li.wksp_requisitionlineitemid}
                  index={idx + 1}
                  item={li}
                  editable={isDraft}
                  onUpdate={(changes) => handleUpdateLine(li.wksp_requisitionlineitemid, changes)}
                  onDelete={() => handleDeleteLine(li.wksp_requisitionlineitemid)}
                />
              ))
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 12px', borderTop: `1px solid ${BORDER}`, background: '#FCFCFD' }}>
              {isDraft && (
                <button
                  onClick={handleAddLine}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    border: 'none',
                    background: 'transparent',
                    color: BRAND_RED,
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  <PlusIcon size={14} color={BRAND_RED} />
                  New line item
                </button>
              )}
              <div style={{ flex: 1 }} />
              <div style={{ fontSize: 11.5, color: TEXT_MUTED }}>
                {lineItems.length} line{lineItems.length === 1 ? '' : 's'} · Subtotal{' '}
                <strong style={{ color: BRAND_NAVY }}>{formatCurrency(subtotal)}</strong>
              </div>
            </div>
          </div>

          <div style={sectionTitle}>Supplier & justification</div>
          <div style={gridForm}>
            <Field label="Supplier" required>
              {isDraft ? (
                <select style={inputStyle} value={form.supplierId} onChange={(e) => setField('supplierId', e.target.value)}>
                  <option value="">Select…</option>
                  {suppliers.map((s) => (
                    <option key={s.wksp_supplierid} value={s.wksp_supplierid}>
                      {s.wksp_suppliername}
                    </option>
                  ))}
                </select>
              ) : (
                <div style={readOnlyStyle}>{supplierName}</div>
              )}
            </Field>
            <Field label="Quotes attached">
              {isDraft ? (
                <input
                  type="number"
                  style={inputStyle}
                  placeholder="e.g. 2"
                  value={form.quotesattached}
                  onChange={(e) => setField('quotesattached', e.target.value)}
                />
              ) : (
                <div style={readOnlyStyle}>{req.wksp_quotesattached ?? '—'}</div>
              )}
            </Field>
            <Field label="Payment terms">
              {isDraft ? (
                <select
                  style={inputStyle}
                  value={form.paymentterms}
                  onChange={(e) => setField('paymentterms', e.target.value === '' ? '' : Number(e.target.value))}
                >
                  <option value="">Select…</option>
                  {PAYMENT_TERMS_META.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div style={readOnlyStyle}>{getPaymentTermsLabel(req.wksp_paymentterms as unknown as number)}</div>
              )}
            </Field>
            <Field label="Priority">
              {isDraft ? (
                <div style={{ display: 'flex', gap: 6, height: 34, alignItems: 'center' }}>
                  {PRIORITY_META.map((m) => {
                    const active = form.priority === m.value;
                    return (
                      <button
                        key={m.value}
                        onClick={() => setField('priority', m.value)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 6,
                          border: active ? 'none' : `1px solid ${BORDER}`,
                          background: active ? m.color : WHITE,
                          color: active ? WHITE : TEXT_MUTED,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={readOnlyStyle}>{getPriorityMeta(req.wksp_priority as unknown as number).label}</div>
              )}
            </Field>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                <span style={fieldLabel}>Justification {justificationRequired && <span style={{ color: BRAND_RED }}>*</span>}</span>
                {justificationRequired && (
                  <span style={{ fontSize: 10.5, color: BRAND_RED }}>Required — total is AED 10,000 or above (business rule)</span>
                )}
              </div>
              {isDraft ? (
                <textarea
                  placeholder="Explain why this purchase is necessary, e.g. Replacement parts required for warranty repair per approved job card."
                  value={form.justification}
                  onChange={(e) => setField('justification', e.target.value)}
                  style={{
                    minHeight: 74,
                    width: '100%',
                    boxSizing: 'border-box',
                    border: `1px solid ${justificationRequired && !form.justification ? BRAND_RED : BORDER}`,
                    borderRadius: 6,
                    padding: 10,
                    fontSize: 12.5,
                    fontFamily: 'inherit',
                    color: TEXT_PRIMARY,
                  }}
                />
              ) : (
                <div style={{ ...readOnlyStyle, minHeight: 74, height: 'auto', alignItems: 'flex-start', padding: 10 }}>
                  {req.wksp_justification || '—'}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: BRAND_NAVY, textTransform: 'uppercase' }}>
            Quick view
          </div>

          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, background: BRAND_NAVY, padding: 16, color: WHITE }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <div>
                <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Requisition risk score
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
                  <span style={{ fontSize: 34, fontWeight: 700 }}>{req.wksp_riskscore ?? '—'}</span>
                  {req.wksp_riskscore !== undefined && req.wksp_riskscore !== null && (
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.6)' }}>/ 100</span>
                  )}
                </div>
              </div>
              <Pill label={riskMeta.label.toUpperCase()} bg={riskMeta.color} fg={riskMeta.value === 100000001 ? BRAND_NAVY : WHITE} />
            </div>
            <div style={{ display: 'flex', gap: 3, margin: '14px 0 12px' }}>
              {[0, 1, 2, 3, 4].map((i) => {
                const score = req.wksp_riskscore ?? 0;
                const filled = i < Math.round((score / 100) * 5);
                return (
                  <span
                    key={i}
                    style={{
                      flex: 1,
                      height: 6,
                      borderRadius: 999,
                      background: filled ? riskMeta.color : 'rgba(255,255,255,.25)',
                    }}
                  />
                );
              })}
            </div>
            <div style={{ fontSize: 10.5, lineHeight: 1.45, color: 'rgba(255,255,255,.65)' }}>
              {req.wksp_riskscore !== undefined && req.wksp_riskscore !== null
                ? 'Score is advisory, computed automatically when the requisition is submitted.'
                : 'Score is calculated automatically once this requisition is submitted for approval.'}
            </div>
          </div>

          <div style={sidebarCard}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.03em', color: TEXT_MUTED, textTransform: 'uppercase', marginBottom: 12 }}>
              Routing preview
            </div>
            <RoutingPreview tierValue={req.wksp_valuetier as unknown as number} currentApprover={isDraft ? undefined : currentApproverName} />
          </div>

          {duplicateOf && (
            <div style={{ border: `1px solid ${GOLD}`, borderRadius: 8, padding: 14, background: '#FFFBF2' }}>
              <div style={{ display: 'flex', gap: 9 }}>
                <AlertTriangleIcon size={18} color="#8A6100" />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#8A6100' }}>Duplicate warning</div>
                  <div style={{ fontSize: 11, lineHeight: 1.45, color: '#7A5C1E', marginTop: 4 }}>
                    {duplicateOf.wksp_requisitionnumber} may be a duplicate of this request. Review before submitting.
                  </div>
                  <button
                    onClick={() => onNavigate(duplicateOf.wksp_requisitionid)}
                    style={{ border: 'none', background: 'none', padding: 0, marginTop: 8, fontSize: 11, fontWeight: 700, color: '#8A6100', cursor: 'pointer' }}
                  >
                    Open {duplicateOf.wksp_requisitionnumber} ›
                  </button>
                </div>
              </div>
            </div>
          )}

          <div style={sidebarCard}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.03em', color: TEXT_MUTED, textTransform: 'uppercase', marginBottom: 12 }}>
              Approval history
            </div>
            {history.length === 0 ? (
              <div style={{ fontSize: 11.5, lineHeight: 1.5, color: TEXT_MUTED }}>
                No decisions yet. Rows appear here once the requisition has been submitted — approver, level, action, comment and timestamp.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {history.map((h) => {
                  const actionLabel = getApprovalActionLabel(h.wksp_action as unknown as number);
                  const approved = (h.wksp_action as unknown as number) === 100000000;
                  return (
                    <div key={h.wksp_approvalhistoryid} style={{ borderLeft: `2px solid ${approved ? GREEN : BRAND_RED}`, paddingLeft: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY }}>
                        <span>{getApprovalLevelLabel(h.wksp_approvallevel as unknown as number)}</span>
                        <span style={{ color: approved ? GREEN : BRAND_RED }}>{actionLabel}</span>
                      </div>
                      <div style={{ fontSize: 10.5, color: TEXT_MUTED, marginTop: 2 }}>
                        {(h._wksp_approverid_value && nameById.get(h._wksp_approverid_value)) ?? '—'} · {formatDate(h.wksp_decisiondate)}
                      </div>
                      {h.wksp_comment && <div style={{ fontSize: 11, color: TEXT_PRIMARY, marginTop: 4 }}>{h.wksp_comment}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={sidebarCard}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.03em', color: TEXT_MUTED, textTransform: 'uppercase', marginBottom: 10 }}>
              Budget impact
            </div>
            {costCentre ? (
              <>
                <div style={{ fontSize: 11, color: TEXT_MUTED }}>{costCentre.wksp_name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '8px 0 10px' }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: BRAND_NAVY }}>{formatCurrency(committed)}</span>
                  <span style={{ fontSize: 11, color: TEXT_MUTED }}>of {formatCurrency(budget)}</span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: SURFACE_MUTED, overflow: 'hidden', display: 'flex' }}>
                  <span style={{ width: `${Math.min(100, committedPct ?? 0)}%`, background: BRAND_NAVY }} />
                  <span style={{ width: `${Math.min(100 - (committedPct ?? 0), deltaPct ?? 0)}%`, background: BRAND_RED }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10.5, color: TEXT_MUTED }}>
                  <span>{committedPct ?? 0}% committed</span>
                  <span style={{ color: BRAND_RED }}>+{deltaPct ?? 0}% this request</span>
                </div>
              </>
            ) : (
              <div style={{ fontSize: 11.5, color: TEXT_MUTED }}>No cost centre assigned yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      onClick={onBack}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        border: 'none',
        background: 'transparent',
        color: TEXT_MUTED,
        fontSize: 12.5,
        fontWeight: 600,
        cursor: 'pointer',
        padding: 0,
        width: 'fit-content',
      }}
    >
      <ArrowLeftIcon size={14} />
      Back to requisitions
    </button>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div style={fieldLabel}>
        {label} {required && <span style={{ color: BRAND_RED }}>*</span>}
      </div>
      {children}
    </div>
  );
}

function LineItemRow({
  index,
  item,
  editable,
  onUpdate,
  onDelete,
}: {
  index: number;
  item: Wksp_requisitionlineitems;
  editable: boolean;
  onUpdate: (changes: Partial<Wksp_requisitionlineitems>) => void;
  onDelete: () => void;
}) {
  const categoryMeta = getCategoryMeta(item.wksp_category as unknown as number);
  const lineTotal = item.wksp_linetotal ?? item.wksp_quantity * item.wksp_unitprice;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '32px 2.4fr 1fr 0.6fr 0.9fr 1fr 28px',
        gap: 10,
        padding: 12,
        borderTop: `1px solid ${BORDER}`,
        fontSize: 12,
        color: TEXT_PRIMARY,
        alignItems: 'center',
      }}
    >
      <div style={{ color: TEXT_MUTED }}>{String(index).padStart(2, '0')}</div>
      {editable ? (
        <input
          defaultValue={item.wksp_itemdescription ?? ''}
          onBlur={(e) => e.target.value !== item.wksp_itemdescription && onUpdate({ wksp_itemdescription: e.target.value })}
          style={{ ...inputStyle, height: 30 }}
        />
      ) : (
        <div style={{ fontWeight: 600 }}>{item.wksp_itemdescription}</div>
      )}
      {editable ? (
        <select
          defaultValue={String(item.wksp_category ?? '')}
          onChange={(e) => onUpdate({ wksp_category: Number(e.target.value) as never })}
          style={{ ...inputStyle, height: 30 }}
        >
          {CATEGORY_META.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      ) : (
        <div>
          <Pill
            label={categoryMeta.label}
            bg={categoryMeta.bg}
            fg={categoryMeta.fg}
            icon={(() => {
              const CategoryIcon = CATEGORY_ICONS[item.wksp_category as unknown as number];
              return CategoryIcon ? <CategoryIcon size={11} color={categoryMeta.fg} /> : null;
            })()}
          />
        </div>
      )}
      {editable ? (
        <input
          type="number"
          defaultValue={item.wksp_quantity}
          onBlur={(e) => Number(e.target.value) !== item.wksp_quantity && onUpdate({ wksp_quantity: Number(e.target.value) })}
          style={{ ...inputStyle, height: 30, textAlign: 'right' }}
        />
      ) : (
        <div style={{ textAlign: 'right' }}>{item.wksp_quantity}</div>
      )}
      {editable ? (
        <input
          type="number"
          defaultValue={item.wksp_unitprice}
          onBlur={(e) => Number(e.target.value) !== item.wksp_unitprice && onUpdate({ wksp_unitprice: Number(e.target.value) })}
          style={{ ...inputStyle, height: 30, textAlign: 'right' }}
        />
      ) : (
        <div style={{ textAlign: 'right' }}>{item.wksp_unitprice.toFixed(2)}</div>
      )}
      <div style={{ textAlign: 'right', fontWeight: 700 }}>{lineTotal.toFixed(2)}</div>
      {editable ? (
        <button onClick={onDelete} style={{ border: 'none', background: 'none', cursor: 'pointer', color: TEXT_MUTED }}>
          <TrashIcon size={14} color={BRAND_RED} />
        </button>
      ) : (
        <div />
      )}
    </div>
  );
}

function RoutingPreview({ tierValue, currentApprover }: { tierValue: number | undefined; currentApprover?: string }) {
  const tierMeta = getValueTierMeta(tierValue);
  const steps =
    tierValue === 100000002
      ? [
          { label: 'Workshop Manager', note: 'budget owner' },
          { label: 'Finance Controller', note: '>10k policy gate' },
          { label: 'Procurement', note: 'PO raised after approval', pending: true },
        ]
      : tierValue === 100000001
      ? [
          { label: 'Workshop Manager', note: 'budget owner' },
          { label: 'Procurement', note: 'PO raised after approval', pending: true },
        ]
      : [
          { label: 'Workshop Supervisor', note: 'first-line approver' },
          { label: 'Procurement', note: 'PO raised after approval', pending: true },
        ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {steps.map((step, i) => (
        <div key={step.label} style={{ display: 'flex', gap: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: step.pending ? 'transparent' : BRAND_NAVY,
                border: step.pending ? `1.5px solid ${BORDER}` : 'none',
                color: step.pending ? TEXT_MUTED : WHITE,
                fontSize: 10,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {i + 1}
            </span>
            {i < steps.length - 1 && <span style={{ width: 1.5, flex: 1, background: BORDER, minHeight: 22 }} />}
          </div>
          <div style={{ paddingBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: step.pending ? TEXT_MUTED : TEXT_PRIMARY }}>{step.label}</div>
            <div style={{ fontSize: 10.5, color: TEXT_MUTED }}>
              {!step.pending && currentApprover && step.label === currentApprover ? `${currentApprover} · ` : ''}
              {step.note}
            </div>
          </div>
        </div>
      ))}
      <div style={{ fontSize: 10, color: TEXT_MUTED, marginTop: 2 }}>Tier: {tierMeta.label}</div>
    </div>
  );
}
