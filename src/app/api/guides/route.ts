import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const guides = await prisma.guide.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      inputType: true,
      inputValue: true,
      summary: true,
      createdAt: true,
    },
  })
  return NextResponse.json(guides)
}
