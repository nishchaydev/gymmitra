import { getAuthGym, AuthContext } from '@/lib/auth'

export type SaaSPlan = 'TRIAL' | 'MAIN_PLAN'

const planHierarchy: Record<SaaSPlan, number> = {
    TRIAL: 0,
    MAIN_PLAN: 1,
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

        const currentPlan = context.gym.saasPlan as SaaSPlan
        const currentPlanLevel = planHierarchy[currentPlan] ?? -1
        const requiredPlanLevel = planHierarchy[minimumPlan]

        // 2. Enforce SaaS Tier Access
        if (currentPlanLevel < requiredPlanLevel) {
            console.warn(`[SaaS ENFORCEMENT] Gym ${context.gym.id} attempted to access ${minimumPlan} feature while on ${context.gym.saasPlan} plan.`)
            throw new Error(`Upgrade Required: This action requires the ${minimumPlan} plan or higher.`)
        }

        // 3. TRIAL EXPIRATION CHECK
        if (currentPlan === 'TRIAL' && context.gym.trialExpiresAt) {
            const hasExpired = new Date() > new Date(context.gym.trialExpiresAt)
            if (hasExpired) {
                console.warn(`[TRIAL EXPIRED] Gym ${context.gym.id} attempted to perform action after trial expired on ${context.gym.trialExpiresAt}.`)
                throw new Error('Trial Expired: Your 1-month trial has ended. Please activate your license to continue using Gym Mitra.')
            }
        }

        // 4. Execute the action, passing the secure context down
        return action(context, ...args)
    }
}
