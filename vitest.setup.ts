import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended'
import { PrismaClient } from '@prisma/client'
import { prisma } from './lib/prisma'

vi.mock('./lib/prisma', () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}))

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>

vi.stubGlobal('prisma', prismaMock)

beforeEach(() => {
  mockReset(prismaMock)
})
