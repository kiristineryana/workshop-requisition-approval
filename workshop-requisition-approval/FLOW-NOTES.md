# Power Automate flow status

## Active flow
- **Name:** Workshop Requisition Approval Routing v2
- **Flow ID:** `afb168da-3ca1-f111-b8de-002248e81844`
- **Environment:** my_dev (`00000000-0000-0000-0000-000000000000`)
- **State:** Started
- **Definition:** `flow-approval-routing.json` in this directory matches this flow's live definition exactly.

## Superseded flow
- **Name:** Workshop Requisition Approval Routing
- **Flow ID:** `b0afcb83-9fa0-f111-b8de-002248e81844`
- **State:** Disabled (kept, not deleted, in case it's useful for a future Microsoft support case)

## Known issue: trigger never fires

Neither flow's Dataverse trigger ("When a row is added, modified or deleted" on the
Requisition table, filtered on `wksp_status`) actually dispatches on real Create/Update
events, despite being fully verified correct:

- Flow state = Started, confirmed via both the Dataverse `workflows` table and the Power
  Automate management API.
- All three connections (Dataverse, Office 365 Outlook, Approvals) show `Connected`.
- The Dataverse `callbackregistrations` row is present with the correct `entityname`
  (`wksp_requisition`), `message` (Added or Modified), `scope` (Organization), and
  `filteringattributes` (`wksp_status`).
- Real test updates were pushed directly via the Dataverse Web API multiple times across
  both flows; run history stayed empty every time.
- Critically, Dataverse's own `asyncoperations` table shows **zero dispatch attempts** for
  any of the test updates — the trigger never leaves Dataverse, so this isn't a Power
  Automate consumption problem.
- A brand-new flow (different flow ID, fresh subscription) was built from scratch to rule
  out the original flow's ID/history being poisoned — same result.

**Conclusion:** this looks like an environment-level fault in the Dataverse webhook-trigger
dispatch service for `my_dev`, not a flow configuration issue. Next step is a
Microsoft support case (see chat history for the full diagnostic summary already drafted).

Until Microsoft resolves this, the approval routing logic itself (tiered approver
selection, Approvals connector integration, Outlook notifications, approval history
logging) is fully built and correct — it simply never gets invoked because the trigger
doesn't fire.
