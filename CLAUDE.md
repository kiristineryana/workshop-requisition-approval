# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

This is not (yet) a conventional codebase. It currently contains one file —
`Workshop_Requisition_Approval_System.docx`, a Solution Design Document (v1.0) — which is the
authoritative spec for a Microsoft Power Platform **model-driven app** to be built here: the
"Workshop Purchase Requisition & Approval System" for an automotive service department. There is
no source code, no `package.json`, and no git repository yet — this is a from-scratch Power
Platform build, not a repo to be explored for existing structure.

When the design doc and any in-progress implementation disagree, treat the doc as the source of
truth for *intent*, but confirm with the user before resolving the conflict — the doc is a design
artifact, not a live spec that self-updates as decisions change.

## Target environment

Power Platform environment: **my dev**. When any skill or `pac` command prompts for an
environment, select this one specifically — do not default to whatever environment is currently
selected in the Power Platform CLI auth profile without checking.

## Build workflow

There is no npm/build/lint/test cycle here. The app, data model, and flow are built through the
installed Power Platform plugin skills, roughly in this order:

1. **Data model + app** — `model-apps:app-builder` (or `/app-builder`). Builds the Dataverse
   tables/columns/relationships, forms, views, sub-grids, dashboards, Business Process Flow, and
   the model-driven app + sitemap itself, driven by natural-language intent plus the data model
   below.
2. **Approval automation** — `power-automate:create-flow` / `power-automate:build-flow`. Builds
   the single Dataverse-triggered cloud flow described below (tiered routing + Approvals
   connector + Outlook/Teams delivery).
3. **Solution packaging** — package the tables, app, and flow together into one Dataverse solution
   before any deployment or GitHub push. No dedicated "package a model-driven app + flow as a
   solution" skill is installed in this environment (`power-pages:setup-solution` is scoped to
   Power Pages sites, not model-driven apps) — confirm the right mechanism (likely `pac solution`
   commands, or a capability inside `app-builder`) with the user before assuming one.
4. Deploy/target the **my dev** environment only, unless explicitly told otherwise.

## Git / GitHub

No local git repository exists yet. Before the first push: `git init`, add the user's GitHub
remote, then commit and push. Never fabricate or guess a remote URL — get it from the user first.

## Data model (Dataverse — four custom tables)

- **Requisition** (parent record): Requisition Number (autonumber, e.g. `REQ-000123`), Requester
  (lookup, User — set automatically), Total Value (currency, rolled up from line items), Status
  (choice: Draft → Submitted → In Approval → Approved/Rejected → Ordered → Received), Justification
  (multiline text, required when Total Value ≥ 10,000 AED), Supplier (lookup), Date Submitted
  (date/time), Current Approver (lookup, User — set by the flow).
- **Requisition Line Item** (N:1 to Requisition): Item Description, Category (choice: Part / Tool /
  Sublet / Consumable / Other), Quantity, Unit Price, Line Total (calculated = Quantity × Unit
  Price), Parent Requisition (lookup).
- **Supplier**: vendor list, referenced by lookup from both Requisition and line items.
- **Approval History** (N:1 to Requisition, append-only audit trail): Requisition (lookup),
  Approver (lookup, User), Approval Level (choice: Supervisor / Manager / Finance), Action
  (Approved / Rejected), Comment, Decision Date.

## Approval routing tiers (AED — admin-configurable, don't hardcode differently elsewhere)

| Total value | Approver(s) | Order |
|---|---|---|
| Under 1,000 | Workshop Supervisor | Single |
| 1,000 – 10,000 | Workshop Manager | Single |
| Above 10,000 | Workshop Manager, then Finance Controller | Sequential — Finance only sees it if the Manager approves first |

A rejection at any stage immediately sets Status → Rejected and ends the process; no further
approvers are contacted.

## Roles & segregation of duties (this is load-bearing — don't collapse it)

- **Requester** (Service Advisor/Technician): create/read own requisitions + line items, read
  suppliers. Cannot approve.
- **Approver** (Supervisor/Manager/Finance Controller): read requisitions assigned to them, record
  approval decisions. Cannot edit line items.
- **Procurement Officer**: read approved requisitions, update Status to Ordered/Received, maintain
  suppliers. Acts only after approval.
- **System Administrator**: full control of app/flow/thresholds/roles. Does not approve
  requisitions.
- Hard rules: a requester can never approve their own requisition; an approver can never be the
  one who raises the purchase order.

## Power Automate flow logic (single Dataverse-triggered cloud flow)

Trigger: Requisition row added/modified, filtered to `Status = Submitted` → get related line
items → sum Line Total into Total Value, write back to the requisition → set Status = In Approval,
stamp Date Submitted → branch on Total Value to pick the approver tier (see table above) →
Approvals connector creates the request, delivered via Outlook + Teams, flow waits for response →
log the decision to Approval History (approver, level, action, comment, timestamp) → on **reject**:
Status = Rejected, email requester with the reason, stop → on **approve at an intermediate tier**:
advance to the next approver → on **final approve**: Status = Approved, email requester that the
request proceeds to procurement.

## Model-driven app structure

- **Navigation areas**: Requisitions (views: My Requisitions, Pending Approval, Approved This
  Month, All Requisitions), Suppliers, Approval History (read-only), Dashboards (by status, value
  tier, month).
- **Requisition form**: header (number/status/total value), main section (supplier, justification,
  dates), line items sub-grid, approval history sub-grid (visible once decisions exist).
- **Business Process Flow** across the top of the form: Draft → Submitted → In Approval → Approved
  → Ordered → Received.
- **Business rules**: Justification required when Total Value ≥ 10,000; line items locked once
  Status passes Submitted; Current Approver hidden while Status = Draft.
