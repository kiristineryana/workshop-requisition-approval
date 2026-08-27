import { useEffect, useMemo, useState } from 'react';
import { Wksp_suppliersService } from '../generated/services/Wksp_suppliersService';
import type { Wksp_suppliers } from '../generated/models/Wksp_suppliersModel';
import { BRAND_NAVY, BRAND_RED, SURFACE_MUTED, TEXT_MUTED, TEXT_PRIMARY, BORDER, WHITE } from '../theme';
import { getContractStatusMeta } from '../lib/choiceMeta';
import { Pill } from '../components/Pill';
import { RefreshIcon, SearchIcon, SupplierIcon } from '../components/icons';

export function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Wksp_suppliers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Wksp_suppliersService.getAll({
      select: ['wksp_supplierid', 'wksp_suppliername', 'wksp_contactname', 'wksp_email', 'wksp_phone', 'wksp_contractstatus'],
      orderBy: ['wksp_suppliername asc'],
      maxPageSize: 500,
    }).then((result) => {
      if (cancelled) return;
      if (result.success) {
        setSuppliers(result.data ?? []);
      } else {
        setError(result.error?.message ?? 'Unable to load suppliers.');
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return suppliers;
    return suppliers.filter(
      (s) =>
        (s.wksp_suppliername ?? '').toLowerCase().includes(term) ||
        (s.wksp_contactname ?? '').toLowerCase().includes(term) ||
        (s.wksp_email ?? '').toLowerCase().includes(term),
    );
  }, [suppliers, search]);

  const onContractCount = suppliers.filter((s) => (s.wksp_contractstatus as unknown as number) === 100000000).length;
  const offContractCount = suppliers.filter((s) => (s.wksp_contractstatus as unknown as number) === 100000001).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: BRAND_NAVY }}>Suppliers</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: TEXT_MUTED }}>
            Vendor directory referenced by requisitions and line items — read-only here; maintained by
            Procurement in the back-office app.
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

      {!loading && suppliers.length > 0 && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 16px', fontSize: 13, color: TEXT_PRIMARY }}>
            <strong style={{ color: BRAND_NAVY }}>{suppliers.length}</strong> total
          </div>
          <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 16px', fontSize: 13, color: TEXT_PRIMARY }}>
            <strong style={{ color: '#1F9D45' }}>{onContractCount}</strong> on-contract
          </div>
          <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 16px', fontSize: 13, color: TEXT_PRIMARY }}>
            <strong style={{ color: '#8A6100' }}>{offContractCount}</strong> off-contract
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '6px 10px', maxWidth: 320, background: WHITE }}>
        <SearchIcon size={14} color={TEXT_MUTED} />
        <input
          placeholder="Search name, contact, email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ border: 'none', outline: 'none', fontSize: 13, flex: 1, background: 'transparent' }}
        />
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: TEXT_MUTED }}>Loading suppliers…</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: TEXT_MUTED, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12 }}>
          No suppliers match this search.
        </div>
      ) : (
        <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: SURFACE_MUTED, textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em', color: TEXT_MUTED }}>
                  <th style={{ textAlign: 'left', padding: '10px 14px' }}>Supplier</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px' }}>Contact</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px' }}>Phone</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px' }}>Contract</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const contractMeta = getContractStatusMeta(s.wksp_contractstatus as unknown as number);
                  return (
                    <tr key={s.wksp_supplierid} style={{ borderTop: `1px solid ${BORDER}` }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: BRAND_NAVY }}>
                          <SupplierIcon size={16} color={BRAND_NAVY} />
                          {s.wksp_suppliername ?? '—'}
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', color: TEXT_PRIMARY }}>{s.wksp_contactname ?? '—'}</td>
                      <td style={{ padding: '10px 14px', color: TEXT_PRIMARY }}>{s.wksp_email ?? '—'}</td>
                      <td style={{ padding: '10px 14px', color: TEXT_PRIMARY }}>{s.wksp_phone ?? '—'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <Pill label={contractMeta.label} bg={contractMeta.bg} fg={contractMeta.fg} outline />
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
