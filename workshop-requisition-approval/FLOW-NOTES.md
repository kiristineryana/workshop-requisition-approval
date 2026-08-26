# Power Automate flow status

## Active flow (polling workaround)
- **Name:** Workshop Requisition Approval Routing (Polling)
- **Flow ID:** `1a166da3-40a1-f111-b8de-002248e81844`
- **Environment:** my_dev (`00000000-0000-0000-0000-000000000000`)
- **State:** Started
- **Trigger:** Recurrence, every 5 minutes → List Rows (Requisitions, filtered
  `wksp_status eq 100000001`) → Apply to each → same tiered-approval logic as the
  original design (every `triggerBody()` reference converted to
  `items('Apply_to_each_Requisition')`).
- **Definition:** `flow-approval-routing.json` in this directory matches this flow's
  live definition exactly.
- **Verified working end-to-end** on 2026-08-26: run `08584138634098713044603438425CU16`
  picked up REQ-001000 (a leftover Submitted test record), correctly summed its line
  items, set Total Value/Value Tier/Status → In Approval, resolved and assigned the
  Supervisor as Current Approver, and reached the Approvals connector wait step —
  confirmed via direct Dataverse query (`modifiedon`, `wksp_status`,
  `_wksp_currentapproverid_value` all updated as expected).
- Polling interval is 5 minutes — adjust `triggers.Recurrence.recurrence.interval` if a
  faster or slower cadence is wanted. This trades near-real-time response for reliability,
  since the native Dataverse webhook trigger is broken in this environment (see below).

## Superseded/disabled flows
- **Workshop Requisition Approval Routing** (original webhook-trigger flow)
  Flow ID `b0afcb83-9fa0-f111-b8de-002248e81844` — Disabled. Kept for reference /
  possible Microsoft support case.
- **Workshop Requisition Approval Routing v2** (rebuilt webhook-trigger flow, same issue)
  Flow ID `afb168da-3ca1-f111-b8de-002248e81844` — Disabled. Kept for reference /
  possible Microsoft support case.

## Known issue: Dataverse webhook trigger never fires (root cause of the switch to polling)

Both webhook-trigger flows above ("When a row is added, modified or deleted" on the
Requisition table, filtered on `wksp_status`) never actually dispatched on real
Create/Update events, despite being fully verified correct:

- Flow state = Started, confirmed via both the Dataverse `workflows` table and the Power
  Automate management API.
- All three connections (Dataverse, Office 365 Outlook, Approvals) show `Connected`.
- The Dataverse `callbackregistrations` row was present with the correct `entityname`
  (`wksp_requisition`), `message` (Added or Modified), `scope` (Organization), and
  `filteringattributes` (`wksp_status`).
- Real test updates were pushed directly via the Dataverse Web API multiple times across
  both flows; run history stayed empty every time.
- Dataverse's own `asyncoperations` table showed **zero dispatch attempts** for any of the
  test updates — the trigger never left Dataverse, so this wasn't a Power Automate
  consumption problem. A brand-new flow (different flow ID, fresh subscription) was built
  from scratch to rule out the original flow's ID/history being poisoned — same result.

**Conclusion:** environment-level fault in the Dataverse webhook-trigger dispatch service
for `my_dev`, not a flow configuration issue. A Microsoft support case is the
recommended path to get the webhook trigger working again; until then, the polling flow
above is the active, working implementation of the approval routing logic.
