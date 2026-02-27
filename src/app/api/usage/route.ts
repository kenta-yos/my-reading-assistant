import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const DAILY_LIMIT = 200

function getTodayJST(): string {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000)
  return jst.toISOString().split('T')[0]
}

export async function GET() {
  const today = getTodayJST()
  const usage = await prisma.apiUsage.findUnique({ where: { date: today } })
  return NextResponse.json({
    date: today,
    count: usage?.count ?? 0,
    limit: DAILY_LIMIT,
    blocked: usage?.blocked ?? false,
    remaining: Math.max(0, DAILY_LIMIT - (usage?.count ?? 0)),
  })
}
