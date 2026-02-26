import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
    try {
        const sqlPath = path.join(process.cwd(), 'supabase-fixes.sql')
        const sqlFile = fs.readFileSync(sqlPath, 'utf8')

        console.log("Executing SQL statements...")

        // Prisma requires raw queries to be executed somewhat carefully
        // We can't just pass the whole file with multiple statements easily using $executeRawUnsafe always
        // PostgreSQL usually accepts it if it's a single string, but let's try.
        await prisma.$executeRawUnsafe(sqlFile)

        console.log("Successfully executed supabase-fixes.sql")
    } catch (error) {
        console.error("Failed to execute SQL:", error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
