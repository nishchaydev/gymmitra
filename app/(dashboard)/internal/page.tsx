import ManualTrialGenerator from "./components/ManualTrialGenerator"

export const metadata = {
    title: 'Internal Admin Panel | GymMitra',
    description: 'Internal tools for GymMitra staff and developers.',
}

export default function InternalPage() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">Internal Admin</h1>
                <p className="text-muted-foreground">
                    System-level management tools. Only accessible to whitelisted administrators.
                </p>
            </div>
            
            <div className="grid gap-6">
                <ManualTrialGenerator />
            </div>
        </div>
    )
}
