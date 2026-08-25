// ---------------- Type Definitions which can be imported from ./RuntimeTypes -------------------------
export interface TableRegistrations extends BaseTableRegistrations {
    "wksp_requisition": wksp_requisition,
}
export interface EnumRegistrations extends BaseEnumRegistrations {
    "wksp_requisition-statecode": wksp_requisition_statecode,
    "wksp_requisition-statuscode": wksp_requisition_statuscode,
    "wksp_requisition-wksp_status": wksp_requisition_wksp_status,
    "wksp_requisition-wksp_valuetier": wksp_requisition_wksp_valuetier,
}
export type wksp_requisition = TableRow<{
    // Primary Key Column
    readonly wksp_requisitionid: string,
    readonly createdbyname: string,
    readonly createdbyyominame: string,
    readonly createdonbehalfbyname: string,
    readonly createdonbehalfbyyominame: string,
    readonly exchangerate: number,
    readonly modifiedbyname: string,
    readonly modifiedbyyominame: string,
    readonly modifiedonbehalfbyname: string,
    readonly modifiedonbehalfbyyominame: string,
    readonly owningbusinessunitname: string,
    statecode: wksp_requisition_statecode,
    statuscode: wksp_requisition_statuscode,
    // Foreign Key Column
    readonly _transactioncurrencyid_value: `/transactioncurrency(${string})`,
    readonly transactioncurrencyidname: string,
    // Foreign Key Column
    readonly _wksp_currentapproverid_value: `/systemuser(${string})`,
    readonly wksp_currentapproveridname: string,
    readonly wksp_currentapproveridyominame: string,
    wksp_datesubmitted: Date,
    wksp_justification: string,
    // Foreign Key Column
    readonly _wksp_requesterid_value: `/systemuser(${string})`,
    readonly wksp_requesteridname: string,
    readonly wksp_requesteridyominame: string,
    wksp_requisitionnumber: string,
    wksp_status: wksp_requisition_wksp_status,
    // Foreign Key Column
    readonly _wksp_supplierid_value: `/wksp_supplier(${string})`,
    readonly wksp_supplieridname: string,
    wksp_totalvalue: number,
    readonly wksp_totalvalue_base: number,
    wksp_valuetier: wksp_requisition_wksp_valuetier,
}>

const enum wksp_requisition_statecode {
"Active" = 0,
"Inactive" = 1,
}
const enum wksp_requisition_statuscode {
"Active" = 1,
"Inactive" = 2,
}
const enum wksp_requisition_wksp_status {
"Draft" = 100000000,
"Submitted" = 100000001,
"In Approval" = 100000002,
"Approved" = 100000003,
"Rejected" = 100000004,
"Ordered" = 100000005,
"Received" = 100000006,
}
const enum wksp_requisition_wksp_valuetier {
"Under 1,000 AED" = 100000000,
"1,000-10,000 AED" = 100000001,
"Above 10,000 AED" = 100000002,
}

export interface UxAgentDataApi extends BaseUxAgentDataApi<TableRegistrations, EnumRegistrations> {}

export interface GeneratedComponentProps {
    dataApi: UxAgentDataApi;
}

