import { useEffect, useMemo, useState } from 'react';
import { Wksp_requisitionsService } from '../generated/services/Wksp_requisitionsService';
import { Wksp_requisitionlineitemsService } from '../generated/services/Wksp_requisitionlineitemsService';
import { Wksp_approvalhistoriesService } from '../generated/services/Wksp_approvalhistoriesService';
import type { Wksp_requisitions } from '../generated/models/Wksp_requisitionsModel';
import type { Wksp_requisitionlineitems } from '../generated/models/Wksp_requisitionlineitemsModel';
import type { Wksp_approvalhistories } from '../generated/models/Wksp_approvalhistoriesModel';
import { BRAND_NAVY, BRAND_RED, GOLD, GREEN, SURFACE_MUTED, TEXT_MUTED, TEXT_PRIMARY, BORDER, WHITE, FONT_DISPLAY } from '../theme';
import {
  getValueTierMeta,
  getRiskLevelMeta,
  getApprovalActionLabel,
  getApprovalLevelLabel,
  formatCurrency,
  formatDate,
} from '../lib/choiceMeta';
import { Pill } from '../components/Pill';
import { RefreshIcon, AlertTriangleIcon } from '../components/icons';
import { useUserDirectory } from '../lib/users';
import { resolveFinanceApproverId } from '../lib/approverResolution';

const HIGH_TIER = 100000002; // Above 10,000 AED
const MANAGER_LEVEL = 100000001;
const FINANCE_LEVEL = 100000002;
const SUPERVISOR_LEVEL = 100000000;
const APPROVED = 100000000;
const REJECTED_STATUS = 100000004;
const APPROVED_STATUS = 100000003;
const IN_APPROVAL_STATUS = 100000002;

function formatAge(hours: number | undefined | null): { label: string; color: string } {
  if (hours === undefined || hours === null) return { label: '—', color: TEXT_MUTED };
  const days = Math.floor(hours / 24);
  const rem = Math.round(hours % 24);
  const label = days > 0 ? `${days}d ${rem}h` : `${Math.round(hours)}h`;
  const color = hours >= 48 ? BRAND_RED : hours >= 24 ? GOLD : TEXT_MUTED;
  return { label, color };
}

// For the Above-10,000 tier the Manager decides first, then Finance. Derived from whether a
// Manager-level history row already exists for this requisition — not from approver identity —
// because in a single-tester environment (or any org where one person holds multiple approval
// roles) the three environment variables can all resolve to the same systemuserid, making identity
// comparison unable to tell the two stages apart. A record only reaches this page while still
// "In Approval" if any prior decision at this tier was an approval (a rejection would already have
// moved it to Rejected), so "has a Manager-level history row" reliably means "Manager already
// approved, this decision is Finance's".
function currentApprovalLevel(req: Wksp_requisitions, history: Wksp_approvalhistories[]): number {
  const tier = req.wksp_valuetier as unknown as number;
  if (tier === HIGH_TIER) {
    const managerAlreadyDecided = history.some((h) => (h.wksp_approvallevel as unknown as number) === MANAGER_LEVEL);
    return managerAlreadyDecided ? FINANCE_LEVEL : MANAGER_LEVEL;
  }
  if (tier === 100000001) return MANAGER_LEVEL;
  return SUPERVISOR_LEVEL;
}

export function PendingApprovalPage() {
  const [records, setRecords] = useState<Wksp_requisitions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lineItems, setLineItems] = useState<Wksp_requisitionlineitems[]>([]);
  const [history, setHistory] = useState<Wksp_approvalhistories[]>([]);
  const [duplicateOf, setDuplicateOf] = useState<Wksp_requisitions | null>(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [comment, setComment] = useState('');
  const [deciding, setDeciding] = useState(false);
  const [banner, setBanner] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const { nameById, currentUserId, loading: directoryLoading } = useUserDirectory();

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
        'wksp_riskscore',
        'wksp_risklevel',
        'wksp_jobcardnumber',
        'wksp_customername',
        'wksp_branchworkshop',
        'wksp_ageinapprovalhours',
        'wksp_datesubmitted',
        'wksp_vehiclemodelyear',
        'wksp_justification',
        '_wksp_requesterid_value',
        '_wksp_currentapproverid_value',
        '_wksp_duplicateofid_value',
      ],
      filter: `wksp_status eq ${IN_APPROVAL_STATUS}`,
      orderBy: ['wksp_ageinapprovalhours desc'],
      maxPageSize: 500,
    }).then((result) => {
      if (cancelled) return;
      if (result.success) {
        setRecords(result.data ?? []);
      } else {
        setError(result.error?.message ?? 'Unable to load pending approvals.');
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const myQueue = useMemo(
    () => (currentUserId ? records.filter((r) => r._wksp_currentapproverid_value === currentUserId) : []),
    [records, currentUserId],
  );

  useEffect(() => {
    if (!selectedId) {
      setLineItems([]);
      setHistory([]);
      setDuplicateOf(null);
      return;
    }
    let cancelled = false;
    setPanelLoading(true);
    setComment('');
    const duplicateOfId = records.find((r) => r.wksp_requisitionid === selectedId)?._wksp_duplicateofid_value;
    Promise.all([
      Wksp_requisitionlineitemsService.getAll({
        filter: `_wksp_parentrequisitionid_value eq ${selectedId}`,
        maxPageSize: 200,
      }),
      Wksp_approvalhistoriesService.getAll({
        filter: `_wksp_requisitionid_value eq ${selectedId}`,
        orderBy: ['wksp_decisiondate asc'],
        maxPageSize: 50,
      }),
      duplicateOfId
        ? Wksp_requisitionsService.get(duplicateOfId, { select: ['wksp_requisitionid', 'wksp_requisitionnumber', 'wksp_status'] })
        : Promise.resolve(null),
    ]).then(([lineResult, historyResult, dupResult]) => {
      if (cancelled) return;
      setLineItems(lineResult.success ? lineResult.data ?? [] : []);
      setHistory(historyResult.success ? historyResult.data ?? [] : []);
      setDuplicateOf(dupResult && dupResult.success ? dupResult.data ?? null : null);
      setPanelLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedId, records]);

  const selected = myQueue.find((r) => r.wksp_requisitionid === selectedId) ?? null;
  const subtotal = useMemo(
    () => lineItems.reduce((sum, li) => sum + (li.wksp_linetotal ?? li.wksp_quantity * li.wksp_unitprice), 0),
    [lineItems],
  );

  async function handleDecision(action: 'approve' | 'reject') {
    if (!selected || !currentUserId) return;
    setDeciding(true);
    setBanner(null);

    const level = currentApprovalLevel(selected, history);
    const historyResult = await Wksp_approvalhistoriesService.create({
      statecode: 0 as never,
      wksp_approvallevel: level as never,
      wksp_action: (action === 'approve' ? APPROVED : 100000001) as never,
      wksp_comment: comment,
      wksp_decisiondate: new Date().toISOString(),
      'wksp_RequisitionId@odata.bind': `/wksp_requisitions(${selected.wksp_requisitionid})`,
      'wksp_ApproverId@odata.bind': `/systemusers(${currentUserId})`,
    });
    if (!historyResult.success) {
      setDeciding(false);
      setBanner({ kind: 'error', text: historyResult.error?.message ?? 'Could not record the decision.' });
      return;
    }

    if (action === 'reject') {
      const result = await Wksp_requisitionsService.update(selected.wksp_requisitionid, {
        wksp_status: REJECTED_STATUS as never,
      });
      setDeciding(false);
      if (result.success) {
        setBanner({ kind: 'success', text: `${selected.wksp_requisitionnumber} rejected.` });
        setSelectedId(null);
        setReloadKey((k) => k + 1);
      } else {
        setBanner({ kind: 'error', text: result.error?.message ?? 'Rejection failed to save.' });
      }
      return;
    }

    // Approve: advance to Finance (high tier, Manager stage only) or finalize.
    if ((selected.wksp_valuetier as unknown as number) === HIGH_TIER && level === MANAGER_LEVEL) {
      const finance = await resolveFinanceApproverId();
      if (!finance) {
        setDeciding(false);
        setBanner({ kind: 'error', text: 'Approved and logged, but could not resolve the Finance Controller to advance to. Check the Finance environment variable.' });
        setReloadKey((k) => k + 1);
        return;
      }
      const result = await Wksp_requisitionsService.update(selected.wksp_requisitionid, {
        'wksp_CurrentApproverId@odata.bind': `/systemusers(${finance.userId})`,
      });
      setDeciding(false);
      if (result.success) {
        setBanner({ kind: 'success', text: `${selected.wksp_requisitionnumber} approved — advanced to Finance Controller.` });
        setSelectedId(null);
        setReloadKey((k) => k + 1);
      } else {
        setBanner({ kind: 'error', text: result.error?.message ?? 'Advance to Finance failed to save.' });
      }
    } else {
      const result = await Wksp_requisitionsService.update(selected.wksp_requisitionid, {
        wksp_status: APPROVED_STATUS as never,
      });
      setDeciding(false);
      if (result.success) {
        setBanner({ kind: 'success', text: `${selected.wksp_requisitionnumber} approved.` });
        setSelectedId(null);
        setReloadKey((k) => k + 1);
      } else {
        setBanner({ kind: 'error', text: result.error?.message ?? 'Approval failed to save.' });
      }
    }
  }

  const isLoading = loading || directoryLoading;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: BRAND_NAVY }}>Pending approval</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: TEXT_MUTED }}>
            Requisitions currently assigned to you for an approval decision.
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

      {isLoading ? (
        <div style={{ padding: 40, textAlign: 'center', color: TEXT_MUTED }}>Loading pending approvals…</div>
      ) : myQueue.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: TEXT_MUTED, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12 }}>
          Nothing waiting on your decision right now.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: SURFACE_MUTED, textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em', color: TEXT_MUTED }}>
                    <th style={{ textAlign: 'left', padding: '10px 14px' }}>Requisition</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px' }}>Requester</th>
                    <th style={{ textAlign: 'right', padding: '10px 14px' }}>Value</th>
                    <th style={{ textAlign: 'right', padding: '10px 14px' }}>Age</th>
                    <th style={{ textAlign: 'center', padding: '10px 14px' }}>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {myQueue.map((r) => {
                    const tierMeta = getValueTierMeta(r.wksp_valuetier as unknown as number);
                    const riskMeta = getRiskLevelMeta(r.wksp_risklevel as unknown as number);
                    const age = formatAge(r.wksp_ageinapprovalhours);
                    const isSelected = r.wksp_requisitionid === selectedId;
                    return (
                      <tr
                        key={r.wksp_requisitionid}
                        onClick={() => setSelectedId(r.wksp_requisitionid)}
                        style={{
                          borderTop: `1px solid ${BORDER}`,
                          cursor: 'pointer',
                          background: isSelected ? SURFACE_MUTED : 'transparent',
                        }}
                      >
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontWeight: 700, color: BRAND_NAVY }}>{r.wksp_requisitionnumber}</div>
                          <div style={{ fontSize: 11.5, color: TEXT_MUTED }}>
                            In Approval · {tierMeta.approver}
                            {r.wksp_jobcardnumber ? ` · ${r.wksp_jobcardnumber}` : ''}
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', color: TEXT_PRIMARY }}>
                          {(r._wksp_requesterid_value && nameById.get(r._wksp_requesterid_value)) ?? '—'}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: TEXT_PRIMARY }}>
                          {formatCurrency(r.wksp_totalvalue)}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: age.color }}>{age.label}</td>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 0 }}>
            {!selected ? (
              <div style={{ padding: 24, textAlign: 'center', color: TEXT_MUTED, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, fontSize: 13 }}>
                Select a requisition to review and decide.
              </div>
            ) : panelLoading ? (
              <div style={{ padding: 24, textAlign: 'center', color: TEXT_MUTED, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12 }}>
                Loading…
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: BRAND_NAVY }}>{selected.wksp_requisitionnumber}</div>
                  {selected.wksp_riskscore !== undefined && selected.wksp_riskscore !== null && (
                    <Pill
                      label={`RISK ${selected.wksp_riskscore} · ${getRiskLevelMeta(selected.wksp_risklevel as unknown as number).label.toUpperCase()}`}
                      bg={getRiskLevelMeta(selected.wksp_risklevel as unknown as number).color}
                      fg={(selected.wksp_risklevel as unknown as number) === 100000001 ? BRAND_NAVY : WHITE}
                    />
                  )}
                </div>
                <div style={{ fontSize: 11.5, lineHeight: 1.5, color: TEXT_MUTED }}>
                  Raised by {(selected._wksp_requesterid_value && nameById.get(selected._wksp_requesterid_value)) ?? '—'} ·{' '}
                  {formatDate(selected.wksp_datesubmitted)}
                  {selected.wksp_branchworkshop ? ` · ${selected.wksp_branchworkshop}` : ''}
                  {selected.wksp_jobcardnumber ? ` · ${selected.wksp_jobcardnumber}` : ''}
                  {selected.wksp_vehiclemodelyear ? ` · ${selected.wksp_vehiclemodelyear}` : ''}
                </div>

                <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, background: WHITE, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 13px', background: SURFACE_MUTED, fontSize: 10.5, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    <span>Line item</span>
                    <span>AED</span>
                  </div>
                  {lineItems.length === 0 ? (
                    <div style={{ padding: 13, fontSize: 12, color: TEXT_MUTED }}>No line items.</div>
                  ) : (
                    lineItems.map((li) => (
                      <div
                        key={li.wksp_requisitionlineitemid}
                        style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '11px 13px', borderTop: `1px solid ${BORDER}`, fontSize: 12, color: TEXT_PRIMARY }}
                      >
                        <span>{li.wksp_itemdescription}</span>
                        <strong style={{ fontWeight: 700 }}>{(li.wksp_linetotal ?? li.wksp_quantity * li.wksp_unitprice).toFixed(2)}</strong>
                      </div>
                    ))
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '12px 13px', borderTop: `1px solid ${BORDER}`, background: '#FCFCFD', fontSize: 13, fontWeight: 700, color: BRAND_NAVY }}>
                    <span>Total</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                </div>

                {duplicateOf && (
                  <div style={{ border: `1px solid ${GOLD}`, borderRadius: 8, padding: 14, background: '#FFFBF2' }}>
                    <div style={{ display: 'flex', gap: 9 }}>
                      <AlertTriangleIcon size={18} color="#8A6100" />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#8A6100' }}>Duplicate warning</div>
                        <div style={{ fontSize: 11, lineHeight: 1.45, color: '#7A5C1E', marginTop: 4 }}>
                          {duplicateOf.wksp_requisitionnumber} may be a duplicate of this request.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selected.wksp_justification && (
                  <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, background: WHITE, padding: 13 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.03em', color: TEXT_MUTED, textTransform: 'uppercase', marginBottom: 8 }}>
                      Justification
                    </div>
                    <div style={{ fontSize: 11.5, lineHeight: 1.55, color: TEXT_PRIMARY }}>{selected.wksp_justification}</div>
                  </div>
                )}

                {history.length > 0 && (
                  <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, background: WHITE, padding: 13 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.03em', color: TEXT_MUTED, textTransform: 'uppercase', marginBottom: 8 }}>
                      Approval history
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {history.map((h) => {
                        const approved = (h.wksp_action as unknown as number) === APPROVED;
                        return (
                          <div key={h.wksp_approvalhistoryid} style={{ borderLeft: `2px solid ${approved ? GREEN : BRAND_RED}`, paddingLeft: 9, fontSize: 11.5 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: TEXT_PRIMARY }}>
                              <span>{getApprovalLevelLabel(h.wksp_approvallevel as unknown as number)}</span>
                              <span style={{ color: approved ? GREEN : BRAND_RED }}>{getApprovalActionLabel(h.wksp_action as unknown as number)}</span>
                            </div>
                            <div style={{ color: TEXT_MUTED, fontSize: 10.5, marginTop: 2 }}>
                              {(h._wksp_approverid_value && nameById.get(h._wksp_approverid_value)) ?? '—'} · {formatDate(h.wksp_decisiondate)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <div style={{ fontSize: 11, color: TEXT_MUTED, marginBottom: 6 }}>Your comment</div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a note — recorded in Approval History"
                    style={{ minHeight: 60, width: '100%', boxSizing: 'border-box', border: `1px solid ${BORDER}`, borderRadius: 6, padding: 10, fontSize: 12, fontFamily: 'inherit', color: TEXT_PRIMARY }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 9 }}>
                  <button
                    onClick={() => handleDecision('approve')}
                    disabled={deciding}
                    style={{ flex: 1, height: 40, borderRadius: 8, border: 'none', background: BRAND_RED, color: WHITE, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 14, cursor: deciding ? 'default' : 'pointer', opacity: deciding ? 0.7 : 1 }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleDecision('reject')}
                    disabled={deciding}
                    style={{ flex: 1, height: 40, borderRadius: 8, border: `1px solid ${BRAND_RED}`, background: WHITE, color: BRAND_RED, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 14, cursor: deciding ? 'default' : 'pointer', opacity: deciding ? 0.7 : 1 }}
                  >
                    Reject
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
