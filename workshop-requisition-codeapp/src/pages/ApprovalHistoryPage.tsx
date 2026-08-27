import { useEffect, useMemo, useState } from 'react';
import { Wksp_approvalhistoriesService } from '../generated/services/Wksp_approvalhistoriesService';
import { Wksp_requisitionsService } from '../generated/services/Wksp_requisitionsService';
import type { Wksp_approvalhistories } from '../generated/models/Wksp_approvalhistoriesModel';
import { BRAND_NAVY, BRAND_RED, GREEN, SURFACE_MUTED, TEXT_MUTED, TEXT_PRIMARY, BORDER, WHITE } from '../theme';
import { getApprovalActionLabel, getApprovalLevelLabel, formatDateTime } from '../lib/choiceMeta';
import { Pill } from '../components/Pill';
import { RefreshIcon, SearchIcon } from '../components/icons';
import { useUserDirectory } from '../lib/users';

const APPROVED = 100000000;
const REJECTED = 100000001;

type ViewKey = 'all' | 'approved' | 'rejected';

const VIEWS: { key: ViewKey; label: string }[] = [
  { key: 'all', label: 'All decisions' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

export function ApprovalHistoryPage({ onOpenRequisition }: { onOpenRequisition: (id: string) => void }) {
  const [history, setHistory] = useState<Wksp_approvalhistories[]>([]);
  const [requisitionNumbers, setRequisitionNumbers] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [view, setView] = useState<ViewKey>('all');
  const [search, setSearch] = useState('');
  const { nameById, loading: directoryLoading } = useUserDirectory();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      Wksp_approvalhistoriesService.getAll({
        select: ['wksp_approvalhistoryid', 'wksp_approvalnumber', 'wksp_approvallevel', 'wksp_action', 'wksp_comment', 'wksp_decisiondate', '_wksp_requisitionid_value', '_wksp_approverid_value'],
        orderBy: ['wksp_decisiondate desc'],
        maxPageSize: 500,
      }),
      Wksp_requisitionsService.getAll({
        select: ['wksp_requisitionid', 'wksp_requisitionnumber'],
        maxPageSize: 500,
      }),
    ]).then(([historyResult, reqResult]) => {
      if (cancelled) return;
      if (historyResult.success) {
        setHistory(historyResult.data ?? []);
      } else {
        setError(historyResult.error?.message ?? 'Unable to load approval history.');
      }
      if (reqResult.success) {
        const map = new Map<string, string>();
        for (const r of reqResult.data ?? []) {
          map.set(r.wksp_requisitionid, r.wksp_requisitionnumber ?? '—');
        }
        setRequisitionNumbers(map);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const viewFiltered = useMemo(() => {
    switch (view) {
      case 'approved':
        return history.filter((h) => (h.wksp_action as unknown as number) === APPROVED);
      case 'rejected':
        return history.filter((h) => (h.wksp_action as unknown as number) === REJECTED);
      default:
        return history;
    }
  }, [history, view]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return viewFiltered;
    return viewFiltered.filter((h) => {
      const reqNumber = (requisitionNumbers.get(h._wksp_requisitionid_value ?? '') ?? '').toLowerCase();
      const approver = (h._wksp_approverid_value && nameById.get(h._wksp_approverid_value)?.toLowerCase()) ?? '';
      const comment = (h.wksp_comment ?? '').toLowerCase();
      return reqNumber.includes(term) || approver.includes(term) || comment.includes(term);
    });
  }, [viewFiltered, search, requisitionNumbers, nameById]);

  const isLoading = loading || directoryLoading;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: BRAND_NAVY }}>Approval history</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: TEXT_MUTED }}>
            Append-only audit trail of every approval decision across all requisitions.
          </p>
        </div>
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
            placeholder="Search req #, approver, comment"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: 13, flex: 1, background: 'transparent' }}
          />
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: 40, textAlign: 'center', color: TEXT_MUTED }}>Loading approval history…</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: TEXT_MUTED, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12 }}>
          No decisions match this view.
        </div>
      ) : (
        <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: SURFACE_MUTED, textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em', color: TEXT_MUTED }}>
                  <th style={{ textAlign: 'left', padding: '10px 14px' }}>Requisition</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px' }}>Level</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px' }}>Action</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px' }}>Approver</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px' }}>Comment</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px' }}>Decided</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((h) => {
                  const approved = (h.wksp_action as unknown as number) === APPROVED;
                  const reqId = h._wksp_requisitionid_value;
                  const reqNumber = (reqId && requisitionNumbers.get(reqId)) ?? '—';
                  return (
                    <tr key={h.wksp_approvalhistoryid} style={{ borderTop: `1px solid ${BORDER}` }}>
                      <td style={{ padding: '10px 14px' }}>
                        {reqId ? (
                          <button
                            onClick={() => onOpenRequisition(reqId)}
                            style={{ border: 'none', background: 'none', padding: 0, fontWeight: 700, color: BRAND_NAVY, cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            {reqNumber}
                          </button>
                        ) : (
                          <span style={{ fontWeight: 700, color: BRAND_NAVY }}>{reqNumber}</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px', color: TEXT_PRIMARY }}>{getApprovalLevelLabel(h.wksp_approvallevel as unknown as number)}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <Pill
                          label={getApprovalActionLabel(h.wksp_action as unknown as number).toUpperCase()}
                          bg={approved ? GREEN : BRAND_RED}
                          fg={WHITE}
                        />
                      </td>
                      <td style={{ padding: '10px 14px', color: TEXT_PRIMARY }}>
                        {(h._wksp_approverid_value && nameById.get(h._wksp_approverid_value)) ?? '—'}
                      </td>
                      <td style={{ padding: '10px 14px', color: TEXT_MUTED, maxWidth: 280 }}>{h.wksp_comment || '—'}</td>
                      <td style={{ padding: '10px 14px', color: TEXT_MUTED, whiteSpace: 'nowrap' }}>{formatDateTime(h.wksp_decisiondate)}</td>
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
