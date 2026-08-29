import { useEffect, useMemo, useState } from 'react';
import { Wksp_requisitionsService } from '../generated/services/Wksp_requisitionsService';
import type { Wksp_requisitions } from '../generated/models/Wksp_requisitionsModel';
import { BRAND_NAVY, BRAND_RED, SURFACE_MUTED, TEXT_MUTED, TEXT_PRIMARY, BORDER, WHITE, FONT_DISPLAY } from '../theme';
import {
  getStatusMeta,
  getStatusPillStyle,
  getValueTierMeta,
  getRiskLevelMeta,
  formatCurrency,
  formatDate,
  PENDING_STATUS_VALUES,
} from '../lib/choiceMeta';
import { Pill } from '../components/Pill';
import { PlusIcon, RefreshIcon, SearchIcon } from '../components/icons';
import { useUserDirectory } from '../lib/users';

type ViewKey = 'mine' | 'pending' | 'approvedMonth' | 'rejected' | 'all';

const VIEWS: { key: ViewKey; label: string }[] = [
  { key: 'mine', label: 'My Requisitions' },
  { key: 'pending', label: 'Pending Approval' },
  { key: 'approvedMonth', label: 'Approved This Month' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All Requisitions' },
];

export function RequisitionListPage({ onSelect }: { onSelect: (id: string) => void }) {
  const [records, setRecords] = useState<Wksp_requisitions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [view, setView] = useState<ViewKey>('all');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const { nameById, currentUserId } = useUserDirectory();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Wksp_requisitionsService.getAll({
      select: [
        'wksp_requisitionid',
        'wksp_requisitionnumber',
        'wksp_status',
        'wksp_valuetier',
        'wksp_totalvalue',
        'wksp_datesubmitted',
        'wksp_risklevel',
        'wksp_riskscore',
        'wksp_jobcardnumber',
        'wksp_customername',
        'wksp_branchworkshop',
        '_wksp_requesterid_value',
        '_wksp_currentapproverid_value',
      ],
      orderBy: ['wksp_datesubmitted desc'],
      maxPageSize: 500,
    }).then((result) => {
      if (cancelled) return;
      if (result.success) {
        setRecords(result.data ?? []);
      } else {
        setError(result.error?.message ?? 'Unable to load requisitions.');
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const now = useMemo(() => new Date(), []);

  const viewFiltered = useMemo(() => {
    switch (view) {
      case 'mine':
        return currentUserId ? records.filter((r) => r._wksp_requesterid_value === currentUserId) : records;
      case 'pending':
        return records.filter((r) => PENDING_STATUS_VALUES.includes(r.wksp_status as unknown as number));
      case 'approvedMonth':
        return records.filter((r) => {
          if ((r.wksp_status as unknown as number) !== 100000003) return false;
          if (!r.wksp_datesubmitted) return false;
          const d = new Date(r.wksp_datesubmitted);
          return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        });
      case 'rejected':
        return records.filter((r) => (r.wksp_status as unknown as number) === 100000004);
      case 'all':
      default:
        return records;
    }
  }, [records, view, currentUserId, now]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return viewFiltered;
    return viewFiltered.filter(
      (r) =>
        (r.wksp_requisitionnumber ?? '').toLowerCase().includes(term) ||
        (r.wksp_jobcardnumber ?? '').toLowerCase().includes(term) ||
        (r.wksp_customername ?? '').toLowerCase().includes(term),
    );
  }, [viewFiltered, search]);

  async function handleCreate() {
    if (!currentUserId || creating) return;
    setCreating(true);
    setError(null);
    const result = await Wksp_requisitionsService.create({
      statecode: 0 as never,
      wksp_status: 100000000 as never,
      'wksp_RequesterId@odata.bind': `/systemusers(${currentUserId})`,
    });
    setCreating(false);
    if (result.success && result.data) {
      onSelect(result.data.wksp_requisitionid);
    } else {
      setError(result.error?.message ?? 'Could not create requisition.');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: BRAND_NAVY }}>Requisitions</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: TEXT_MUTED }}>
            Workshop purchase requisitions — browse, filter, and open a record to view or submit it.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
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
          <button
            onClick={handleCreate}
            disabled={!currentUserId || creating}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              border: 'none',
              background: BRAND_RED,
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: FONT_DISPLAY,
              color: WHITE,
              cursor: !currentUserId || creating ? 'default' : 'pointer',
              opacity: !currentUserId || creating ? 0.6 : 1,
            }}
          >
            <PlusIcon size={14} color={WHITE} />
            {creating ? 'Creating…' : 'New Requisition'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#FFF4F5', color: BRAND_RED, padding: 12, borderRadius: 8, fontSize: 13 }}>{error}</div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, background: SURFACE_MUTED, borderRadius: 8, padding: 3 }}>
          {VIEWS.map((v) => {
            const active = v.key === view;
            return (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                style={{
                  border: 'none',
                  borderRadius: 6,
                  padding: '7px 12px',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: active ? WHITE : 'transparent',
                  color: active ? BRAND_NAVY : TEXT_MUTED,
                  boxShadow: active ? '0 1px 2px rgba(0,0,0,.08)' : 'none',
                }}
              >
                {v.label}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '6px 10px', minWidth: 240 }}>
          <SearchIcon size={14} color={TEXT_MUTED} />
          <input
            placeholder="Search req #, job card, customer"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: 13, flex: 1, background: 'transparent' }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: TEXT_MUTED }}>Loading requisitions…</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: TEXT_MUTED, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12 }}>
          No requisitions match this view.
        </div>
      ) : (
        <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: SURFACE_MUTED, textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em', color: TEXT_MUTED }}>
                  <th style={{ textAlign: 'left', padding: '10px 14px' }}>Requisition</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px' }}>Value tier</th>
                  <th style={{ textAlign: 'right', padding: '10px 14px' }}>Total value</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px' }}>Requester</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px' }}>Approver</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px' }}>Submitted</th>
                  <th style={{ textAlign: 'center', padding: '10px 14px' }}>Risk</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const statusMeta = getStatusMeta(r.wksp_status as unknown as number);
                  const statusPillStyle = getStatusPillStyle(r.wksp_status as unknown as number);
                  const tierMeta = getValueTierMeta(r.wksp_valuetier as unknown as number);
                  const riskMeta = getRiskLevelMeta(r.wksp_risklevel as unknown as number);
                  return (
                    <tr
                      key={r.wksp_requisitionid}
                      onClick={() => onSelect(r.wksp_requisitionid)}
                      style={{ borderTop: `1px solid ${BORDER}`, cursor: 'pointer' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = SURFACE_MUTED)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 700, color: BRAND_NAVY }}>{r.wksp_requisitionnumber}</div>
                        <div style={{ fontSize: 11.5, color: TEXT_MUTED }}>
                          {r.wksp_jobcardnumber ?? '—'}
                          {r.wksp_customername ? ` · ${r.wksp_customername}` : ''}
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <Pill label={statusMeta.label.toUpperCase()} {...statusPillStyle} />
                      </td>
                      <td style={{ padding: '10px 14px', color: TEXT_PRIMARY }}>{tierMeta.label}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: TEXT_PRIMARY }}>
                        {formatCurrency(r.wksp_totalvalue)}
                      </td>
                      <td style={{ padding: '10px 14px', color: TEXT_PRIMARY }}>
                        {(r._wksp_requesterid_value && nameById.get(r._wksp_requesterid_value)) ?? '—'}
                      </td>
                      <td style={{ padding: '10px 14px', color: TEXT_PRIMARY }}>
                        {(r.wksp_status as unknown as number) === 100000000
                          ? '—'
                          : (r._wksp_currentapproverid_value && nameById.get(r._wksp_currentapproverid_value)) ?? '—'}
                      </td>
                      <td style={{ padding: '10px 14px', color: TEXT_MUTED }}>{formatDate(r.wksp_datesubmitted)}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        {r.wksp_riskscore !== undefined && r.wksp_riskscore !== null ? (
                          <Pill label={String(r.wksp_riskscore)} bg={riskMeta.color} fg={riskMeta.value === 100000001 ? BRAND_NAVY : WHITE} />
                        ) : (
                          <span style={{ color: TEXT_MUTED }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
