import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: session.user.id },
    include: {
      guide: {
        select: {
          id: true,
          title: true,
          inputType: true,
          inputValue: true,
          summary: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(bookmarks)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
  }

  const { guideId } = await request.json()
  if (!guideId) {
    return NextResponse.json({ error: 'guideId が必要です' }, { status: 400 })
  }

  const bookmark = await prisma.bookmark.upsert({
    where: {
      userId_guideId: { userId: session.user.id, guideId },
    },
    create: { userId: session.user.id, guideId },
    update: {},
  })

  return NextResponse.json(bookmark)
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
  }

  const { guideId } = await request.json()
  if (!guideId) {
    return NextResponse.json({ error: 'guideId が必要です' }, { status: 400 })
  }

  await prisma.bookmark.deleteMany({
    where: { userId: session.user.id, guideId },
  })

  return NextResponse.json({ ok: true })
}
