import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
    try {
        const sqlPath = path.resolve(__dirname, '../supabase-fixes.sql')
        const sqlFile = fs.readFileSync(sqlPath, 'utf8')

        console.log("Executing SQL statements...")

        // Splitting by ';' is a simplified approach.
        // IMPORTANT CONSTRAINT: The SQL file must NOT contain semicolons inside
        // strings, dollar-quoted blocks, or PL/pgSQL bodies. For complex SQL,
        // use a dedicated migration tool (e.g., flyway, Supabase CLI, or pg client.query).
        const statements = sqlFile.split(';').map(s => s.trim()).filter(Boolean);
        for (const statement of statements) {
            await prisma.$executeRawUnsafe(statement);
        }

        console.log("Successfully executed supabase-fixes.sql")
    } catch (error) {
        console.error("Failed to execute SQL:", error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main().catch(console.error)
