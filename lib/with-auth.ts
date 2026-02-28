import { getAuthGym, AuthContext } from '@/lib/auth'

/**
 * Higher-Order Function to strictly enforce Tenant Isolation and Role Authorization
 * for Server Actions.
 * 
 * Guarantees that the `gymId` is strictly derived from the verified user session,
 * and never from a client payload (mitigating cross-tenant data mutation risks).
 *
 * @param action - The actual async Server Action to execute.
 * @param allowedRoles - (Optional) Array of Roles allowed to execute this action.
 *                       If omitted, any authenticated staff/owner can perform it.
 */
export function withAuth<TArgs extends any[], TReturn>(
    action: (context: AuthContext, ...args: TArgs) => Promise<TReturn>,
    allowedRoles?: AuthContext['role'][]
) {
    return async (...args: TArgs): Promise<TReturn> => {
        // 1. Strictly derive Context (and gymId) from the Server Session
        let context;
        try {
            context = await getAuthGym()
        } catch (e) {
            console.error('[withAuth] Error resolving gym context', e)
        }

        if (!context) {
            throw new Error('Unauthorized: Authentication required.')
        }

        // 2. Enforce Role-Based Access Control (RBAC)
        if (allowedRoles && allowedRoles.length > 0) {
            if (!allowedRoles.includes(context.role)) {
                // Log unauthorized access attempts for audit trails
                const maskedUserId = context.userId ? `${context.userId.substring(0, 8)}***` : 'unknown'
                console.warn(`[SECURITY] Unauthorized role attempt. UserId: ${maskedUserId}, Role: ${context.role}, Target Roles: ${allowedRoles.join(',')}`)
                throw new Error('Forbidden: You do not have permission to perform this action.')
            }
        }

        // 3. Execute the action, passing the secure context down
        return action(context, ...args)
    }
}
