import { useEffect, useMemo, useState } from 'react';
import { Wksp_suppliersService } from '../generated/services/Wksp_suppliersService';
import type { Wksp_suppliers, Wksp_suppliersBase } from '../generated/models/Wksp_suppliersModel';
import { BRAND_NAVY, BRAND_RED, SURFACE_MUTED, TEXT_MUTED, TEXT_PRIMARY, BORDER, WHITE, FONT_DISPLAY } from '../theme';
import { getContractStatusMeta } from '../lib/choiceMeta';
import { Pill } from '../components/Pill';
import { PlusIcon, RefreshIcon, SearchIcon, SupplierIcon } from '../components/icons';

type SupplierForm = {
  name: string;
  contact: string;
  email: string;
  phone: string;
  contractStatus: number;
};

const EMPTY_FORM: SupplierForm = { name: '', contact: '', email: '', phone: '', contractStatus: 100000000 };

function toForm(s: Wksp_suppliers): SupplierForm {
  return {
    name: s.wksp_suppliername ?? '',
    contact: s.wksp_contactname ?? '',
    email: s.wksp_email ?? '',
    phone: s.wksp_phone ?? '',
    contractStatus: (s.wksp_contractstatus as unknown as number) ?? 100000000,
  };
}

export function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Wksp_suppliers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Wksp_suppliers | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<SupplierForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  async function handleSaveSupplier() {
    if (!form.name.trim()) {
      setFormError('Supplier name is required.');
      return;
    }
    setSaving(true);
    setFormError(null);
    const payload: Partial<Omit<Wksp_suppliersBase, 'wksp_supplierid'>> = {
      wksp_suppliername: form.name.trim(),
      wksp_contactname: form.contact.trim() || undefined,
      wksp_email: form.email.trim() || undefined,
      wksp_phone: form.phone.trim() || undefined,
      wksp_contractstatus: form.contractStatus as never,
    };
    const result = editing
      ? await Wksp_suppliersService.update(editing.wksp_supplierid, payload)
      : await Wksp_suppliersService.create({ statecode: 0 as never, ...payload });
    setSaving(false);
    if (result.success) {
      setModalOpen(false);
      setReloadKey((k) => k + 1);
    } else {
      setFormError(result.error?.message ?? 'Could not save supplier.');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: BRAND_NAVY }}>Suppliers</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: TEXT_MUTED }}>
            Vendor directory referenced by requisitions and line items — maintained by Procurement.
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
            onClick={() => {
              setEditing(null);
              setForm(EMPTY_FORM);
              setFormError(null);
              setModalOpen(true);
            }}
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
              cursor: 'pointer',
            }}
          >
            <PlusIcon size={14} color={WHITE} />
            New Supplier
          </button>
        </div>
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
                  <th style={{ textAlign: 'right', padding: '10px 14px' }}></th>
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
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            setEditing(s);
                            setForm(toForm(s));
                            setFormError(null);
                            setModalOpen(true);
                          }}
                          style={{
                            border: `1px solid ${BORDER}`,
                            background: WHITE,
                            borderRadius: 6,
                            padding: '5px 12px',
                            fontSize: 12,
                            fontWeight: 600,
                            color: TEXT_PRIMARY,
                            cursor: 'pointer',
                          }}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(20,20,35,.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: WHITE, borderRadius: 12, padding: 24, width: 420, maxWidth: '90vw', display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <div style={{ fontSize: 17, fontWeight: 700, color: BRAND_NAVY }}>{editing ? 'Edit supplier' : 'New supplier'}</div>

            {formError && (
              <div style={{ background: '#FFF4F5', color: BRAND_RED, padding: 10, borderRadius: 8, fontSize: 12.5 }}>{formError}</div>
            )}

            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, color: TEXT_MUTED }}>
              Supplier name *
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                style={{ border: `1px solid ${BORDER}`, borderRadius: 6, padding: '8px 10px', fontSize: 13 }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, color: TEXT_MUTED }}>
              Contact name
              <input
                value={form.contact}
                onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
                style={{ border: `1px solid ${BORDER}`, borderRadius: 6, padding: '8px 10px', fontSize: 13 }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, color: TEXT_MUTED }}>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                style={{ border: `1px solid ${BORDER}`, borderRadius: 6, padding: '8px 10px', fontSize: 13 }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, color: TEXT_MUTED }}>
              Phone
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                style={{ border: `1px solid ${BORDER}`, borderRadius: 6, padding: '8px 10px', fontSize: 13 }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, color: TEXT_MUTED }}>
              Contract status
              <select
                value={form.contractStatus}
                onChange={(e) => setForm((f) => ({ ...f, contractStatus: Number(e.target.value) }))}
                style={{ border: `1px solid ${BORDER}`, borderRadius: 6, padding: '8px 10px', fontSize: 13, background: WHITE }}
              >
                <option value={100000000}>On-Contract</option>
                <option value={100000001}>Off-Contract</option>
              </select>
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <button
                onClick={() => setModalOpen(false)}
                style={{ border: `1px solid ${BORDER}`, background: WHITE, borderRadius: 6, padding: '9px 16px', fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSupplier}
                disabled={saving}
                style={{
                  background: BRAND_RED,
                  color: WHITE,
                  border: 'none',
                  borderRadius: 6,
                  padding: '9px 18px',
                  fontFamily: FONT_DISPLAY,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: saving ? 'default' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
