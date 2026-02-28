import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
  const { id } = await params
  await prisma.guide.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
