import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').filter(Boolean)

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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
  }

  const { id } = await params
  const guide = await prisma.guide.findUnique({ where: { id } })
  if (!guide) {
    return NextResponse.json({ error: 'ガイドが見つかりません' }, { status: 404 })
  }

  const isAdmin = ADMIN_EMAILS.includes(session.user.email ?? '')
  if (guide.userId !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 })
  }

  await prisma.guide.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
