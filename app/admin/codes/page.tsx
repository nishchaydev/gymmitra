import { getCodes } from './actions'
import CodeGenerator from './CodeGenerator'

export default async function AdminCodesPage() {
    const codes = await getCodes()
    
    return (
        <div className="container mx-auto p-4 md:p-8 max-w-6xl">
            <h1 className="text-3xl font-bold mb-2">License Codes Management</h1>
            <p className="text-muted-foreground mb-8 text-sm">
                Generate and manage registration codes for gyms to unlock Trial or Premium access.
            </p>
            <CodeGenerator initialCodes={codes} />
        </div>
    )
}
