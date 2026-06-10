import { prisma } from "@/lib/prisma";

import type { NotificationType } from "@prisma/client";



export async function createNotification(input: {

  userId: string;

  type: NotificationType;

  title: string;

  body: string;

  definitionId?: string | null;

  changeRequestId?: string | null;

}) {

  return prisma.notification.create({

    data: {

      userId: input.userId,

      type: input.type,

      title: input.title,

      body: input.body,

      definitionId: input.definitionId ?? null,

      changeRequestId: input.changeRequestId ?? null,

    },

  });

}



export async function notifyApproverAssigned(

  approverId: string,

  definitionId: string,

  definitionName: string,

  assignedByName: string

) {

  return createNotification({

    userId: approverId,

    type: "APPROVER_ASSIGNED",

    title: "You were assigned as approver",

    body: `${assignedByName} assigned you as approver on "${definitionName}".`,

    definitionId,

  });

}



export async function notifyApprovalRequest(

  approverId: string,

  definitionId: string,

  definitionName: string,

  requesterName: string,

  changeRequestId: string,

  description: string

) {

  const existing = await prisma.notification.findFirst({

    where: {

      userId: approverId,

      changeRequestId,

      type: "APPROVAL_REQUEST",

    },

  });

  if (existing) return existing;



  return createNotification({

    userId: approverId,

    type: "APPROVAL_REQUEST",

    title: "Approval requested",

    body: `${requesterName} requested approval for "${definitionName}": ${description}`,

    definitionId,

    changeRequestId,

  });

}



/** Notify approver for every pending change request on a definition (e.g. after approver is assigned). */

export async function notifyPendingApprovalRequests(

  definitionId: string,

  approverId: string,

  definitionName: string

) {

  const pending = await prisma.changeRequest.findMany({

    where: { definitionId, status: "PENDING" },

    include: { requestedBy: true },

  });



  for (const cr of pending) {

    await notifyApprovalRequest(

      approverId,

      definitionId,

      definitionName,

      cr.requestedBy.name,

      cr.id,

      cr.changeDescription

    );

  }

}


