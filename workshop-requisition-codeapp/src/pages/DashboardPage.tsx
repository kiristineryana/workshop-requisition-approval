import { useEffect, useMemo, useState } from 'react';
import { Wksp_requisitionsService } from '../generated/services/Wksp_requisitionsService';
import { Wksp_costcentresService } from '../generated/services/Wksp_costcentresService';
import { Wksp_suppliersService } from '../generated/services/Wksp_suppliersService';
import { Wksp_approvalhistoriesService } from '../generated/services/Wksp_approvalhistoriesService';
import type { Wksp_requisitions } from '../generated/models/Wksp_requisitionsModel';
import type { Wksp_costcentres } from '../generated/models/Wksp_costcentresModel';
import type { Wksp_suppliers } from '../generated/models/Wksp_suppliersModel';
import type { Wksp_approvalhistories } from '../generated/models/Wksp_approvalhistoriesModel';
import {
  BRAND_NAVY,
  BRAND_RED,
  GOLD,
  GREEN,
  SURFACE_MUTED,
  TEXT_MUTED,
  TEXT_PRIMARY,
  BORDER,
  WHITE,
  FONT_DISPLAY,
} from '../theme';
import {
  STATUS_META,
  VALUETIER_META,
  RISK_LEVEL_META,
  CLOSED_STATUS_VALUES,
  PENDING_STATUS_VALUES,
  formatCurrency,
  getRiskLevelMeta,
  getValueTierMeta,
} from '../lib/choiceMeta';
import { KpiCard } from '../components/KpiCard';
import { HorizontalBarChart } from '../components/charts/HorizontalBarChart';
import { VerticalBarChart } from '../components/charts/VerticalBarChart';
import {
  ClockPendingIcon,
  CheckCircleIcon,
  DismissCircleIcon,
  ShieldWarningIcon,
  WalletIcon,
  RefreshIcon,
} from '../components/icons';
import { useUserDirectory } from '../lib/users';

const IN_APPROVAL = 100000002;
const APPROVED = 100000003;
const REJECTED = 100000004;
const ORDERED = 100000005;
const RECEIVED = 100000006;
const OFF_CONTRACT = 100000001;
const HIGH_RISK = 100000002;

type LoadState<T> = { records: T[]; loading: boolean; error: string | null };

const sectionCard: React.CSSProperties = {
  background: WHITE,
  border: `1px solid ${BORDER}`,
  borderRadius: 12,
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const sectionTitle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 15,
  fontWeight: 700,
  color: TEXT_PRIMARY,
};

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function DashboardPage({
  onNavigateToPending,
  onOpenRequisition,
}: {
  onNavigateToPending?: () => void;
  onOpenRequisition?: (id: string) => void;
}) {
  const [reqState, setReqState] = useState<LoadState<Wksp_requisitions>>({ records: [], loading: true, error: null });
  const [ccState, setCcState] = useState<LoadState<Wksp_costcentres>>({ records: [], loading: true, error: null });
  const [supState, setSupState] = useState<LoadState<Wksp_suppliers>>({ records: [], loading: true, error: null });
  const [histState, setHistState] = useState<LoadState<Wksp_approvalhistories>>({ records: [], loading: true, error: null });
  const [reloadKey, setReloadKey] = useState(0);
  const { nameById, currentUserId, loading: directoryLoading } = useUserDirectory();

  useEffect(() => {
    let cancelled = false;
    setReqState((prev) => ({ ...prev, loading: true, error: null }));
    Wksp_requisitionsService.getAll({
      select: [
        'wksp_requisitionid',
        'wksp_requisitionnumber',
        'wksp_status',
        'wksp_valuetier',
        'wksp_totalvalue',
        'wksp_datesubmitted',
        'wksp_riskscore',
        'wksp_risklevel',
        'wksp_jobcardnumber',
        'wksp_quotesattached',
        'wksp_justification',
        'wksp_ageinapprovalhours',
        '_wksp_supplierid_value',
        '_wksp_duplicateofid_value',
        '_wksp_requesterid_value',
        '_wksp_currentapproverid_value',
      ],
      maxPageSize: 500,
    }).then((result) => {
      if (cancelled) return;
      if (result.success) {
        setReqState({ records: result.data ?? [], loading: false, error: null });
      } else {
        setReqState({ records: [], loading: false, error: result.error?.message ?? 'Unable to load requisitions.' });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    let cancelled = false;
    setCcState((prev) => ({ ...prev, loading: true, error: null }));
    Wksp_costcentresService.getAll({
      select: ['wksp_costcentreid', 'wksp_name', 'wksp_monthlybudget', 'wksp_committedamount'],
      maxPageSize: 500,
    }).then((result) => {
      if (cancelled) return;
      if (result.success) {
        setCcState({ records: result.data ?? [], loading: false, error: null });
      } else {
        setCcState({ records: [], loading: false, error: result.error?.message ?? 'Unable to load cost centres.' });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    let cancelled = false;
    setSupState((prev) => ({ ...prev, loading: true, error: null }));
    Wksp_suppliersService.getAll({
      select: ['wksp_supplierid', 'wksp_suppliername', 'wksp_contractstatus'],
      maxPageSize: 500,
    }).then((result) => {
      if (cancelled) return;
      if (result.success) {
        setSupState({ records: result.data ?? [], loading: false, error: null });
      } else {
        setSupState({ records: [], loading: false, error: result.error?.message ?? 'Unable to load suppliers.' });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    let cancelled = false;
    setHistState((prev) => ({ ...prev, loading: true, error: null }));
    Wksp_approvalhistoriesService.getAll({
      select: ['wksp_approvalhistoryid', '_wksp_requisitionid_value', 'wksp_action', 'wksp_decisiondate'],
      orderBy: ['wksp_decisiondate asc'],
      maxPageSize: 500,
    }).then((result) => {
      if (cancelled) return;
      if (result.success) {
        setHistState({ records: result.data ?? [], loading: false, error: null });
      } else {
        setHistState({ records: [], loading: false, error: result.error?.message ?? 'Unable to load approval history.' });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const isLoading = reqState.loading || ccState.loading || supState.loading || histState.loading || directoryLoading;
  const combinedError = reqState.error ?? ccState.error ?? supState.error ?? histState.error;

  const records = reqState.records;

  const supplierById = useMemo(() => {
    const map = new Map<string, Wksp_suppliers>();
    supState.records.forEach((s) => map.set(s.wksp_supplierid, s));
    return map;
  }, [supState.records]);

  // Last decision date per requisition, from the append-only Approval History table.
  const lastDecisionByReq = useMemo(() => {
    const map = new Map<string, string>();
    histState.records.forEach((h) => {
      const reqId = h._wksp_requisitionid_value;
      if (!reqId || !h.wksp_decisiondate) return;
      map.set(reqId, h.wksp_decisiondate); // records arrive ordered asc, so last write wins = latest
    });
    return map;
  }, [histState.records]);

  const openRecords = useMemo(
    () => records.filter((r) => !CLOSED_STATUS_VALUES.includes(r.wksp_status as unknown as number)),
    [records],
  );

  const pendingRecords = useMemo(
    () => records.filter((r) => PENDING_STATUS_VALUES.includes(r.wksp_status as unknown as number)),
    [records],
  );

  const myPending = useMemo(
    () =>
      currentUserId
        ? records.filter((r) => (r.wksp_status as unknown as number) === IN_APPROVAL && r._wksp_currentapproverid_value === currentUserId)
        : [],
    [records, currentUserId],
  );

  const kpis = useMemo(() => {
    const pending = pendingRecords;
    const pendingValue = pending.reduce((sum, r) => sum + (r.wksp_totalvalue ?? 0), 0);
    const overdue = pending.filter((r) => (r.wksp_ageinapprovalhours ?? 0) > 24).length;

    const decided = records.filter((r) => {
      const s = r.wksp_status as unknown as number;
      return s === APPROVED || s === REJECTED || s === ORDERED || s === RECEIVED;
    });
    const approvedCount = decided.filter((r) => (r.wksp_status as unknown as number) !== REJECTED).length;
    const rejectedCount = decided.filter((r) => (r.wksp_status as unknown as number) === REJECTED).length;
    const approvalRate = decided.length > 0 ? Math.round((approvedCount / decided.length) * 100) : null;
    const rejectionRate = decided.length > 0 ? Math.round((rejectedCount / decided.length) * 100) : null;

    const withTiming = decided
      .map((r) => {
        const decidedOn = lastDecisionByReq.get(r.wksp_requisitionid);
        if (!r.wksp_datesubmitted || !decidedOn) return null;
        const start = new Date(r.wksp_datesubmitted).getTime();
        const end = new Date(decidedOn).getTime();
        if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
        return (end - start) / 3600000;
      })
      .filter((h): h is number => h !== null);
    const avgApprovalHours = withTiming.length > 0 ? withTiming.reduce((a, b) => a + b, 0) / withTiming.length : null;

    const highRiskOpen = openRecords.filter((r) => (r.wksp_risklevel as unknown as number) === HIGH_RISK);

    return {
      pendingCount: pending.length,
      pendingValue,
      overdue,
      approvalRate,
      rejectionRate,
      decidedCount: decided.length,
      avgApprovalHours,
      timingSampleSize: withTiming.length,
      highRiskCount: highRiskOpen.length,
      highRiskExposure: highRiskOpen.reduce((sum, r) => sum + (r.wksp_totalvalue ?? 0), 0),
    };
  }, [pendingRecords, records, openRecords, lastDecisionByReq]);

  const statusDistribution = useMemo(
    () =>
      STATUS_META.map((meta) => ({
        label: meta.label,
        value: records.filter((r) => (r.wksp_status as unknown as number) === meta.value).length,
        color: meta.color,
      })),
    [records],
  );

  const tierDistribution = useMemo(
    () =>
      VALUETIER_META.map((meta) => {
        const total = records
          .filter((r) => (r.wksp_valuetier as unknown as number) === meta.value)
          .reduce((sum, r) => sum + (r.wksp_totalvalue ?? 0), 0);
        return {
          label: meta.label,
          value: total,
          color: meta.color,
          caption: meta.approver,
          valueLabel: formatCurrency(total),
        };
      }),
    [records],
  );

  const riskMix = useMemo(
    () =>
      RISK_LEVEL_META.map((meta) => ({
        label: meta.label,
        count: openRecords.filter((r) => (r.wksp_risklevel as unknown as number) === meta.value).length,
        color: meta.color,
      })),
    [openRecords],
  );
  const riskMixTotal = riskMix.reduce((sum, r) => sum + r.count, 0);

  // Per-requisition risk-flag detection, reused by both the "Top risk drivers" chart and the
  // Risk Watchlist table below — every flag is derived from real fields, never fabricated.
  function isOffContract(r: Wksp_requisitions): boolean {
    const supplier = r._wksp_supplierid_value ? supplierById.get(r._wksp_supplierid_value) : undefined;
    return (supplier?.wksp_contractstatus as unknown as number) === OFF_CONTRACT;
  }
  function isDuplicate(r: Wksp_requisitions): boolean {
    return !!r._wksp_duplicateofid_value;
  }
  function hasSingleQuote(r: Wksp_requisitions): boolean {
    return (r.wksp_quotesattached ?? 0) <= 1;
  }
  function missingJustification(r: Wksp_requisitions): boolean {
    return (r.wksp_totalvalue ?? 0) >= 10000 && !(r.wksp_justification ?? '').trim();
  }

  const riskDrivers = useMemo(() => {
    const drivers = [
      { label: 'Off-contract supplier', count: openRecords.filter(isOffContract).length, color: GOLD },
      { label: 'Duplicate job-card match', count: openRecords.filter(isDuplicate).length, color: GOLD },
      { label: 'Single/no quote attached', count: openRecords.filter(hasSingleQuote).length, color: BRAND_RED },
      { label: 'Missing justification (≥10k)', count: openRecords.filter(missingJustification).length, color: GOLD },
    ];
    return drivers.filter((d) => d.count > 0).sort((a, b) => b.count - a.count);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openRecords, supplierById]);

  const ageingBuckets = useMemo(() => {
    const inApproval = records.filter((r) => (r.wksp_status as unknown as number) === IN_APPROVAL);
    const under24 = inApproval.filter((r) => (r.wksp_ageinapprovalhours ?? 0) < 24).length;
    const oneToTwoDays = inApproval.filter((r) => (r.wksp_ageinapprovalhours ?? 0) >= 24 && (r.wksp_ageinapprovalhours ?? 0) < 48).length;
    const overTwoDays = inApproval.filter((r) => (r.wksp_ageinapprovalhours ?? 0) >= 48).length;
    return [
      { label: 'Under 24 hours', count: under24, bg: SURFACE_MUTED, fg: TEXT_PRIMARY },
      { label: '1–2 days', count: oneToTwoDays, bg: '#FFFBF2', fg: '#7A5C1E' },
      { label: 'Over 2 days', count: overTwoDays, bg: '#FFF4F5', fg: '#B8233A' },
    ];
  }, [records]);

  function topFlag(r: Wksp_requisitions): { text: string; color: string } | null {
    if (isDuplicate(r)) return { text: 'Possible duplicate request', color: '#8A6100' };
    if (isOffContract(r)) return { text: 'Off-contract supplier', color: '#B8233A' };
    if (hasSingleQuote(r)) return { text: 'Single/no quote attached', color: '#8A6100' };
    if (missingJustification(r)) return { text: 'Missing justification detail', color: '#8A6100' };
    return null;
  }

  const riskWatchlist = useMemo(
    () =>
      openRecords
        .filter((r) => r.wksp_riskscore !== undefined && r.wksp_riskscore !== null && r.wksp_riskscore > 0)
        .sort((a, b) => (b.wksp_riskscore ?? 0) - (a.wksp_riskscore ?? 0))
        .slice(0, 6),
    [openRecords],
  );

  const sortedCostCentres = useMemo(
    () =>
      [...ccState.records].sort((a, b) => {
        const pctA = (a.wksp_monthlybudget ?? 0) > 0 ? (a.wksp_committedamount ?? 0) / (a.wksp_monthlybudget ?? 1) : -1;
        const pctB = (b.wksp_monthlybudget ?? 0) > 0 ? (b.wksp_committedamount ?? 0) / (b.wksp_monthlybudget ?? 1) : -1;
        return pctB - pctA;
      }),
    [ccState.records],
  );

  const monthlyTrend = useMemo(() => {
    const map = new Map<string, number>();
    records.forEach((r) => {
      if (!r.wksp_datesubmitted) return;
      const d = new Date(r.wksp_datesubmitted);
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    const keys = Array.from(map.keys()).sort().slice(-6);
    return keys.map((key) => {
      const [y, m] = key.split('-').map(Number);
      const label = new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      return { label, value: map.get(key) ?? 0, color: BRAND_NAVY };
    });
  }, [records]);

  function handleExport() {
    const header = ['Requisition', 'Status', 'Value Tier', 'Total Value (AED)', 'Risk Score', 'Submitted'];
    const rows = records.map((r) => [
      r.wksp_requisitionnumber ?? '',
      STATUS_META.find((m) => m.value === (r.wksp_status as unknown as number))?.label ?? '',
      getValueTierMeta(r.wksp_valuetier as unknown as number).label,
      String(r.wksp_totalvalue ?? 0),
      r.wksp_riskscore !== undefined && r.wksp_riskscore !== null ? String(r.wksp_riskscore) : '',
      r.wksp_datesubmitted ?? '',
    ]);
    const csv = [header, ...rows].map((row) => row.map((v) => csvEscape(String(v))).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `requisitions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return <div style={{ padding: 40, textAlign: 'center', color: TEXT_MUTED }}>Loading requisition analytics…</div>;
  }

  const myName = (currentUserId && nameById.get(currentUserId)) || 'there';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: BRAND_NAVY }}>
            {timeGreeting()} {myName},
          </h1>
          <p style={{ margin: '5px 0 0', fontSize: 13, color: TEXT_MUTED }}>
            {myPending.length} requisition{myPending.length === 1 ? '' : 's'} {myPending.length === 1 ? 'is' : 'are'} waiting on you
            {' · '}
            {formatCurrency(myPending.reduce((s, r) => s + (r.wksp_totalvalue ?? 0), 0))} held in approval
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {onNavigateToPending && (
            <button
              onClick={onNavigateToPending}
              style={{
                border: 'none',
                background: BRAND_RED,
                color: WHITE,
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 700,
                fontFamily: FONT_DISPLAY,
                cursor: 'pointer',
              }}
            >
              Review pending ({myPending.length})
            </button>
          )}
          <button
            onClick={handleExport}
            style={{
              border: `1px solid ${BORDER}`,
              background: WHITE,
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 13,
              fontWeight: 600,
              color: TEXT_PRIMARY,
              cursor: 'pointer',
            }}
          >
            Export
          </button>
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              border: `1px solid ${BORDER}`,
              background: WHITE,
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 13,
              fontWeight: 600,
              color: TEXT_PRIMARY,
              cursor: 'pointer',
            }}
          >
            <RefreshIcon size={14} />
            Refresh
          </button>
        </div>
      </div>

      {combinedError && (
        <div style={{ background: '#FFF4F5', color: BRAND_RED, padding: 12, borderRadius: 8, fontSize: 13 }}>
          {combinedError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
        <KpiCard
          icon={<ClockPendingIcon size={18} />}
          label="Pending approval"
          value={String(kpis.pendingCount)}
          accentBg={GOLD}
          caption={`${kpis.overdue} over 24h · ${formatCurrency(kpis.pendingValue)} held`}
        />
        <KpiCard
          icon={<ClockPendingIcon size={18} />}
          label="Avg. approval time"
          value={kpis.avgApprovalHours !== null ? `${kpis.avgApprovalHours.toFixed(1)}h` : '—'}
          accentBg={BRAND_NAVY}
          caption={kpis.timingSampleSize > 0 ? `Based on ${kpis.timingSampleSize} decision${kpis.timingSampleSize === 1 ? '' : 's'}` : 'No decisions yet'}
        />
        <KpiCard
          icon={<CheckCircleIcon size={18} />}
          label="Approval rate"
          value={kpis.approvalRate !== null ? `${kpis.approvalRate}%` : '—'}
          accentBg={GREEN}
          caption={kpis.decidedCount > 0 ? `${kpis.decidedCount} decided` : 'No decisions yet'}
        />
        <KpiCard
          icon={<DismissCircleIcon size={18} />}
          label="Rejection rate"
          value={kpis.rejectionRate !== null ? `${kpis.rejectionRate}%` : '—'}
          accentBg={BRAND_RED}
          caption={kpis.decidedCount > 0 ? `${kpis.decidedCount} decided` : 'No decisions yet'}
        />
        <KpiCard
          icon={<ShieldWarningIcon size={18} />}
          label="High-risk open"
          value={String(kpis.highRiskCount)}
          accentBg={BRAND_RED}
          danger
          caption={kpis.highRiskCount > 0 ? `${formatCurrency(kpis.highRiskExposure)} exposure` : 'score ≥ high'}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
        <div style={sectionCard}>
          <div style={sectionTitle}>Requisitions by status</div>
          {records.length === 0 ? (
            <span style={{ color: TEXT_MUTED, fontSize: 13 }}>No requisitions found.</span>
          ) : (
            <HorizontalBarChart data={statusDistribution} />
          )}
        </div>
        <div style={sectionCard}>
          <div style={sectionTitle}>Spend by value tier</div>
          {records.length === 0 ? (
            <span style={{ color: TEXT_MUTED, fontSize: 13 }}>No requisitions found.</span>
          ) : (
            <VerticalBarChart data={tierDistribution} />
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div style={sectionCard}>
          <div style={sectionTitle}>Risk mix · open requisitions</div>
          {riskMixTotal === 0 ? (
            <span style={{ color: TEXT_MUTED, fontSize: 13 }}>No open requisitions to score.</span>
          ) : (
            <>
              <div style={{ display: 'flex', width: '100%', height: 14, borderRadius: 999, overflow: 'hidden', background: SURFACE_MUTED }}>
                {riskMix.map((r) => (
                  <span
                    key={r.label}
                    style={{ background: r.color, flexGrow: r.count > 0 ? r.count : 0, flexBasis: 0, minWidth: r.count > 0 ? 4 : 0 }}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {riskMix.map((r) => (
                  <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: TEXT_PRIMARY }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: r.color }} />
                    {r.label} ({r.count})
                  </div>
                ))}
              </div>
            </>
          )}
          <div style={{ fontSize: 10.5, color: TEXT_MUTED, borderTop: `1px solid ${BORDER}`, paddingTop: 10, marginTop: 2 }}>
            Score is advisory and computed automatically by the approval flow when a requisition is submitted.
          </div>
        </div>

        <div style={sectionCard}>
          <div style={sectionTitle}>Top risk drivers</div>
          {riskDrivers.length === 0 ? (
            <span style={{ color: TEXT_MUTED, fontSize: 13 }}>No flagged risk drivers on open requisitions.</span>
          ) : (
            <HorizontalBarChart data={riskDrivers.map((d) => ({ label: d.label, value: d.count, color: d.color }))} />
          )}
        </div>

        <div style={sectionCard}>
          <div style={sectionTitle}>Ageing in approval</div>
          {ageingBuckets.every((b) => b.count === 0) ? (
            <span style={{ color: TEXT_MUTED, fontSize: 13 }}>Nothing currently In Approval.</span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ageingBuckets.map((b) => (
                <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px', borderRadius: 6, background: b.bg }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: b.count > 0 ? b.fg : TEXT_MUTED, width: 22 }}>{b.count}</span>
                  <span style={{ fontSize: 12, color: b.count > 0 ? b.fg : TEXT_MUTED }}>{b.label}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ fontSize: 10.5, color: TEXT_MUTED, borderTop: `1px solid ${BORDER}`, paddingTop: 10, marginTop: 2 }}>
            Hours elapsed since submission, refreshed automatically while In Approval.
          </div>
        </div>
      </div>

      <div style={sectionCard}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={sectionTitle}>Risk watchlist · requisitions needing a second look</div>
        </div>
        {riskWatchlist.length === 0 ? (
          <span style={{ color: TEXT_MUTED, fontSize: 13 }}>No open requisitions carry a risk score above zero right now.</span>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: SURFACE_MUTED, textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em', color: TEXT_MUTED }}>
                  <th style={{ textAlign: 'left', padding: '10px 12px' }}>Requisition</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px' }}>Requester · job card</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px' }}>Supplier</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px' }}>Value (AED)</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px' }}>Tier</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px' }}>Top flag</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px' }}>Risk</th>
                </tr>
              </thead>
              <tbody>
                {riskWatchlist.map((r) => {
                  const riskMeta = getRiskLevelMeta(r.wksp_risklevel as unknown as number);
                  const tierMeta = getValueTierMeta(r.wksp_valuetier as unknown as number);
                  const supplier = r._wksp_supplierid_value ? supplierById.get(r._wksp_supplierid_value) : undefined;
                  const flag = topFlag(r);
                  const requesterName = (r._wksp_requesterid_value && nameById.get(r._wksp_requesterid_value)) ?? '—';
                  return (
                    <tr
                      key={r.wksp_requisitionid}
                      style={{ borderTop: `1px solid ${BORDER}`, cursor: onOpenRequisition ? 'pointer' : 'default' }}
                      onClick={() => onOpenRequisition?.(r.wksp_requisitionid)}
                    >
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: BRAND_NAVY }}>{r.wksp_requisitionnumber}</td>
                      <td style={{ padding: '10px 12px', color: TEXT_PRIMARY }}>
                        {requesterName}
                        {r.wksp_jobcardnumber ? ` · ${r.wksp_jobcardnumber}` : ''}
                      </td>
                      <td style={{ padding: '10px 12px', color: TEXT_PRIMARY }}>{supplier?.wksp_suppliername ?? '—'}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: TEXT_PRIMARY }}>
                        {(r.wksp_totalvalue ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </td>
                      <td style={{ padding: '10px 12px', color: TEXT_PRIMARY }}>{tierMeta.approver}</td>
                      <td style={{ padding: '10px 12px', color: flag ? flag.color : TEXT_MUTED }}>{flag ? flag.text : 'Elevated risk score'}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <span
                          style={{
                            background: riskMeta.color,
                            color: riskMeta.value === 100000001 ? BRAND_NAVY : WHITE,
                            borderRadius: 999,
                            padding: '3px 10px',
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {r.wksp_riskscore}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={sectionCard}>
          <div style={{ ...sectionTitle }}>
            <WalletIcon size={18} color={BRAND_NAVY} />
            Cost centre budget
          </div>
          {sortedCostCentres.length === 0 ? (
            <span style={{ color: TEXT_MUTED, fontSize: 13 }}>No cost centres found.</span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {sortedCostCentres.map((c) => {
                const budget = c.wksp_monthlybudget ?? 0;
                const committed = c.wksp_committedamount ?? 0;
                const hasBudget = budget > 0;
                const pct = hasBudget ? Math.round((committed / budget) * 100) : null;
                const fillColor = pct === null ? TEXT_MUTED : pct > 100 ? BRAND_RED : pct >= 90 ? GOLD : BRAND_NAVY;
                return (
                  <div key={c.wksp_costcentreid} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ fontWeight: 600, color: TEXT_PRIMARY }}>{c.wksp_name}</span>
                      <span style={{ color: TEXT_MUTED }}>
                        {hasBudget ? `${formatCurrency(committed)} of ${formatCurrency(budget)} · ${pct}%` : 'No budget set'}
                      </span>
                    </div>
                    <div style={{ height: 8, borderRadius: 6, background: SURFACE_MUTED, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: pct === null ? '0%' : `${Math.min(100, pct)}%`,
                          background: fillColor,
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={sectionCard}>
          <div style={sectionTitle}>Requisitions submitted by month</div>
          {monthlyTrend.length === 0 ? (
            <span style={{ color: TEXT_MUTED, fontSize: 13 }}>No submission dates recorded yet.</span>
          ) : (
            <VerticalBarChart data={monthlyTrend} height={130} />
          )}
        </div>
      </div>
    </div>
  );
}
