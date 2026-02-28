import * as fs from 'fs'
import * as path from 'path'
import { Client } from 'pg'

async function main() {
    const sqlPath = path.resolve(__dirname, '../supabase-fixes.sql')
    const sqlFile = fs.readFileSync(sqlPath, 'utf8')

    console.log("Executing SQL statements...")

    // Use native pg.Client so PostgreSQL handles statement boundaries correctly.
    // This supports multi-statement SQL, dollar-quoted blocks, and PL/pgSQL bodies
    // that would break a naive semicolon-split approach.
    const client = new Client({ connectionString: process.env.DATABASE_URL })
    await client.connect()
    try {
        await client.query('BEGIN')
        await client.query(sqlFile)
        await client.query('COMMIT')
        console.log("Successfully executed supabase-fixes.sql")
    } catch (error) {
        await client.query('ROLLBACK')
        console.error("Failed to execute SQL (rolled back):", error)
        process.exit(1)
    } finally {
        await client.end()
    }
}

main().catch(console.error)
