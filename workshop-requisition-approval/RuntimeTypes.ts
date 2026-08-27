// ---------------- Type Definitions which can be imported from ./RuntimeTypes -------------------------
export interface TableRegistrations extends BaseTableRegistrations {
    "wksp_requisition": wksp_requisition,
}
export interface EnumRegistrations extends BaseEnumRegistrations {
    "wksp_requisition-statecode": wksp_requisition_statecode,
    "wksp_requisition-statuscode": wksp_requisition_statuscode,
    "wksp_requisition-wksp_paymentterms": wksp_requisition_wksp_paymentterms,
    "wksp_requisition-wksp_priority": wksp_requisition_wksp_priority,
    "wksp_requisition-wksp_repairordertype": wksp_requisition_wksp_repairordertype,
    "wksp_requisition-wksp_risklevel": wksp_requisition_wksp_risklevel,
    "wksp_requisition-wksp_status": wksp_requisition_wksp_status,
    "wksp_requisition-wksp_valuetier": wksp_requisition_wksp_valuetier,
    "wksp_requisition-wksp_vehicleoffroad": wksp_requisition_wksp_vehicleoffroad,
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
    wksp_ageinapprovalhours: number,
    wksp_branchworkshop: string,
    // Foreign Key Column
    readonly _wksp_costcentreid_value: `/wksp_costcentre(${string})`,
    readonly wksp_costcentreidname: string,
    // Foreign Key Column
    readonly _wksp_currentapproverid_value: `/systemuser(${string})`,
    readonly wksp_currentapproveridname: string,
    readonly wksp_currentapproveridyominame: string,
    wksp_customername: string,
    wksp_datesubmitted: Date,
    // Foreign Key Column
    _wksp_duplicateofid_value: `/wksp_requisition(${string})`,
    readonly wksp_duplicateofidname: string,
    wksp_jobcardnumber: string,
    wksp_justification: string,
    wksp_odometerkm: number,
    wksp_paymentterms: wksp_requisition_wksp_paymentterms,
    wksp_priority: wksp_requisition_wksp_priority,
    wksp_quotesattached: number,
    wksp_regnovin: string,
    wksp_repairordertype: wksp_requisition_wksp_repairordertype,
    // Foreign Key Column
    readonly _wksp_requesterid_value: `/systemuser(${string})`,
    readonly wksp_requesteridname: string,
    readonly wksp_requesteridyominame: string,
    wksp_requiredby: Date,
    wksp_requisitionnumber: string,
    wksp_risklevel: wksp_requisition_wksp_risklevel,
    wksp_riskscore: number,
    wksp_status: wksp_requisition_wksp_status,
    // Foreign Key Column
    readonly _wksp_supplierid_value: `/wksp_supplier(${string})`,
    readonly wksp_supplieridname: string,
    wksp_totalvalue: number,
    readonly wksp_totalvalue_base: number,
    wksp_valuetier: wksp_requisition_wksp_valuetier,
    wksp_vehiclemodelyear: string,
    wksp_vehicleoffroad: wksp_requisition_wksp_vehicleoffroad,
}>

const enum wksp_requisition_statecode {
"Active" = 0,
"Inactive" = 1,
}
const enum wksp_requisition_statuscode {
"Active" = 1,
"Inactive" = 2,
}
const enum wksp_requisition_wksp_paymentterms {
"30 Days Credit" = 100000000,
"60 Days Credit" = 100000001,
"Cash" = 100000002,
}
const enum wksp_requisition_wksp_priority {
"Urgent" = 100000000,
"Normal" = 100000001,
"Low" = 100000002,
}
const enum wksp_requisition_wksp_repairordertype {
"Customer Pay" = 100000000,
"Warranty" = 100000001,
"Internal" = 100000002,
}
const enum wksp_requisition_wksp_risklevel {
"Low" = 100000000,
"Medium" = 100000001,
"High" = 100000002,
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
const enum wksp_requisition_wksp_vehicleoffroad {
"No" = 0,
"Yes" = 1,
}

export interface UxAgentDataApi extends BaseUxAgentDataApi<TableRegistrations, EnumRegistrations> {}

export interface GeneratedComponentProps {
    dataApi: UxAgentDataApi;
}

