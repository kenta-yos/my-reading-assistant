import { prisma } from './prisma'

/**
 * expiresAt を過ぎたガイドを削除する。
 */
export async function cleanupExpiredGuides() {
  await prisma.guide.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  })
}
