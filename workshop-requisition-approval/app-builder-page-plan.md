# Genpage Plan

## User Requirements
Raise, route, and approve workshop purchase requisitions with a full audit trail.

## Working Directory
C:/Users/kiris/Desktop/mdapp/workshop-requisition-approval

## Plugin Root
C:/Users/kiris/.claude/plugins/cache/power-platform-skills/model-apps/2.4.4

## Environment
- URL: https://yourorg.crm.dynamics.com/
- App: Workshop Purchase Requisition &amp; Approval System
- Languages: en-US
- Solution: WorkshopRequisitionApproval
- Publisher Prefix: wksp
- Mode: app-builder

## Pages
| Page | Key | File | Purpose | Entities |
|------|-----|------|---------|----------|
| Requisition Analytics | requisition-analytics | requisition-analytics.tsx | KPI overview of requisitions by status, value tier, and month, with a quick view of what is currently pending approval. | wksp_requisition |

## Entity Creation Required
No entity creation required — all entities already exist.

## Existing Entities
wksp_requisition

## Connector Bindings
No connector bindings.

## Design Preferences
- Styling: Fluent UI V9 defaults; clean, content-first layout
- Features: Search, sorting and filtering where the page lists records
- Accessibility: WCAG AA (ARIA labels, keyboard navigation, semantic HTML)

## Relevant Samples
| Page | Sample | Reason |
|------|--------|--------|
| Requisition Analytics | 9-list-with-caching.tsx | Dataverse-bound page: queryTable + DataTable rows with the on-mount de-dupe cache |

## Per-Page Specifications

### Requisition Analytics
- **Key:** requisition-analytics
- **File:** requisition-analytics.tsx
- **Purpose:** KPI overview of requisitions by status, value tier, and month, with a quick view of what is currently pending approval.
- **Entities:** wksp_requisition
- **Needs caching:** true
- **Key Features:** KPI overview of requisitions by status, value tier, and month, with a quick view of what is currently pending approval.
- **Components:** Fluent UI V9 (unsized Regular/Filled icons only)
- **Layout:** Responsive flexbox/grid with relative units (never 100vh/100vw)
- **Data Binding:** dataApi.queryTable / retrieveRow over the entities above
- **Interactions:** In-page interactions only (no cross-page navigation)
