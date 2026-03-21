import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database timeout')), 5000)
    )

    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      timeoutPromise
    ])

    return Response.json({ 
      status: 'ok',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('health check failed', error)

    const statusCode = error instanceof Error && error.message === 'Database timeout' ? 504 : 500

    return Response.json(
      { status: 'error' }, 
      { status: statusCode }
    )
  }
}
