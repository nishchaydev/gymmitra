import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

export type AuditAction =
    | 'LOGIN'
    | 'SIGNUP'
    | 'CREATE_MEMBER'
    | 'UPDATE_MEMBER'
    | 'DELETE_MEMBER'
    | 'CREATE_INVOICE'
    | 'PROCESS_SALE'
    | 'ONBOARDING_COMPLETE'
    | 'PLAN_UPGRADE'
    | 'CHECKIN_MEMBER'
    | 'CREATE_PRODUCT'
    | 'UPDATE_PRODUCT'
    | 'DELETE_PRODUCT'
    | 'IMPORT_PRODUCTS'
    | 'IMPORT_MEMBERS'
    | 'CREATE_LEAD'
    | 'CONVERT_LEAD'
    | 'CREATE_STAFF'
    | 'UPDATE_STAFF'
    | 'DELETE_STAFF'
    | 'EXPORT_DATA';

export interface AuditLogParams {
    gymId: string;
    actorId: string;
    action: AuditAction;
    entityType: string;
    entityId?: string;
    payload?: Record<string, unknown> | null;
    ipAddress?: string;
}

/**
 * Enterprise-grade internal audit logger.
 * async but not awaited by default to minimize request latency.
 */
export async function recordAuditLog(params: AuditLogParams, tx?: Prisma.TransactionClient) {
    try {
        const client = tx || prisma
        await client.auditLog.create({
            data: {
                gymId: params.gymId,
                actorId: params.actorId,
                action: params.action,
                entityType: params.entityType,
                entityId: params.entityId,
                payload: params.payload ? (params.payload as Prisma.InputJsonObject) : undefined,
                ipAddress: params.ipAddress,
            }
        });
    } catch (error) {
        // We don't want audit logging failures to crash the main application flow, 
        // but in a production environment, this should trigger an alert.
        console.error('[AuditLog Error]:', error);
    }
}
