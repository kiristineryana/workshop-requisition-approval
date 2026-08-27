import { EnvironmentvariablevaluesService } from '../generated/services/EnvironmentvariablevaluesService';
import { SystemusersService } from '../generated/services/SystemusersService';

// Same three environment variable definitions the (now-simplified) approval-routing flow uses to
// resolve Supervisor/Manager/Finance. Mirrors Get_Supervisor_Email / Get_Manager_Email_* /
// Get_Finance_Email in `Workshop Requisition Approval Routing (Polling)`.
const FINANCE_ENV_VAR_DEFINITION_ID = 'f5ebef69-9da0-f111-b8de-002248e81844';

// Resolves the Finance Controller's systemuserid via the same env-var -> email -> systemuser
// lookup the flow used to perform, for the Manager -> Finance hand-off on the Above-10,000 AED
// tier. Returns null if the environment variable or the matching user can't be found.
export async function resolveFinanceApproverId(): Promise<{ userId: string; fullName: string | null } | null> {
  const envResult = await EnvironmentvariablevaluesService.getAll({
    filter: `_environmentvariabledefinitionid_value eq ${FINANCE_ENV_VAR_DEFINITION_ID}`,
    select: ['value'],
    top: 1,
  });
  const email = envResult.success ? envResult.data?.[0]?.value : undefined;
  if (!email) return null;

  const userResult = await SystemusersService.getAll({
    filter: `internalemailaddress eq '${email}'`,
    select: ['systemuserid', 'fullname'],
    top: 1,
  });
  const user = userResult.success ? userResult.data?.[0] : undefined;
  if (!user) return null;

  return { userId: user.systemuserid, fullName: user.fullname ?? null };
}
