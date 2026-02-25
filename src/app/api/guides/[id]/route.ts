import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getEndOfTodayJST } from '@/lib/cleanup'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const guide = await prisma.guide.findUnique({ where: { id } })
  if (!guide) {
    return NextResponse.json({ error: 'ガイドが見つかりません' }, { status: 404 })
  }
  return NextResponse.json(guide)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { bookmarked } = (await request.json()) as { bookmarked: boolean }

  const guide = await prisma.guide.findUnique({ where: { id } })
  if (!guide) {
    return NextResponse.json({ error: 'ガイドが見つかりません' }, { status: 404 })
  }

  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
  const isOld = guide.createdAt < twoWeeksAgo

  // ブックマークを外した & 2週間以上経過 → 今日の終わりに削除予約
  const scheduledDeleteAt =
    !bookmarked && isOld ? getEndOfTodayJST() : null

  const updated = await prisma.guide.update({
    where: { id },
    data: {
      bookmarked,
      scheduledDeleteAt: bookmarked ? null : scheduledDeleteAt,
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.guide.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
