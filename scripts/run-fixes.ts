import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
    try {
        const sqlPath = path.resolve(__dirname, '../supabase-fixes.sql')
        const sqlFile = fs.readFileSync(sqlPath, 'utf8')

        console.log("Executing SQL statements...")

        // Prisma requires raw queries to be executed somewhat carefully
        // We can't just pass the whole file with multiple statements easily using $executeRawUnsafe always
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
