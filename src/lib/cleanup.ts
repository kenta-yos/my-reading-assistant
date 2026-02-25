import { prisma } from './prisma'

/** JST で今日の終わり（= 明日 00:00 JST = 今日 15:00 UTC）を返す */
export function getEndOfTodayJST(): Date {
  const nowJSTMs = Date.now() + 9 * 60 * 60 * 1000
  const nowJST = new Date(nowJSTMs)
  const [year, month, day] = nowJST.toISOString().split('T')[0].split('-').map(Number)
  // 明日 00:00 JST = Date.UTC(year, month-1, day+1) - 9h
  return new Date(Date.UTC(year, month - 1, day + 1) - 9 * 60 * 60 * 1000)
}

/**
 * 期限切れのガイドを削除する。
 * - ブックマークなし かつ 作成から 14 日超 → 削除
 * - scheduledDeleteAt が現在時刻を過ぎている → 削除
 */
export async function cleanupExpiredGuides() {
  const now = new Date()
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  await prisma.guide.deleteMany({
    where: {
      OR: [
        {
          bookmarked: false,
          scheduledDeleteAt: null,
          createdAt: { lt: twoWeeksAgo },
        },
        {
          scheduledDeleteAt: { lte: now },
        },
      ],
    },
  })
}
