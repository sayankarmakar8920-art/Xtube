import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Run queries individually with error handling to prevent process crash
    let totalVideos = 0
    let totalViews = 0
    let totalComments = 0
    let totalAds = 0
    let totalUsers = 0
    let adClicks = 0
    let adImpressions = 0
    let recentAnalytics: Array<{ date: Date; views: number; revenue: number; device: string }> = []
    let categoryStats: Array<{ category: string; count: number; views: number }> = []

    try { totalVideos = await db.video.count() } catch {}
    try {
      const viewsAgg = await db.video.aggregate({ _sum: { views: true } })
      totalViews = viewsAgg._sum.views || 0
    } catch {}
    try { totalComments = await db.comment.count() } catch {}
    try { totalAds = await db.ad.count() } catch {}
    try { totalUsers = await db.user.count() } catch {}
    try {
      const adAgg = await db.ad.aggregate({ _sum: { clicks: true, impressions: true } })
      adClicks = adAgg._sum.clicks || 0
      adImpressions = adAgg._sum.impressions || 0
    } catch {}
    try {
      recentAnalytics = await db.analytics.findMany({
        select: { date: true, views: true, revenue: true, device: true },
        orderBy: { date: 'desc' },
        take: 14,
      })
    } catch {}
    try {
      const catStats = await db.video.groupBy({
        by: ['category'],
        _count: { id: true },
        _sum: { views: true },
      })
      categoryStats = catStats.map(c => ({
        category: c.category,
        count: c._count.id,
        views: c._sum.views || 0,
      }))
    } catch {}

    const totalRevenue = recentAnalytics.reduce((sum, a) => sum + a.revenue, 0)

    // Calculate views over time
    const viewsByDate = recentAnalytics.reduce((acc: Record<string, number>, a) => {
      const date = new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      acc[date] = (acc[date] || 0) + a.views
      return acc
    }, {})
    const viewsGraph = Object.entries(viewsByDate).map(([date, views]) => ({ date, views }))

    const revenueByDate = recentAnalytics.reduce((acc: Record<string, number>, a) => {
      const date = new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      acc[date] = (acc[date] || 0) + a.revenue
      return acc
    }, {})
    const revenueGraph = Object.entries(revenueByDate).map(([date, revenue]) => ({ date, revenue }))

    const deviceBreakdown = recentAnalytics.reduce((acc: Record<string, number>, a) => {
      acc[a.device] = (acc[a.device] || 0) + a.views
      return acc
    }, {})

    return NextResponse.json({
      totalVideos,
      totalViews,
      totalClicks: adClicks,
      totalComments,
      totalAds,
      totalUsers,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      viewsGraph,
      revenueGraph,
      deviceBreakdown,
      categoryStats,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30' },
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
