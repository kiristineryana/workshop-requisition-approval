# Workshop Purchase Requisition & Approval System — design

Raise, route, and approve workshop purchase requisitions with a full audit trail.

Generated from `app-spec.json` by `scripts/write-app-spec-doc.js`. **Regenerate rather than
hand-edit** — `app-spec.json` is the source of truth, so a manual edit here is lost on the next
run and silently disagrees with what actually builds.

## Environment

| Setting | Value |
|---|---|
| Environment | https://yourorg.crm.dynamics.com/ |
| Solution | WorkshopRequisitionApproval |
| Publisher prefix | wksp |
| App unique name | wksp_workshopreqapproval |

## Jobs to be done

| Persona | Job to be done | Surfaces that satisfy it |
|---|---|---|
| Requester | Raise a requisition | Requisition, Requisition Line Item |
| Requester | Track requisition status and view analytics | My Requisitions, Dashboards |
| Workshop Supervisor | Approve low-value requisitions (under 1,000 AED) | Pending Approval, Requisition, Dashboards |
| Workshop Manager | Approve mid-value requisitions and the first stage of high-value requisitions | Pending Approval, Requisition, Dashboards |
| Finance Controller | Approve the second stage of high-value requisitions (above 10,000 AED) | Pending Approval, Requisition, Dashboards |
| Procurement Officer | Process approved requisitions through Ordered and Received | All Requisitions, Requisition, Dashboards |
| Procurement Officer | Maintain the supplier list | Suppliers, Supplier |

## Data model

### Requisition `wksp_requisition`

| Column | Type | Notes |
|---|---|---|
| Requisition Number | Text | primary name, auto-number `REQ-{SEQNUM:6}` |
| Total Value | Money | — |
| Status | Choice | required; choices: Draft, Submitted, In Approval, Approved, Rejected, Ordered, Received |
| Value Tier | Choice | choices: Under 1,000 AED, 1,000-10,000 AED, Above 10,000 AED |
| Justification | Memo | — |
| Date Submitted | DateTime | — |

### Requisition Line Item `wksp_requisitionlineitem`

| Column | Type | Notes |
|---|---|---|
| Item Description | Text | primary name |
| Category | Choice | choices: Part, Tool, Sublet, Consumable, Other |
| Quantity | Integer | required |
| Unit Price | Money | required |
| Line Total | Money | — |

### Supplier `wksp_supplier`

| Column | Type | Notes |
|---|---|---|
| Supplier Name | Text | primary name |
| Contact Name | Text | — |
| Email | Text | — |
| Phone | Text | — |

### Approval History `wksp_approvalhistory`

| Column | Type | Notes |
|---|---|---|
| Approval Number | Text | primary name, auto-number `APR-{SEQNUM:6}` |
| Approval Level | Choice | required; choices: Supervisor, Manager, Finance |
| Action | Choice | required; choices: Approved, Rejected |
| Comment | Memo | — |
| Decision Date | DateTime | required |

### Relationships

| Kind | From | To | Lookup |
|---|---|---|---|
| 1:N | wksp_requisition | wksp_requisitionlineitem | wksp_ParentRequisitionId |
| 1:N | wksp_requisition | wksp_approvalhistory | wksp_RequisitionId |
| 1:N | wksp_supplier | wksp_requisition | wksp_SupplierId |
| 1:N | systemuser | wksp_requisition | wksp_RequesterId |
| 1:N | systemuser | wksp_requisition | wksp_CurrentApproverId |
| 1:N | systemuser | wksp_approvalhistory | wksp_ApproverId |

## Surfaces

### Generative pages

| Page | Key | Purpose | Reads | Navigates to | State |
|---|---|---|---|---|---|
| Requisition Analytics | `requisition-analytics` | KPI overview of requisitions by status, value tier, and month, with a quick view of what is currently pending approval. | wksp_requisition | — | built (`requisition-analytics.tsx`) |

### Forms

| Form | Table | Type | Layout | Sub-grids |
|---|---|---|---|---|
| Requisition | wksp_requisition | Main | explicit (1 tab) | wksp_requisitionlineitem, wksp_approvalhistory |
| Requisition Line Item | wksp_requisitionlineitem | Main | auto | — |
| Supplier | wksp_supplier | Main | auto | — |
| Approval History | wksp_approvalhistory | Main | auto | — |

Form scripts:

- **Requisition** — `onload` → `Wksp.Requisition.onLoad` (`wksp_requisition.js`)
- **Requisition** — `onchange` on `wksp_status` → `Wksp.Requisition.onStatusChange` (`wksp_requisition.js`)
- **Requisition** — `onchange` on `wksp_totalvalue` → `Wksp.Requisition.onTotalValueChange` (`wksp_requisition.js`)
- **Requisition Line Item** — `onload` → `Wksp.LineItem.onLoad` (`wksp_requisition.js`)
- **Requisition Line Item** — `onchange` on `wksp_quantity` → `Wksp.LineItem.onQuantityOrPriceChange` (`wksp_requisition.js`)
- **Requisition Line Item** — `onchange` on `wksp_unitprice` → `Wksp.LineItem.onQuantityOrPriceChange` (`wksp_requisition.js`)

### Views

| View | Table | Columns | Filters | Sort |
|---|---|---|---|---|
| My Requisitions | wksp_requisition | wksp_requisitionnumber, wksp_status, wksp_totalvalue, wksp_supplierid, wksp_datesubmitted | wksp_requesterid eq-userid | — |
| Pending Approval | wksp_requisition | wksp_requisitionnumber, wksp_requesterid, wksp_totalvalue, wksp_valuetier, wksp_datesubmitted | wksp_status eq In Approval; wksp_currentapproverid eq-userid | — |
| Approved This Month | wksp_requisition | wksp_requisitionnumber, wksp_requesterid, wksp_totalvalue, wksp_supplierid, wksp_datesubmitted | wksp_status eq Approved; modifiedon this-month | — |
| All Requisitions | wksp_requisition | wksp_requisitionnumber, wksp_status, wksp_requesterid, wksp_totalvalue, wksp_supplierid, wksp_datesubmitted | — | — |

## Navigation

- **Main**
  - Requisitions
    - Requisitions → table `wksp_requisition` — icon: the table's own
    - Dashboards → page `requisition-analytics`
  - Suppliers
    - Suppliers → table `wksp_supplier` — icon: the table's own
  - Approval History
    - Approval History → table `wksp_approvalhistory` — icon: the table's own

## Security

### Role: Requester

The app is granted to this role, so it opens for this persona.

| Table | Access | Scope |
|---|---|---|
| wksp_requisition | read | organization |
| wksp_requisition | create, write | user |
| wksp_requisitionlineitem | read, create, write | user |
| wksp_supplier | read | organization |
| wksp_approvalhistory | read | organization |

### Role: Workshop Supervisor

The app is granted to this role, so it opens for this persona.

| Table | Access | Scope |
|---|---|---|
| wksp_requisition | read | organization |
| wksp_requisitionlineitem | read | organization |
| wksp_approvalhistory | read, create | organization |
| wksp_supplier | read | organization |

### Role: Workshop Manager

The app is granted to this role, so it opens for this persona.

| Table | Access | Scope |
|---|---|---|
| wksp_requisition | read | organization |
| wksp_requisitionlineitem | read | organization |
| wksp_approvalhistory | read, create | organization |
| wksp_supplier | read | organization |

### Role: Finance Controller

The app is granted to this role, so it opens for this persona.

| Table | Access | Scope |
|---|---|---|
| wksp_requisition | read | organization |
| wksp_requisitionlineitem | read | organization |
| wksp_approvalhistory | read, create | organization |
| wksp_supplier | read | organization |

### Role: Procurement Officer

The app is granted to this role, so it opens for this persona.

| Table | Access | Scope |
|---|---|---|
| wksp_requisition | read, write | organization |
| wksp_requisitionlineitem | read | organization |
| wksp_approvalhistory | read | organization |
| wksp_supplier | read, create, write | organization |
