import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
  }

  const userId = session.user.id

  // ブックマーク、ユーザー使用量、ユーザー本体を削除
  // ガイドはuserIdをnullにする（他ユーザーが閲覧中の可能性）
  await prisma.bookmark.deleteMany({ where: { userId } })
  await prisma.userUsage.deleteMany({ where: { userId } })
  await prisma.guide.updateMany({ where: { userId }, data: { userId: null } })
  await prisma.user.delete({ where: { id: userId } })

  return NextResponse.json({ ok: true })
}
