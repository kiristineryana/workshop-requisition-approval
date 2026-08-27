import { useEffect, useState } from 'react';
import { getContext } from '@microsoft/power-apps/app';
import { SystemusersService } from '../generated/services/SystemusersService';

export type UserDirectory = {
  loading: boolean;
  nameById: Map<string, string>;
  currentUserId: string | null;
};

// The generated Dataverse client never returns lookup "xxxname" virtual fields
// (confirmed: full-entity fetches of wksp_requisition omit wksp_requesteridname
// even though the underlying _wksp_requesterid_value is populated). Systemuser's
// `fullname` is a real column, so resolving requester/approver display names goes
// through this directory instead of relying on the SDK's (non-functional) name fields.
export function useUserDirectory(): UserDirectory {
  const [nameById, setNameById] = useState<Map<string, string>>(new Map());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      SystemusersService.getAll({
        select: ['systemuserid', 'fullname', 'azureactivedirectoryobjectid'],
        maxPageSize: 1000,
      }),
      getContext().catch(() => null),
    ]).then(([usersResult, ctx]) => {
      if (cancelled) return;
      const map = new Map<string, string>();
      let matchedId: string | null = null;
      if (usersResult.success) {
        for (const u of usersResult.data ?? []) {
          if (u.fullname) map.set(u.systemuserid, u.fullname);
          if (
            ctx &&
            ctx.user.objectId &&
            u.azureactivedirectoryobjectid &&
            u.azureactivedirectoryobjectid.toLowerCase() === ctx.user.objectId.toLowerCase()
          ) {
            matchedId = u.systemuserid;
          }
        }
      }
      setNameById(map);
      setCurrentUserId(matchedId);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { loading, nameById, currentUserId };
}
