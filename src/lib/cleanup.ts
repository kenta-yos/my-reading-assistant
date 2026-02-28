import { prisma } from './prisma'

/**
 * 作成から 14 日超のガイドを削除する。
 */
export async function cleanupExpiredGuides() {
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

  await prisma.guide.deleteMany({
    where: {
      createdAt: { lt: twoWeeksAgo },
    },
  })
}
