import { useEffect, useMemo, useState } from 'react';
import { Wksp_requisitionsService } from '../generated/services/Wksp_requisitionsService';
import { Wksp_costcentresService } from '../generated/services/Wksp_costcentresService';
import type { Wksp_requisitions } from '../generated/models/Wksp_requisitionsModel';
import type { Wksp_costcentres } from '../generated/models/Wksp_costcentresModel';
import {
  BRAND_NAVY,
  BRAND_RED,
  GOLD,
  GREEN,
  SURFACE_MUTED,
  TEXT_MUTED,
  TEXT_PRIMARY,
  BORDER,
} from '../theme';
import {
  STATUS_META,
  VALUETIER_META,
  RISK_LEVEL_META,
  CLOSED_STATUS_VALUES,
  formatCurrency,
  getRiskLevelMeta,
  getValueTierMeta,
} from '../lib/choiceMeta';
import { KpiCard } from '../components/KpiCard';
import { HorizontalBarChart } from '../components/charts/HorizontalBarChart';
import { VerticalBarChart } from '../components/charts/VerticalBarChart';
import {
  ClipboardIcon,
  MoneyIcon,
  ClockPendingIcon,
  CheckCircleIcon,
  DismissCircleIcon,
  ShieldWarningIcon,
  WalletIcon,
} from '../components/icons';

type LoadState<T> = { records: T[]; loading: boolean; error: string | null };

const sectionCard: React.CSSProperties = {
  background: '#fff',
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

export function DashboardPage() {
  const [reqState, setReqState] = useState<LoadState<Wksp_requisitions>>({ records: [], loading: true, error: null });
  const [ccState, setCcState] = useState<LoadState<Wksp_costcentres>>({ records: [], loading: true, error: null });
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState('');

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

  const isLoading = reqState.loading || ccState.loading;
  const combinedError = reqState.error ?? ccState.error;

  const records = reqState.records;

  const openRecords = useMemo(
    () => records.filter((r) => !CLOSED_STATUS_VALUES.includes(r.wksp_status as unknown as number)),
    [records],
  );

  const kpis = useMemo(() => {
    const total = records.length;
    const totalValue = records.reduce((sum, r) => sum + (r.wksp_totalvalue ?? 0), 0);
    const pending = records.filter((r) => [100000001, 100000002].includes(r.wksp_status as unknown as number)).length;
    const approved = records.filter((r) => (r.wksp_status as unknown as number) === 100000003).length;
    const rejected = records.filter((r) => (r.wksp_status as unknown as number) === 100000004).length;
    const highRiskOpen = openRecords.filter((r) => (r.wksp_risklevel as unknown as number) === 100000002);
    const highRiskCount = highRiskOpen.length;
    const highRiskExposure = highRiskOpen.reduce((sum, r) => sum + (r.wksp_totalvalue ?? 0), 0);
    return { total, totalValue, pending, approved, rejected, highRiskCount, highRiskExposure };
  }, [records, openRecords]);

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
      VALUETIER_META.map((meta) => ({
        label: meta.label,
        value: records
          .filter((r) => (r.wksp_valuetier as unknown as number) === meta.value)
          .reduce((sum, r) => sum + (r.wksp_totalvalue ?? 0), 0),
        color: meta.color,
        caption: meta.approver,
        valueLabel: `AED ${Math.round(
          records
            .filter((r) => (r.wksp_valuetier as unknown as number) === meta.value)
            .reduce((sum, r) => sum + (r.wksp_totalvalue ?? 0), 0),
        ).toLocaleString('en-US')}`,
      })),
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

  const pendingRecords = useMemo(
    () => records.filter((r) => [100000001, 100000002].includes(r.wksp_status as unknown as number)),
    [records],
  );

  const filteredPending = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return pendingRecords;
    return pendingRecords.filter((r) => (r.wksp_requisitionnumber ?? '').toLowerCase().includes(term));
  }, [pendingRecords, search]);

  if (isLoading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: TEXT_MUTED }}>Loading requisition analytics…</div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: BRAND_NAVY }}>Requisition analytics</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: TEXT_MUTED }}>
            KPI overview of workshop purchase requisitions by status, value tier, cost-centre budget, and risk mix.
          </p>
        </div>
        <button
          onClick={() => setReloadKey((k) => k + 1)}
          style={{
            border: `1px solid ${BORDER}`,
            background: '#fff',
            borderRadius: 8,
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 600,
            color: TEXT_PRIMARY,
            cursor: 'pointer',
          }}
        >
          Refresh
        </button>
      </div>

      {combinedError && (
        <div style={{ background: '#FFF4F5', color: BRAND_RED, padding: 12, borderRadius: 8, fontSize: 13 }}>
          {combinedError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        <KpiCard icon={<ClipboardIcon size={18} />} label="Total requisitions" value={String(kpis.total)} accentBg={BRAND_NAVY} />
        <KpiCard icon={<MoneyIcon size={18} />} label="Total value" value={formatCurrency(kpis.totalValue)} accentBg={GREEN} />
        <KpiCard icon={<ClockPendingIcon size={18} />} label="Pending approval" value={String(kpis.pending)} accentBg={GOLD} />
        <KpiCard icon={<CheckCircleIcon size={18} />} label="Approved" value={String(kpis.approved)} accentBg={GREEN} />
        <KpiCard icon={<DismissCircleIcon size={18} />} label="Rejected" value={String(kpis.rejected)} accentBg={BRAND_RED} />
        <KpiCard
          icon={<ShieldWarningIcon size={18} />}
          label="High-risk open"
          value={String(kpis.highRiskCount)}
          accentBg={BRAND_RED}
          danger
        />
      </div>
      {kpis.highRiskCount > 0 && (
        <p style={{ margin: 0, fontSize: 12, color: TEXT_MUTED }}>
          {formatCurrency(kpis.highRiskExposure)} exposure across {kpis.highRiskCount} high-risk open requisition
          {kpis.highRiskCount === 1 ? '' : 's'}.
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
        <div style={sectionCard}>
          <div style={sectionTitle}>Requisitions by status</div>
          {kpis.total === 0 ? (
            <span style={{ color: TEXT_MUTED, fontSize: 13 }}>No requisitions found.</span>
          ) : (
            <HorizontalBarChart data={statusDistribution} />
          )}
        </div>
        <div style={sectionCard}>
          <div style={sectionTitle}>Spend by value tier</div>
          {kpis.total === 0 ? (
            <span style={{ color: TEXT_MUTED, fontSize: 13 }}>No requisitions found.</span>
          ) : (
            <VerticalBarChart data={tierDistribution} />
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={sectionCard}>
          <div style={sectionTitle}>Risk mix</div>
          <span style={{ fontSize: 12, color: TEXT_MUTED }}>Includes open requisitions only (excludes Rejected and Received).</span>
          {riskMixTotal === 0 ? (
            <span style={{ color: TEXT_MUTED, fontSize: 13 }}>No open requisitions to score.</span>
          ) : (
            <>
              <div style={{ display: 'flex', width: '100%', height: 18, borderRadius: 999, overflow: 'hidden', background: SURFACE_MUTED }}>
                {riskMix.map((r) => (
                  <span
                    key={r.label}
                    style={{ background: r.color, flexGrow: r.count > 0 ? r.count : 0, flexBasis: 0, minWidth: r.count > 0 ? 4 : 0 }}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {riskMix.map((r) => (
                  <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: TEXT_PRIMARY }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: r.color }} />
                    {r.label} ({r.count})
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

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
      </div>

      <div style={sectionCard}>
        <div style={sectionTitle}>Requisitions submitted by month</div>
        {monthlyTrend.length === 0 ? (
          <span style={{ color: TEXT_MUTED, fontSize: 13 }}>No submission dates recorded yet.</span>
        ) : (
          <VerticalBarChart data={monthlyTrend} height={140} />
        )}
      </div>

      <div style={sectionCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={sectionTitle}>Pending approval ({filteredPending.length})</div>
          <input
            placeholder="Search requisition #"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: '6px 10px', fontSize: 13, minWidth: 220 }}
          />
        </div>
        {filteredPending.length === 0 ? (
          <span style={{ color: TEXT_MUTED, fontSize: 13 }}>No pending requisitions match the current search.</span>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: SURFACE_MUTED, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.03em', color: TEXT_MUTED }}>
                  <th style={{ textAlign: 'left', padding: '8px 10px' }}>Requisition #</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px' }}>Value tier</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px' }}>Total value</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px' }}>Risk</th>
                </tr>
              </thead>
              <tbody>
                {filteredPending.map((r) => {
                  const statusMeta = STATUS_META.find((m) => m.value === (r.wksp_status as unknown as number));
                  const riskMeta = getRiskLevelMeta(r.wksp_riskscore !== undefined ? (r.wksp_risklevel as unknown as number) : undefined);
                  return (
                    <tr key={r.wksp_requisitionid} style={{ borderTop: `1px solid ${BORDER}` }}>
                      <td style={{ padding: '8px 10px' }}>{r.wksp_requisitionnumber}</td>
                      <td style={{ padding: '8px 10px' }}>{getValueTierMeta(r.wksp_valuetier as unknown as number).label}</td>
                      <td style={{ padding: '8px 10px' }}>{formatCurrency(r.wksp_totalvalue)}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span
                          style={{
                            background: statusMeta?.color ?? TEXT_MUTED,
                            color: '#fff',
                            borderRadius: 999,
                            padding: '2px 10px',
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {statusMeta?.label ?? 'Unknown'}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        {r.wksp_riskscore !== undefined ? (
                          <span
                            style={{
                              background: riskMeta.color,
                              color: riskMeta.value === 100000001 ? BRAND_NAVY : '#fff',
                              borderRadius: 999,
                              padding: '2px 10px',
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            {r.wksp_riskscore}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
