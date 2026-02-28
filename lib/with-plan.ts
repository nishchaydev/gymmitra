import { getAuthGym, AuthContext } from '@/lib/auth'

export type SaaSPlan = 'BASIC' | 'GROWTH' | 'ENTERPRISE'

const planHierarchy: Record<SaaSPlan, number> = {
    BASIC: 0,
    GROWTH: 1,
    ENTERPRISE: 2
}

/**
 * Higher-Order Function to strictly enforce SaaS Plan tiers
 * for Server Actions.
 *
 * @param minimumPlan - The minimum SaaS plan required to execute this action.
 * @param action - The actual async Server Action to execute.
 */
export function withPlan<TArgs extends any[], TReturn>(
    minimumPlan: SaaSPlan,
    action: (context: AuthContext, ...args: TArgs) => Promise<TReturn>
) {
    return async (...args: TArgs): Promise<TReturn> => {
        // 1. Strictly derive Context (and SaaS plan) from the Server Session
        const context = await getAuthGym()

        if (!context) {
            throw new Error('Unauthorized: Authentication required.')
        }

        const currentPlanLevel = planHierarchy[context.gym.saasPlan as SaaSPlan] ?? -1
        const requiredPlanLevel = planHierarchy[minimumPlan]

        // 2. Enforce SaaS Tier Access
        if (currentPlanLevel < requiredPlanLevel) {
            console.warn(`[SaaS ENFORCEMENT] Gym ${context.gym.id} attempted to access ${minimumPlan} feature while on ${context.gym.saasPlan} plan.`)
            throw new Error(`Upgrade Required: This action requires the ${minimumPlan} plan or higher.`)
        }

        // 3. Execute the action, passing the secure context down
        return action(context, ...args)
    }
}
