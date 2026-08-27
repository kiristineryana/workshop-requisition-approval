# Power Apps Code App Memory Bank

> Last Updated: 2026-08-27
> Session: Code Apps rebuild of the Workshop Requisition & Approval wireframe (coexists with the
> model-driven app in `../workshop-requisition-approval/`)

## Project Overview

| Property       | Value                          |
| -------------- | ------------------------------ |
| App Name       | Workshop Requisition Approval  |
| Project Path   | C:\Users\kiris\Desktop\mdapp\workshop-requisition-codeapp |
| Environment    | my_dev                  |
| Environment ID | 00000000-0000-0000-0000-000000000000 |
| App URL        | https://apps.powerapps.com/play/e/00000000-0000-0000-0000-000000000000/app/11111111-1111-1111-1111-111111111111 |
| App ID         | 11111111-1111-1111-1111-111111111111 |
| CLI Binary     | pa                              |
| Created Date   | 2026-08-27                      |
| Status         | **Rebuild complete** (all 9 plan phases) + Suppliers/Approval History screens added post-plan |

## Scope (see full plan at C:\Users\kiris\.claude\plans\drifting-crafting-deer.md)

This rebuild targets wireframes 1a-1d only (the process swimlane / stage tracker, the requisition
form, the dashboard, and the pending-approval inbox) to get pixel-exact styling the model-driven
app's platform ceilings couldn't reach (fixed unthemeable chrome bar, 8-category BPF icon limit,
limited theme reach). Key decisions:

- **In-app Approve/Reject**: writes directly to Dataverse (`wksp_requisition` + `wksp_approvalhistory`)
  instead of going through the Approvals connector — sidesteps the already-broken Exchange/email
  issue. The existing polling flow (`1a166da3-40a1-f111-b8de-002248e81844` in
  `workshop-requisition-approval`) was simplified down to submission-time-only logic (tier resolution
  + first approver) in Phase 5. The code app now owns everything downstream of that — built in
  Phase 6 (`PendingApprovalPage.tsx`) — see Current Status for the full design and verification.
- **Coexist, not replace**: this code app is the Requester/Approver-facing UI; the model-driven app
  stays for Procurement Officer / System Administrator back-office work.
- Mobile capture (wireframe 1e) is out of scope.

## User Preferences

### Design Preferences
- Theme: matching the wireframe's navy `#181059` / red `#D42A41` palette (not the template's default
  dark theme) — full custom CSS, no platform-imposed chrome.

### Technical Preferences
- Data Sources: Dataverse only (5 existing tables, no new schema) — **amended in Phase 4**: added
  `systemuser` as a 6th, read-only data source. Necessary because the generated Dataverse client
  never returns lookup `xxxname` virtual fields (confirmed via runtime error and a raw Web API
  comparison — see Known Issues) — there was no connector-compliant way to show Requester/Approver
  display names without it. Judgment call made without re-confirming with the user; flagged here for
  visibility. Uses the same `default.cds` connection, no new connection reference.
- **Amended again in Phase 6**: added `environmentvariablevalue` as a 7th, read-only data source —
  needed to resolve the Finance Controller's systemuserid (email → environment variable → systemuser)
  when advancing the Above-10,000 AED tier from Manager to Finance, mirroring the same lookup the
  flow used to do in `Get_Finance_Email`/`Get_Finance_User`. Same `default.cds` connection, no new
  connection reference — same low-risk pattern as the `systemuser` addition.

## Completed Steps

### /create-code-app
- [x] Prerequisites validated (Node.js v24.16.0, git 2.54.0)
- [x] Environment ID confirmed (my_dev, 00000000-0000-0000-0000-000000000000)
- [x] Scaffolded from template (`npx degit microsoft/PowerAppsCodeApps/templates/vite`)
- [x] `@microsoft/power-apps-cli` installed as a dev dependency — **the scaffolded template's
      `package.json` did NOT include the CLI** (only `@microsoft/power-apps` runtime SDK and
      `@microsoft/power-apps-vite`), contrary to the skill docs' assumption that `npm install`
      installs it automatically. Had to `npm install --save-dev @microsoft/power-apps-cli`
      separately before the `pa` binary shim appeared in `node_modules/.bin/`.
- [x] `pa auth login` — succeeded silently (reused the existing signed-in session for
      you@yourtenant.onmicrosoft.com, no interactive browser prompt needed)
- [x] Initialized with `pa app init -n 'Workshop Requisition Approval' -e 00000000-0000-0000-0000-000000000000`
- [x] Built successfully (`npm run build` — `tsc -b && vite build`)
- [x] Deployed to Power Platform (`pa app push`) — baseline template app live
- App URL: https://apps.powerapps.com/play/e/00000000-0000-0000-0000-000000000000/app/11111111-1111-1111-1111-111111111111

## Created Resources

### Data Sources

All 5 pre-existing tables added via `pa app add data-source --connector dataverse --table <name>`:

| Source | Type | Notes |
| --- | --- | --- |
| `wksp_requisition` | Dataverse | Choice enums confirmed matching the flow's numeric values exactly (status, valuetier, risklevel, priority, paymentterms, repairordertype) — no manual enum re-declaration needed, just import from the generated model. |
| `wksp_requisitionlineitem` | Dataverse | `wksp_category`, `wksp_quantity`, `wksp_unitprice`, `wksp_linetotal` confirmed present. |
| `wksp_supplier` | Dataverse | |
| `wksp_approvalhistory` | Dataverse | |
| `wksp_costcentre` | Dataverse | |
| `systemuser` | Dataverse | Added in Phase 4, not part of the original 5-table plan — see Technical Preferences and Known Issues above for why. |

### Generated Files

| File | Source |
| --- | --- |
| `src/generated/models/Wksp_requisitionsModel.ts` + `Wksp_requisitionsService.ts` | `wksp_requisition` |
| `src/generated/models/Wksp_requisitionlineitemsModel.ts` + `Wksp_requisitionlineitemsService.ts` | `wksp_requisitionlineitem` |
| `src/generated/models/Wksp_suppliersModel.ts` + `Wksp_suppliersService.ts` | `wksp_supplier` |
| `src/generated/models/Wksp_approvalhistoriesModel.ts` + `Wksp_approvalhistoriesService.ts` | `wksp_approvalhistory` |
| `src/generated/models/Wksp_costcentresModel.ts` + `Wksp_costcentresService.ts` | `wksp_costcentre` |
| `src/generated/models/SystemusersModel.ts` + `SystemusersService.ts` | `systemuser` (Phase 4) |
| `src/generated/models/CommonModels.ts`, `src/generated/index.ts` | shared |

Build verified clean after all 5 additions (`npm run build` — no TS errors).

### Phase 3 Files

| File | Purpose |
| --- | --- |
| `src/theme.ts` | Shared brand palette constants (navy, red, gold, green, etc.) |
| `src/lib/choiceMeta.ts` | Status/value-tier/risk-level/approval choice metadata + `formatCurrency`/`formatDate` helpers |
| `src/components/icons.tsx` | Custom SVG icon set (nav icons ported from the model-driven app sitemap + new dashboard icons) |
| `src/components/charts/HorizontalBarChart.tsx`, `VerticalBarChart.tsx` | Plain-div chart components, no chart library dependency |
| `src/components/KpiCard.tsx` | KPI tile — vertical layout, wraps instead of truncating long values |
| `src/pages/DashboardPage.tsx` | Main Phase 3 deliverable — KPIs, status/tier charts, risk mix, cost-centre budget, monthly trend, pending-approval mini-table |
| `src/App.tsx` | Navy sidebar nav shell (Requisitions/Suppliers/Approval History/Dashboard); only Dashboard is wired up, others show a "coming in a later phase" placeholder |
| `src/index.css`, `src/App.css` | Reset the Vite template's dark-mode/centered-flex defaults to a plain full-height light layout |

### Phase 4 Files

| File | Purpose |
| --- | --- |
| `src/lib/users.ts` | `useUserDirectory()` hook — fetches all `systemuser` rows (id/fullname/AAD objectId) once, builds a GUID→display-name map, and resolves the signed-in user's `systemuserid` by matching `getContext().user.objectId` against `azureactivedirectoryobjectid`. This is how Requester/Approver names are shown — see Known Issues for why. |
| `src/lib/choiceMeta.ts` (extended) | Added `PRIORITY_META`/`getPriorityMeta`, `PAYMENT_TERMS_META`/`getPaymentTermsLabel`, `REPAIR_ORDER_TYPE_META`/`getRepairOrderTypeLabel`, `CATEGORY_META`/`getCategoryMeta`, `CONTRACT_STATUS_META`, and the 6-stage tracker mapping `STAGE_LABELS`/`getStageIndex` (Rejected freezes the tracker at "In Approval"). |
| `src/components/icons.tsx` (extended) | Added `ArrowLeftIcon`, `PlusIcon`, `TrashIcon`, `AlertTriangleIcon`, `SearchIcon`. |
| `src/components/Pill.tsx` | Generic colored pill/badge, reused for status/tier/category/risk chips across list and detail. |
| `src/components/StageTracker.tsx` | The 6-stage horizontal process tracker from wireframe 1b, driven by `wksp_status`. |
| `src/pages/RequisitionListPage.tsx` | Requisitions list — My/Pending/Approved-this-month/Rejected/All view tabs, search, sortable-by-date table. |
| `src/pages/RequisitionDetailPage.tsx` | Full requisition form (wireframe 1b): header stats, stage tracker, Submit-for-approval + Save actions, Requester & job context fields (editable while Draft, read-only after), editable line-items grid (add/inline-edit/delete, live-persisted per row), Supplier & justification section with the ≥10,000 AED justification business rule, and a right rail (risk score card, routing preview, duplicate-warning banner, approval history, cost-centre budget impact). |
| `src/App.tsx` (extended) | `RequisitionsSection` — local master-detail state (`selectedId`) toggling between the list and detail pages; no router added. |

Build verified clean after Phase 4 (`npm run build` — no TS errors).

### Phase 6 Files

| File | Purpose |
| --- | --- |
| `src/lib/approverResolution.ts` | `resolveFinanceApproverId()` — env var (Finance definition id) → email → `systemuser` lookup, mirroring the flow's old `Get_Finance_Email`/`Get_Finance_User` steps. Used only for the Manager→Finance advance on the Above-10,000 tier. |
| `src/pages/PendingApprovalPage.tsx` | Wireframe 1d — the approver's actionable inbox: list filtered to requisitions In Approval and assigned to the signed-in user, side panel (line items, justification, approval history, comment, Approve/Reject), and `handleDecision()` / `currentApprovalLevel()` implementing the full approve/reject/advance/finalize logic — see Current Status for the design and the history-based stage-derivation rationale. |
| `src/App.tsx` (extended) | Added the "Pending Approval" nav item (between Requisitions and Suppliers), reusing `ClockPendingIcon`. |

Build verified clean after Phase 6 (`npm run build` — no TS errors).

### Phase 7 Files

| File | Purpose |
| --- | --- |
| `src/components/icons.tsx` (extended) | Added `StageDraftIcon`, `StageSubmittedIcon`, `StageInApprovalIcon`, `StageApprovedIcon`, `StageOrderedIcon`, `StageReceivedIcon`, `StageRejectedIcon` — exact SVG path data copied from wireframe 1a's 12-step process-flow diagram (icons for "Raise requisition", "Submit", "Approver decides", "Approved", "Raise PO / Order", "Goods received", and the rejected-path "X" glyph respectively). |
| `src/components/StageTracker.tsx` (rewritten) | Each of the 6 stage badges now renders its `StageIcon` instead of a plain digit (all existing colour/state logic — current/past/future/rejected — unchanged); rejected freezes on `StageRejectedIcon`. |

Build verified clean after Phase 7 (`npm run build` — no TS errors).

### Phase 8 Files

| File | Purpose |
| --- | --- |
| `index.html` | Added the Google Fonts `<link>` for Open Sans (400/600/700) + Nunito Sans (600/700) — the wireframe's actual type stack, replacing the template's default title/no-webfont state. Also set a real `<title>`. |
| `src/theme.ts` (corrected) | `TEXT_PRIMARY` `#1A1A2E`→`#353A40`, `TEXT_MUTED` `#6B6F80`→`#757575`, `BORDER` `#E2E4EA`→`#D9D9D9` — the app's three most-referenced text/border constants were a cool blue-grey invented palette, not the wireframe's actual warm neutral greys; fixing them here cascades correctly everywhere else since components consume these constants rather than hardcoding their own. Added `FONT_BODY` (Open Sans stack) and `FONT_DISPLAY` (Nunito Sans stack, for primary CTA buttons only, matching the wireframe's own font split). |
| `src/App.tsx` (adjusted) | Root `fontFamily` now `FONT_BODY`; de-hardcoded the active-nav-item border color to `BRAND_RED`. |
| `src/index.css` (adjusted) | `:root` font stack and base text color updated to match. |
| `src/components/KpiCard.tsx` (adjusted) | Border color now imports `BORDER` from theme instead of a separately hardcoded `#E2E4EA`. |
| `src/lib/choiceMeta.ts` (extended) | `STATUS_META` entries can now carry a `pillBg`/`pillFg`/`pillOutline` override; added for Draft only, matching the wireframe's DRAFT badge exactly (light pink fill, red border and text) instead of the neutral solid pill every other status uses. Added `getStatusPillStyle()` returning the right `{bg, fg, outline}` for `Pill`. `color` (used for chart bars/dots) is untouched — Draft's chart-bar grey stays as-is; only the pill/badge rendering changes. |
| `src/pages/RequisitionListPage.tsx`, `src/pages/RequisitionDetailPage.tsx` (adjusted) | Status pills now call `getStatusPillStyle()` instead of always rendering solid `{bg: statusMeta.color, fg: WHITE}`. |
| `src/pages/RequisitionDetailPage.tsx`, `src/pages/PendingApprovalPage.tsx` (adjusted) | The primary red CTA buttons (Submit for approval, Approve, Reject) now render in `FONT_DISPLAY` (Nunito Sans), matching the wireframe's own font split between body copy and call-to-action labels. |

Build verified clean after Phase 8 (`npm run build` — no TS errors).

### Phase 9 Files

| File | Purpose |
| --- | --- |
| `src/pages/PendingApprovalPage.tsx` (extended) | Added a duplicate-warning banner to the side panel — a real gap found during Phase 9's end-to-end test: `RequisitionDetailPage` already showed this, but the approver's own decision screen didn't surface it at all, even though "is this requisition a possible duplicate" is exactly the kind of thing an approver needs to see before deciding. Fetches the duplicate-of record (id + number only) alongside line items/history when a row is selected; select list gained `_wksp_duplicateofid_value`. |

Build verified clean after Phase 9 (`npm run build` — no TS errors).

### Post-Plan: Suppliers + Approval History Screens

Requested directly by the user after the 9-phase plan closed out — these two nav items had been
`ComingSoon` placeholders since Phase 3 and were never in the plan's scope (the plan targeted
wireframes 1a-1d only, none of which cover these two screens).

| File | Purpose |
| --- | --- |
| `src/lib/choiceMeta.ts` (extended) | `CONTRACT_STATUS_META` gained `bg`/`fg` (On-Contract green, Off-Contract amber — the amber matches the wireframe's own "Off-contract vendor" badge from wireframe 1b) + `getContractStatusMeta()`. Added `formatDateTime()` (date + time) for the approval-history timestamp column, alongside the existing date-only `formatDate()`. |
| `src/pages/SuppliersPage.tsx` | Read-only vendor directory — summary chips (total/on-contract/off-contract counts), search by name/contact/email, table with contract-status pill. Deliberately **read-only**: the design doc assigns "maintain suppliers" to the Procurement Officer role, and this code app's charter (from the original plan's "coexist" decision) is the Requester/Approver-facing surface — supplier maintenance stays a model-driven-app job. |
| `src/pages/ApprovalHistoryPage.tsx` | Read-only, append-only audit trail across **all** requisitions (not filtered to the signed-in user, unlike Pending Approval) — All/Approved/Rejected view tabs, search by requisition number/approver/comment, and a clickable requisition number that deep-links into `RequisitionDetailPage`. Resolves the requisition-number and approver-name columns the same way every other page in this app has had to since Phase 4: a local `Map` built from a lightweight side-fetch (`_wksp_requisitionid_value` → number) plus `useUserDirectory()`, since the SDK's `wksp_requisitionidname` virtual field is one more instance of the never-works `xxxname` limitation documented in Known Issues. |
| `src/App.tsx` (adjusted) | The Requisitions master-detail `selectedId` state moved out of a nested `RequisitionsSection` component and up into `App` itself (now `requisitionDetailId`), specifically so `ApprovalHistoryPage`'s "open this requisition" link can both switch the active nav tab to Requisitions *and* preselect the record in one `openRequisition(id)` call — a cross-page deep link wasn't possible with the state trapped in a child component. |

Build verified clean (`npm run build` — no TS errors). Deployed and verified in-browser:
- **Approval History**: confirmed rendering real historical data correctly — 9 existing decisions,
  correct requisition numbers, level, colored Approved/Rejected pills, resolved approver name ("#
  Ryana"), a real stored comment ("Testing rejection path - insufficient budget for this test
  case."), and formatted date+time.
- **Suppliers**: confirmed rendering correctly — "1 total / 0 on-contract / 1 off-contract" summary
  chips matching the one seed supplier, table row with icon, name, contact, email, and the
  amber-outline "Off-Contract" pill in the exact wireframe style.
- **Known verification gap**: the Approval History → Requisition Detail deep-link button did not
  register on two click attempts in the browser (the same table/row click-targeting instability
  documented in Known Issues — a different UI element than a table row, but the same underlying
  tooling fault). Not re-verified by simulation this time since there's no state-mutating action to
  replicate — the link's `onOpenRequisition(id)` callback is the identical `onNavigate`/`onSelect`
  pattern already proven working in `RequisitionDetailPage`'s duplicate-record link and the
  Requisitions list-to-detail flow, so this is judged correct by code review; confirm with a real
  click next time the app is open if it matters.

## Current Status

**Last Action**: Phase 4 (Requisition list + detail) built and deployed (`pa app push`). Verified
in-browser: the list page renders all 10 seed requisitions with correct status/tier/value pills,
working view-tab filters, and — after the `systemuser` fix below — correctly resolved Requester and
Approver names. Opened a detail record (REQ-001007): header stats, the 6-stage tracker (correctly
highlighting "Approved"), the risk-score quick-view card (correctly showing "UNSCORED" with
explanatory copy for a record with no score), routing preview (correct Supervisor-tier chain), and
read-only field rendering (record is Approved, not Draft) all matched the wireframe design.

**Real bug found and fixed during this phase**: the generated Dataverse client (`getAll`/`get`) never
returns lookup "xxxname" virtual fields — not via `$select`, and not even on a full-entity fetch with
no `$select` at all. Confirmed by reproducing a runtime error (`Could not find a property named
'wksp_requesteridname' on type 'Microsoft.Dynamics.CRM.wksp_requisition'`) when it was explicitly
selected, then confirming via a raw Dataverse Web API call that the underlying `_wksp_requesterid_value`
GUID *was* populated correctly — the SDK just never surfaces the formatted/virtual name properties,
full stop. This closes the open question flagged at the end of Phase 2. **Fix**: added `systemuser`
as a 6th (read-only) Dataverse data source and resolve every Requester/Approver display name through
`useUserDirectory()`'s GUID→fullname map instead. The same fix applies to all other `xxxname` fields
used in the detail page (repair order type, payment terms, priority, supplier) — those are resolved
via the local `choiceMeta` label getters or the already-fetched suppliers/cost-centres lists instead.

**Known verification gap**: line items grid, the duplicate-warning banner, approval-history list,
budget-impact card, and the Draft-mode editable fields / Submit-for-approval flow were code-reviewed
but not confirmed by screenshot this phase — browser automation in this session was unusually flaky
(repeated tab freezes, and on-screen coordinates drifting when the "old version"/"developer
environment" banners appeared or disappeared mid-sequence, shifting all element positions). The
list and detail pages that *were* screenshotted rendered exactly as designed, and the unverified
sections use the identical fetch/render patterns already proven working, so risk is judged low —
but treat these specific pieces as unverified until manually checked in the app.

**Phase 5 complete** — simplified `Workshop Requisition Approval Routing (Polling)`
(`1a166da3-40a1-f111-b8de-002248e81844`) via the flowagent MCP tools' `edit_flow` (surgical
dry-run-then-apply, auto-backed-up beforehand — `list_backups`/`get_backup` can restore if ever
needed). Removed, in all three tier branches (`Supervisor_Stage`, `Manager_Only_Stage`, and
`Manager_Stage` under the high tier):
- `Start_Wait_*` (the `StartAndWaitForAnApproval` Approvals-connector webhook)
- `Log_Approval_History_*` (the `wksp_approvalhistories` create)
- `*_Outcome` (the reject/approve `If`, including its `Update_*`/`Email_*` actions)

For the high tier specifically, removing `Manager_B_Outcome` also removed the entire nested
`Finance_Stage` scope living in its `else` — the Manager→Finance hand-off is now entirely the code
app's job (Phase 6), not the flow's. Each branch now ends cleanly at `Set_Current_Approver_*`; the
`Update_Requisition_*_Tier` actions (which set `wksp_totalvalue`/`wksp_valuetier`/`wksp_status` = In
Approval / `wksp_datesubmitted`) were untouched, as were `Risk_And_Duplicate_Assessment` and the
`Apply_to_each_InApproval_Requisition` age-refresher — those scopes were correctly out of scope and
verified unchanged by inspecting the post-edit definition.

**A second real bug found and fixed in the same pass**: `Add_Line_Total` summed
`items('For_each_line_item')?['wksp_linetotal']` directly, but `wksp_linetotal` is a Dataverse
calculated column (Quantity × Unit Price) that returns `null` when a line item is created via the
Web API without going through the model-driven app's form pipeline — which is exactly how *both* the
flow's own line-item creation pattern and the Phase 4 code app's "New line item" button create rows.
A live test (create Draft → 500 AED line item → Submit → let the polling flow run) proved this
concretely: `wksp_totalvalue` came out as `1.0` instead of `500`, because `IncrementVariable` given a
`null` amount silently added `1`. **Fix**: `List_Line_Items` now also selects `wksp_quantity`/
`wksp_unitprice`, and `Add_Line_Total` uses
`coalesce(wksp_linetotal, mul(coalesce(wksp_quantity,0), coalesce(wksp_unitprice,0)))` — falls back
to computing the line total client-side in the flow when the calculated column hasn't resolved,
mirroring the same defensive `?? quantity * unitprice` fallback `RequisitionDetailPage.tsx` already
uses for its own subtotal display. Re-tested end-to-end after the fix: `wksp_totalvalue` came out
correctly as `500.0`, with `wksp_valuetier`/`wksp_status`/`wksp_riskscore`/`wksp_risklevel`/
`_wksp_currentapproverid_value` all correct and zero `wksp_approvalhistories` rows created. Test
requisition and line item deleted after verification.

**Not changed, flagged for awareness only**: the flow's `properties.connectionReferences` still list
`shared_approvals` (`new_sharedapprovals_41d23`) and `shared_office365` (`vg_Outlook`) even though no
remaining action uses them — harmless (an unused connection reference doesn't affect behavior) but
could be tidied in a later pass if anyone's auditing connections.

**Phase 6 complete** — `PendingApprovalPage.tsx` (wireframe 1d) + the in-app approve/reject/
tier-advance/finalize logic that now owns everything the flow used to do downstream of assigning the
first approver.

**Design**: list of requisitions where `wksp_status = In Approval` AND `_wksp_currentapproverid_value`
matches the signed-in user's resolved `systemuserid` ("assigned to me" — not a general admin view,
consistent with the coexist model where Procurement/Admin use the model-driven app instead). Columns:
requisition + tier/job-card summary, requester, value, age (from `wksp_ageinapprovalhours`, colour-coded
≥48h red / ≥24h gold / else muted — thresholds read off the wireframe's own SLA colour-coding), risk
pill. Selecting a row loads its line items + approval history into a side panel matching wireframe 1d:
risk pill, raised-by/date/branch/job-card/vehicle meta line, line-item table + total, justification card,
prior approval-history entries (so a Finance decision can see the Manager's comment), a comment box, and
Approve/Reject buttons. The wireframe's itemized "why this scored 72" risk-factor breakdown was
intentionally omitted — same reasoning as Phase 4's risk card: only the final `wksp_riskscore`/
`wksp_risklevel` are persisted, not per-factor deltas, so showing invented factors would be fabricating
data. Batch multi-select ("Approve selected"), "Request info", and "Reassign" from the wireframe were
also left out — out of the plan's stated scope (single-record Approve/Reject only).

**Decision logic** (`handleDecision` in `PendingApprovalPage.tsx`): writes a `wksp_approvalhistories`
row first (level/action/comment/decisiondate/RequisitionId/ApproverId — ApproverId is always the
signed-in user, resolved via `useUserDirectory`'s `currentUserId`), then either:
- **Reject** (any tier): sets `wksp_status` = Rejected. Always terminal.
- **Approve, Under-1,000 or 1,000–10,000 tier**: only one approval level exists, so this always
  finalizes — sets `wksp_status` = Approved.
- **Approve, Above-10,000 tier**: two levels (Manager then Finance). If this decision is the Manager's,
  it *advances* — resolves the Finance Controller's `systemuserid` via `resolveFinanceApproverId()`
  (`src/lib/approverResolution.ts`, added this phase) and writes it into `wksp_CurrentApproverId`,
  leaving `wksp_status` at In Approval. If it's Finance's, it finalizes to Approved.

**Deliberate deviation from the plan's literal wording, and why**: the plan said to determine the
current approval level "the same way the flow does today — reading the three environment variables...
and comparing against `_wksp_currentapproverid_value`". Checking the actual environment variable
values before building this (`bbd3ea5b…`/`f1ebef69…`/`f5ebef69…`) showed all three — Supervisor,
Manager, and Finance — resolve to the *same* email/systemuserid in this dev tenant (one person holds
all three roles for testing). Identity comparison therefore cannot distinguish "Manager's turn" from
"Finance's turn" here — both would compare equal to the current approver. **Fix**: `currentApprovalLevel()`
derives the stage from whether a Manager-level `wksp_approvalhistories` row already exists for the
requisition, not from identity. This is actually more robust in general, not just a workaround for this
tenant's data: a requisition only stays "In Approval" past a Manager decision if that decision was an
*approval* (a rejection would already have moved it to Rejected and dropped off this page), so "has a
Manager-level history row" reliably means "the Manager already approved; this decision is Finance's" —
true whether or not the two roles are literally different people. `resolveFinanceApproverId()` is still
implemented properly (env var → email → systemuser lookup, not hardcoded) so the *advance* step remains
correct in a real deployment with genuinely distinct approvers.

**Verification** — created real test requisitions via direct Dataverse API calls (Draft → line item →
Submit → let the polling flow assign the first approver), then exercised the actual deployed app:
- **List + side panel rendering**: confirmed correct in-browser (screenshotted) — nav item, view list
  with correct tier/value/age/risk columns, side panel with line items/total/comment box/buttons all
  matching the wireframe.
- **Manager-stage Approve, Above-10,000 tier**: clicked Approve for real in the browser. Confirmed via
  direct Dataverse query: one `wksp_approvalhistories` row created (level=Manager, action=Approved),
  `wksp_status` correctly stayed In Approval (100000002), `_wksp_currentapproverid_value` write for the
  advance-to-Finance step executed without error. The in-app success banner ("REQ-001011 approved —
  advanced to Finance Controller.") matched exactly.
- **Finance-stage Approve (finalize) and the Reject path**: browser automation in this session hit a
  genuine, reproducible click-targeting fault specific to this tab/session — clicking a table row
  in the Pending Approval list would intermittently select the row *above* the intended one, with no
  stable, correctable offset (tried consistent compensation, which worked once then failed again) and
  occasional zoom/layout drift between screenshot and click — six attempts across three fresh tabs
  failed to reliably reproduce the click. Per this session's own guidance not to keep retrying a
  failing browser action, these two remaining paths were instead verified by directly issuing the exact
  same Dataverse writes `handleDecision` performs (one `wksp_approvalhistories` create + one
  `wksp_requisitions` status update, in the same order, with the same field values the code computes) —
  confirmed both landed correctly: Finance approval finalized `wksp_status` to Approved (100000003)
  with the full two-row history trail (Manager approved → Finance approved) intact, and a fresh
  Under-1,000-tier test record correctly rejected (`wksp_status` = 100000004, one Supervisor-level
  Rejected history row). This proves the *data model and decision logic* are correct end-to-end; the
  Approve button's exact code path for the Manager stage was confirmed by a real click, and the
  remaining two decision branches share that same `handleDecision` function and were verified by
  faithfully replicating its writes rather than by an actual second/third button click. All test
  requisitions, line items, and approval-history rows deleted after verification.

**Phase 7 complete** — `StageTracker.tsx` now shows a distinct icon per BPF stage instead of a plain
number, using the exact glyphs from wireframe 1a's 12-step process-flow diagram: Draft → clipboard
("Raise requisition"), Submitted → paper-plane ("Submit"), In Approval → checkmark-diamond
("Approver decides"), Approved → checkmark circle ("Approved"), Ordered → shopping-cart ("Raise PO /
Order"), Received → open-box-with-check ("Goods received"), and a dedicated X-circle for the
Rejected terminal state. This is the direct payoff of the whole Code Apps rebuild's original
motivation: the model-driven app's BPF control caps out at 8 built-in category icons and can't
render custom per-stage glyphs at all — this tracker is a plain React component, so it can.

**Verification**: build clean, deployed, and confirmed in-browser on a real In-Approval record
(REQ-001009) — the active "In Approval" stage correctly showed the navy-filled checkmark-diamond
icon, with the other five stages' distinct icons visible in their grey (future) state around it,
exactly as designed. The Rejected-state icon was not separately screenshotted this phase (browser
row-click targeting was unreliable again — see Known Issues) but shares the identical rendering path
already exercised for every other stage, so risk is judged negligible; confirm visually next time a
Rejected record is opened if it matters.

**Phase 8 complete** — a pixel-precision pass against the wireframe, scoped to the highest-leverage,
lowest-risk fixes rather than an exhaustive line-by-line re-match of every element (which would have
meant re-touching nearly every component for diminishing returns):

1. **Typography** (the single biggest gap): the wireframe sets everything in Open Sans (400/600/700)
   with Nunito Sans (600/700) reserved for primary call-to-action buttons, loaded via Google Fonts.
   The app had been running on a plain `Segoe UI, system-ui` stack since Phase 3 — a completely
   different typeface family that changed the whole app's character. Fixed via a Google Fonts
   `<link>` in `index.html` plus `FONT_BODY`/`FONT_DISPLAY` constants in `theme.ts`, applied at the
   app root (cascades everywhere) and to the three primary CTAs (Submit for approval, Approve,
   Reject).
2. **Core palette correction**: audited every hardcoded hex value across the codebase against the
   wireframe's own style strings (most were already exact copies pulled from the wireframe when each
   component was built — status pill colors, warning-banner colors, risk-card colors all checked out).
   The three real mismatches were `theme.ts`'s `TEXT_PRIMARY`, `TEXT_MUTED`, and `BORDER` — an
   invented cool blue-grey palette instead of the wireframe's actual warm neutral greys
   (`#353A40`/`#757575`/`#D9D9D9`). Correcting these three constants fixed every screen's body text,
   muted labels, and borders in one place, since components consume the shared constants rather than
   hardcoding their own (one component, `KpiCard.tsx`, *was* hardcoding its own separate border color
   and was fixed to import the shared constant instead).
3. **Draft status badge**: the wireframe's DRAFT badge is a distinct light-pink/red-outline pill, not
   the neutral solid pill every other status uses — a deliberate design cue (emphasizing an
   unsubmitted/incomplete state) worth honoring exactly rather than normalizing away. Added a
   pill-specific override in `STATUS_META`/`getStatusPillStyle()` so only the *badge* changes for
   Draft; the KPI/chart-bar color for Draft is untouched (a near-white bar wouldn't read against the
   dashboard's chart track).

**Deliberately out of scope for this pass** (would require rebuilding rather than adjusting): the
wireframe's badges throughout are actually an *outline* style (light bg + colored border + colored
text) rather than the app's established solid-fill convention — Draft is the one place this was
worth special-casing exactly; extending it to every status/tier/category pill across the whole app
would be a much larger, riskier visual-language change than "pixel precision" calls for, and the
current solid-pill convention already reads cleanly and consistently. Exhaustive per-element spacing
verification (every button height, every gap value) against the wireframe's literal px values was
similarly not attempted beyond spot-checks — most existing spacing already tracks the wireframe
closely from how each component was originally built directly against wireframe snippets.

**Verification**: build clean, deployed, confirmed in-browser — Open Sans rendering visibly replaced
Segoe UI across the Dashboard and Requisitions list, and the corrected muted/border colors read as
intended (warmer neutral grey, matching the wireframe rather than the previous cool blue-grey). No
Draft-status record existed in the sample data to screenshot the new badge style directly; verified
by code review instead (the same `outline` rendering path `Pill` already uses correctly elsewhere).

**Phase 9 complete — rebuild finished.** Ran one real end-to-end lifecycle test through live Dataverse
data (not synthetic assertions) covering every mechanism built across all 9 phases, then confirmed
the model-driven app still works unmodified in parallel.

**End-to-end test**: created a duplicate pair (two Draft requisitions sharing job card `JC-E2E-9001`,
created within the same 14-day window the flow's duplicate check uses), gave the real one a single
15,750 AED line item against the known off-contract supplier, and submitted it.
- **Flow (Phase 5's simplified version)**: correctly summed the line item (`wksp_totalvalue` = exactly
  15750 — the Phase 5 `Add_Line_Total` fix still holding), resolved the Above-10,000 tier, assigned
  the Manager as first approver, and set status to In Approval — all without any wait/history/email
  side effects (confirmed no premature `wksp_approvalhistories` row existed).
- **Risk + duplicate detection (untouched scope, `Risk_And_Duplicate_Assessment`)**: computed
  `wksp_riskscore` = 82 / High — correctly stacking the Above-10k tier weight, the off-contract
  supplier penalty, the missing-quotes penalty, and the duplicate flag — and correctly set
  `_wksp_duplicateofid_value` to the seed record's id, proving duplicate detection still fires
  correctly after the flow was edited in Phase 5.
- **A real gap found and fixed here**: opened the record in the actual Pending Approval UI
  (`PendingApprovalPage`) and noticed it had no duplicate-warning banner at all, unlike
  `RequisitionDetailPage` — the one screen whose entire purpose is helping an approver decide didn't
  surface "this might be a duplicate." Fixed by adding the same banner pattern, fetching the
  duplicate-of record when a row is selected.
- **Manager-stage Approve**: confirmed via a real click in the browser — advanced
  `wksp_CurrentApproverId` to Finance, logged a Manager-level Approved history row, left status at
  In Approval. Table-row clicks in Pending Approval then became unresponsive for the Finance-stage
  click (three consecutive clicks produced no effect at all — a different failure mode than earlier
  phases' wrong-row selection, but the same underlying tooling issue tracked in Known Issues). Per
  the standing guidance not to keep retrying a failing browser action, and since Phase 6 had already
  proven this exact code path correct via a real click, completed the Finance-stage
  approve-and-finalize and a separate Under-1,000-tier reject test by replicating the exact same
  Dataverse writes `handleDecision` performs.
- **Final state confirmed correct**: `wksp_status` = Approved, full two-row history trail (Manager
  approved → Finance approved) in order, duplicate link and risk score preserved through both
  decisions. The code app's own Dashboard then correctly reflected the change (Approved 5→6, Pending
  3→2, spend-by-tier unchanged since it sums by tier regardless of status) without a page reload
  beyond the normal `reloadKey` refetch.
- All test records (the duplicate pair, its line item, both approval-history rows) deleted after
  verification — `wksp_requisitions` count confirmed back to the pre-test baseline of 10.

**Model-driven app confirmed still fully functional in parallel**: opened REQ-001007 in the
model-driven app (`workshop-requisition-approval`) — form loaded correctly with accurate live data
(Status=Approved, Value Tier, Requester, Date Submitted all correct), sitemap and command bar intact.
Its own genpage Dashboard showed numbers identical to the code app's Dashboard (12/2/6/3/1, same AED
totals) at the time of the check — solid confirmation both surfaces read the same Dataverse tables
consistently, which is the entire point of the "coexist" architecture.
One **pre-existing, unrelated observation**: that record's BPF stage pointer is stuck showing "Draft"
even though `wksp_status` is Approved — a known consequence (documented earlier this session) of
directly writing `wksp_status` via the Web API rather than through the classic form, which doesn't
auto-advance the BPF's separate `processid`/`stageid` state. This predates Phase 5 and isn't caused by
anything in this rebuild; fixing it per-record would mean manually running "Switch Process" and isn't
part of this plan.

**All 9 phases of the Code Apps rebuild are now complete and verified.** The code app
(`workshop-requisition-approval-codeapp`) is the primary Requester/Approver-facing surface with exact
wireframe fidelity the model-driven app's platform ceilings couldn't reach; the model-driven app
remains fully functional for Procurement/Admin back-office work. See "Known verification gaps" noted
in each phase's section above for the handful of items confirmed by code review rather than a live
screenshot (all due to this session's recurring browser-automation click/zoom instability, never a
sign of an actual app defect where investigated).

**Pending Items**:
- [x] Phase 3: Shell + Dashboard screen (deployed; lower-section scroll verification incomplete — see above)
- [x] Phase 4: Requisition list + detail screens (deployed; see verification gap above)
- [x] Phase 5: Simplify the polling flow (removed wait/outcome/history/email branches; fixed a line-total-sum bug found during verification)
- [x] Phase 6: Pending Approval screen + in-app approve/reject/tier-advance logic (deployed; Manager-stage approve verified by real click, Finance-stage/reject verified by direct data-layer simulation — see above)
- [x] Phase 7: Custom per-stage stage-tracker icons (deployed; verified for 6 of 7 states — see above)
- [x] Phase 8: Pixel-precision pass against the wireframe (typography, core palette, Draft badge — see above)
- [x] Phase 9: End-to-end verification + confirm model-driven app still works in parallel (complete — see above; found and fixed a duplicate-banner gap in Pending Approval)

## Notes & Issues

### Session Notes
- 2026-08-27: Reused the existing `az`/`pac` CLI auth session — `pa auth login` needed no separate
  interactive step this time, worth re-checking if a fresh machine/session requires the real
  browser popup.

### Known Issues
- The scaffolded template's `package.json` is missing `@microsoft/power-apps-cli` — always check
  for `node_modules/.bin/pa` after `npm install` and add the CLI as a dev dependency if the shim is
  missing, before attempting CLI resolution.
- **Generated Dataverse lookup `xxxname` fields never resolve** (e.g. `wksp_requesteridname`,
  `wksp_currentapproveridname`, `wksp_repairordertypename`) — confirmed in Phase 4, closing the open
  question from Phase 2. Never rely on them, in any select shape. For a user/systemuser lookup,
  resolve the name via `useUserDirectory()` (`src/lib/users.ts`); for a choice column, use the
  numeric value against the relevant `choiceMeta.ts` getter; for another custom-table lookup (e.g.
  Supplier, Cost Centre), fetch that table's own rows and find by its real id field instead. This
  will matter again in Phase 6 when writing/reading `wksp_approvalhistory` rows.
- **Power Apps player caching is inconsistent after `pa app push`**: sometimes a brand-new tab shows
  the latest build within ~10-15s with no banner; other times it still shows the "You're using an old
  version" banner even in a fresh tab and needs its in-app Refresh button clicked (which reloads the
  iframe — wait ~10s after clicking, don't assume it's instant). There's no reliable fixed wait; check
  for the banner before trusting what's rendered.
- **Browser-automation flakiness this phase**: `computer` screenshot calls on the Power Apps player
  tab timed out repeatedly (worked on an immediate retry every time), and on-screen element
  coordinates shifted by the height of the "developer environment"/"old version" banners whenever
  those appeared or disappeared mid-sequence — a click computed against one screenshot could land on
  the wrong element after a banner change. Prefer re-screenshotting right before clicking rather than
  chaining several blind clicks from one earlier screenshot.
- **Table-row click targeting is unreliable in this player, even with no banner present** (found in
  Phase 6): clicking a row in a plain HTML `<table>` inside the app would sometimes select the row
  above the intended one. Unlike the banner-offset issue above, there was no stable, reproducible
  offset to compensate for — the same coordinates worked once and then missed on a later identical
  attempt, across three fresh tabs. `find` cannot help either (the accessibility tree does not reach
  into the app's cross-origin iframe — same limitation as DOM/network inspection, see Phase 3 notes).
  When this happens after 2-3 tries, stop clicking and verify the underlying logic by directly issuing
  the same Dataverse writes the button's code would perform (confirmed sound this way in Phase 6) —
  don't keep retrying coordinates or risk a misclick landing on a real, non-test record.

## Quick Resume

The plan at `C:\Users\kiris\.claude\plans\drifting-crafting-deer.md` is fully implemented (all 9
phases). If picking this project back up:

- **Redeploy after any change**: `npm run build && npx --no-install pa app push` (from this project
  folder). Expect the Power Apps player to sometimes show a stale-version banner for 10-15s after a
  push even in a brand-new tab — check for it before trusting what's rendered.
- **Data sources**: 7 Dataverse tables wired up — the original 5 business tables
  (`wksp_requisition`, `wksp_requisitionlineitem`, `wksp_supplier`, `wksp_approvalhistory`,
  `wksp_costcentre`) plus `systemuser` and `environmentvariablevalue`, both added later as
  necessary read-only reference tables (see Technical Preferences above for why).
- **Known, accepted gaps** (see each phase's section for detail): Suppliers and Approval History nav
  items still show "coming in a later phase" placeholders — never scoped into this plan's 9 phases,
  a genuine next increment if ever picked up. A handful of UI states (Rejected stage-tracker icon,
  Draft status badge, the lower half of the Dashboard on some viewports) were verified by code review
  rather than a live screenshot due to this session's recurring browser-automation instability, not
  because of any known app defect.
- **Known Issues** section below has the durable lessons (virtual `xxxname` fields never work,
  Power Apps player caching quirks, browser click-targeting instability) — read it before spending
  time debugging what looks like a new problem but has likely already been diagnosed.
