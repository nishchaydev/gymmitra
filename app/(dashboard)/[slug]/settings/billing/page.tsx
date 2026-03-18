import { getAuthGym } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { BillingForm } from "./BillingForm";
import { ShieldCheck, Calendar, Clock } from "lucide-react";

export default async function BillingPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const auth = await getAuthGym();
    
    if (!auth || auth.gym.slug !== slug || auth.role !== "OWNER") {
        redirect(`/${slug}/dashboard`);
    }

    const gym = auth.gym;
    const isTrial = gym.saasPlan === "TRIAL";
    const trialDocs = gym.trialExpiresAt;
    const isExpired = Boolean(isTrial && trialDocs && new Date() > new Date(trialDocs));
    
    const trialDaysLeft = trialDocs 
        ? Math.ceil((new Date(trialDocs).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    return (
        <div className="space-y-6 max-w-3xl pb-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
                <p className="text-muted-foreground mt-1">
                    Manage your GymMitra subscription plan and license key.
                </p>
            </div>

            <Card className="border-2 overflow-hidden">
                <div className={`h-2 ${isExpired ? 'bg-destructive' : (isTrial ? 'bg-amber-500' : 'bg-green-500')}`} />
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-xl">Current Plan Status</CardTitle>
                            <CardDescription className="mt-1">
                                Review your active subscription details.
                            </CardDescription>
                        </div>
                        <Badge variant={isExpired ? "destructive" : "default"} className="text-sm px-3 py-1">
                            {gym.saasPlan === "MAIN_PLAN" ? "ACTIVE" : isExpired ? "EXPIRED" : "ACTIVE TRIAL"}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="bg-slate-50 border rounded-lg p-4 flex gap-4">
                            <div className="bg-white p-2 rounded-md shadow-sm border h-fit">
                                <ShieldCheck className={`w-5 h-5 ${gym.saasPlan === "MAIN_PLAN" ? "text-green-600" : "text-amber-600"}`} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Plan Tier</p>
                                <p className="font-semibold text-lg">
                                    {gym.saasPlan === "MAIN_PLAN" ? "PRO Version" : "Trial Version"}
                                </p>
                            </div>
                        </div>

                        <div className="bg-slate-50 border rounded-lg p-4 flex gap-4">
                            <div className="bg-white p-2 rounded-md shadow-sm border h-fit">
                                {isTrial ? <Clock className="w-5 h-5 text-amber-600" /> : <Calendar className="w-5 h-5 text-green-600" />}
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Validity</p>
                                {isTrial ? (
                                    <div className="space-y-0.5">
                                        <p className="font-semibold text-lg leading-tight">
                                            {isExpired ? "Expired" : `${trialDaysLeft} Days Left`}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Ends {format(new Date(trialDocs!), "MMM d, yyyy")}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-0.5">
                                        <p className="font-semibold text-lg leading-tight text-green-700">Lifetime</p>
                                        <p className="text-xs text-muted-foreground">No renewal required</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <BillingForm />
        </div>
    );
}
