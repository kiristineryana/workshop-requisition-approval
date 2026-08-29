import { useState } from 'react';
import { BRAND_NAVY, BRAND_RED, WHITE, FONT_BODY } from './theme';
import { RequisitionIcon, SupplierIcon, ApprovalHistoryIcon, DashboardIcon, ClockPendingIcon } from './components/icons';
import { DashboardPage } from './pages/DashboardPage';
import { RequisitionListPage } from './pages/RequisitionListPage';
import { RequisitionDetailPage } from './pages/RequisitionDetailPage';
import { PendingApprovalPage } from './pages/PendingApprovalPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { ApprovalHistoryPage } from './pages/ApprovalHistoryPage';

type NavKey = 'requisitions' | 'pendingApproval' | 'suppliers' | 'approvalHistory' | 'dashboard';

const NAV_ITEMS: { key: NavKey; label: string; icon: (color: string) => React.ReactNode }[] = [
  { key: 'requisitions', label: 'Requisitions', icon: (c) => <RequisitionIcon color={c} /> },
  { key: 'pendingApproval', label: 'Pending Approval', icon: (c) => <ClockPendingIcon color={c} /> },
  { key: 'suppliers', label: 'Suppliers', icon: (c) => <SupplierIcon color={c} /> },
  { key: 'approvalHistory', label: 'Approval History', icon: (c) => <ApprovalHistoryIcon color={c} /> },
  { key: 'dashboard', label: 'Dashboard', icon: (c) => <DashboardIcon color={c} /> },
];

function App() {
  const [active, setActive] = useState<NavKey>('dashboard');
  // Lifted above the Requisitions section so Approval History can deep-link into a specific
  // requisition's detail view (switches nav to Requisitions and preselects it in one action).
  const [requisitionDetailId, setRequisitionDetailId] = useState<string | null>(null);

  function openRequisition(id: string) {
    setRequisitionDetailId(id);
    setActive('requisitions');
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', fontFamily: FONT_BODY }}>
      <aside
        style={{
          width: 220,
          flexShrink: 0,
          background: BRAND_NAVY,
          color: WHITE,
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 0',
        }}
      >
        <div style={{ padding: '0 20px 20px', fontSize: 16, fontWeight: 700 }}>Workshop Requisitions</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map((item) => {
            const isActive = item.key === active;
            return (
              <button
                key={item.key}
                onClick={() => setActive(item.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 20px',
                  border: 'none',
                  background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                  borderLeft: isActive ? `3px solid ${BRAND_RED}` : '3px solid transparent',
                  color: isActive ? WHITE : 'rgba(255,255,255,0.75)',
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {item.icon(isActive ? WHITE : 'rgba(255,255,255,0.75)')}
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          background: '#FAFAFB',
          padding: 28,
          boxSizing: 'border-box',
        }}
      >
        {active === 'dashboard' && (
          <DashboardPage onNavigateToPending={() => setActive('pendingApproval')} onOpenRequisition={openRequisition} />
        )}
        {active === 'requisitions' &&
          (requisitionDetailId ? (
            <RequisitionDetailPage
              requisitionId={requisitionDetailId}
              onBack={() => setRequisitionDetailId(null)}
              onNavigate={(id) => setRequisitionDetailId(id)}
            />
          ) : (
            <RequisitionListPage onSelect={(id) => setRequisitionDetailId(id)} />
          ))}
        {active === 'pendingApproval' && <PendingApprovalPage />}
        {active === 'suppliers' && <SuppliersPage />}
        {active === 'approvalHistory' && <ApprovalHistoryPage onOpenRequisition={openRequisition} />}
      </main>
    </div>
  );
}

export default App;
