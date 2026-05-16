import { getDb } from './db'
import { budget, channel, channelBudget, spend, result, campaign } from './schemas'
import { tryCatch } from '~~/shared/utils/tryCatch'

export async function seed() {
  const seeding = await tryCatch(seedData())
  if (seeding.error) {
    console.error('Seeding failed:', seeding.error)
  }
}

function daysInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const current = new Date(startDate)
  const end = new Date(endDate)
  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10))
    current.setDate(current.getDate() + 1)
  }
  return dates
}

async function seedData() {
  const db = getDb()

  console.log('🌱 Seeding database...')

  // Clear existing data (reverse dependency order)
  await db.delete(result)
  await db.delete(spend)
  await db.delete(campaign)
  await db.delete(channelBudget)
  await db.delete(channel)
  await db.delete(budget)

  // ─── Channels ────────────────────────────────────────────────────────────────
  // Only channels that map to quiz referral sources

  const channels = await db.insert(channel).values([
    { name: 'Google Ads' }, // 0 → google
    { name: 'Meta Ads' }, // 1 → instagram, facebook
    { name: 'TikTok Ads' }, // 2 → tiktok
    { name: 'Affiliate Marketing' }, // 3 → someone
    { name: 'Organic Search' }, // 4 → reddit, discord
    { name: 'Other' }, // 5 → other, null
  ]).returning()

  console.log(`✅ Inserted ${channels.length} channels`)

  // ─── Budget periods ───────────────────────────────────────────────────────────

  const budgets = await db.insert(budget).values([
    {
      budgetPeriod: 'Q4 2025',
      totalBudgetCents: 80000, // $800
      startDate: '2025-10-01',
      endDate: '2025-12-31',
    },
    {
      budgetPeriod: 'Q1 2026',
      totalBudgetCents: 150000, // $1,500
      startDate: '2026-01-01',
      endDate: '2026-03-31',
    },
    {
      budgetPeriod: 'Q2 2026',
      totalBudgetCents: 280000, // $2,800
      startDate: '2026-04-01',
      endDate: '2026-06-30',
    },
  ]).returning()

  const q4 = budgets[0]!
  const q1 = budgets[1]!
  const q2 = budgets[2]!

  console.log(`✅ Inserted ${budgets.length} budget periods`)

  // ─── Channel budgets (Q4 2025) — total $800 ──────────────────────────────────

  const q4Cbs = await db.insert(channelBudget).values([
    { budgetId: q4.id, channelId: channels[0]!.id, allocatedBudgetCents: 25000 }, // Google Ads      $250
    { budgetId: q4.id, channelId: channels[1]!.id, allocatedBudgetCents: 25000 }, // Meta Ads        $250
    { budgetId: q4.id, channelId: channels[2]!.id, allocatedBudgetCents: 15000 }, // TikTok Ads      $150
    { budgetId: q4.id, channelId: channels[3]!.id, allocatedBudgetCents: 6000 }, // Affiliate       $60
    { budgetId: q4.id, channelId: channels[4]!.id, allocatedBudgetCents: 6000 }, // Organic Search  $60
    { budgetId: q4.id, channelId: channels[5]!.id, allocatedBudgetCents: 3000 }, // Other           $30
  ]).returning()

  // ─── Channel budgets (Q1 2026) — total $1,500 ────────────────────────────────

  const q1Cbs = await db.insert(channelBudget).values([
    { budgetId: q1.id, channelId: channels[0]!.id, allocatedBudgetCents: 49000 }, // Google Ads      $490
    { budgetId: q1.id, channelId: channels[1]!.id, allocatedBudgetCents: 49000 }, // Meta Ads        $490
    { budgetId: q1.id, channelId: channels[2]!.id, allocatedBudgetCents: 24000 }, // TikTok Ads      $240
    { budgetId: q1.id, channelId: channels[3]!.id, allocatedBudgetCents: 12000 }, // Affiliate       $120
    { budgetId: q1.id, channelId: channels[4]!.id, allocatedBudgetCents: 12000 }, // Organic Search  $120
    { budgetId: q1.id, channelId: channels[5]!.id, allocatedBudgetCents: 4000 }, // Other           $40
  ]).returning()

  // ─── Channel budgets (Q2 2026) — total $2,800 ────────────────────────────────

  const q2Cbs = await db.insert(channelBudget).values([
    { budgetId: q2.id, channelId: channels[0]!.id, allocatedBudgetCents: 90000 }, // Google Ads      $900
    { budgetId: q2.id, channelId: channels[1]!.id, allocatedBudgetCents: 90000 }, // Meta Ads        $900
    { budgetId: q2.id, channelId: channels[2]!.id, allocatedBudgetCents: 45000 }, // TikTok Ads      $450
    { budgetId: q2.id, channelId: channels[3]!.id, allocatedBudgetCents: 25000 }, // Affiliate       $250
    { budgetId: q2.id, channelId: channels[4]!.id, allocatedBudgetCents: 22000 }, // Organic Search  $220
    { budgetId: q2.id, channelId: channels[5]!.id, allocatedBudgetCents: 8000 }, // Other           $80
  ]).returning()

  console.log(`✅ Inserted ${q4Cbs.length + q1Cbs.length + q2Cbs.length} channel budgets`)

  // ─── Campaigns ────────────────────────────────────────────────────────────────

  type CampaignSeed = { channelBudgetId: string, amountCents: number, startDate: string, endDate: string }

  const campaignSeeds: CampaignSeed[] = [
    // ── Q4 2025: Google Ads ($250) ───────────────────────────────────────────────
    { channelBudgetId: q4Cbs[0]!.id, amountCents: 10000, startDate: '2025-10-01', endDate: '2025-10-31' }, // October Push
    { channelBudgetId: q4Cbs[0]!.id, amountCents: 8000, startDate: '2025-11-01', endDate: '2025-11-30' }, // Black Friday
    { channelBudgetId: q4Cbs[0]!.id, amountCents: 7000, startDate: '2025-12-01', endDate: '2025-12-31' }, // Holiday Season

    // ── Q4 2025: Meta Ads ($250) ─────────────────────────────────────────────────
    { channelBudgetId: q4Cbs[1]!.id, amountCents: 8000, startDate: '2025-10-01', endDate: '2025-10-31' }, // October Awareness
    { channelBudgetId: q4Cbs[1]!.id, amountCents: 9000, startDate: '2025-11-01', endDate: '2025-11-30' }, // Black Friday Retargeting
    { channelBudgetId: q4Cbs[1]!.id, amountCents: 8000, startDate: '2025-12-01', endDate: '2025-12-31' }, // Holiday Creatives

    // ── Q4 2025: TikTok Ads ($150) ───────────────────────────────────────────────
    { channelBudgetId: q4Cbs[2]!.id, amountCents: 7500, startDate: '2025-10-01', endDate: '2025-11-15' }, // Q4 Brand Boost
    { channelBudgetId: q4Cbs[2]!.id, amountCents: 7500, startDate: '2025-11-16', endDate: '2025-12-31' }, // Holiday Viral

    // ── Q4 2025: Affiliate ($60) ─────────────────────────────────────────────────
    { channelBudgetId: q4Cbs[3]!.id, amountCents: 6000, startDate: '2025-10-01', endDate: '2025-12-31' }, // Q4 Affiliates

    // ── Q4 2025: Organic Search ($60) ────────────────────────────────────────────
    { channelBudgetId: q4Cbs[4]!.id, amountCents: 6000, startDate: '2025-10-01', endDate: '2025-12-31' }, // SEO Q4

    // ── Q4 2025: Other ($30) ─────────────────────────────────────────────────────
    { channelBudgetId: q4Cbs[5]!.id, amountCents: 3000, startDate: '2025-10-01', endDate: '2025-12-31' }, // Q4 Other

    // ── Q1 2026: Google Ads ($490) ───────────────────────────────────────────────
    { channelBudgetId: q1Cbs[0]!.id, amountCents: 17000, startDate: '2026-01-01', endDate: '2026-01-31' }, // New Year Push
    { channelBudgetId: q1Cbs[0]!.id, amountCents: 12000, startDate: '2026-02-01', endDate: '2026-02-14' }, // Valentine's Day
    { channelBudgetId: q1Cbs[0]!.id, amountCents: 20000, startDate: '2026-02-15', endDate: '2026-03-31' }, // Spring Sale

    // ── Q1 2026: Meta Ads ($490) ─────────────────────────────────────────────────
    { channelBudgetId: q1Cbs[1]!.id, amountCents: 16000, startDate: '2026-01-01', endDate: '2026-01-31' }, // January Awareness
    { channelBudgetId: q1Cbs[1]!.id, amountCents: 15000, startDate: '2026-02-01', endDate: '2026-02-28' }, // Valentine's Creatives
    { channelBudgetId: q1Cbs[1]!.id, amountCents: 18000, startDate: '2026-03-01', endDate: '2026-03-31' }, // Spring Retargeting

    // ── Q1 2026: TikTok Ads ($240) ───────────────────────────────────────────────
    { channelBudgetId: q1Cbs[2]!.id, amountCents: 24000, startDate: '2026-01-01', endDate: '2026-03-31' }, // Q1 Brand Boost

    // ── Q1 2026: Affiliate ($120) ────────────────────────────────────────────────
    { channelBudgetId: q1Cbs[3]!.id, amountCents: 12000, startDate: '2026-01-01', endDate: '2026-03-31' }, // Q1 Affiliates

    // ── Q1 2026: Organic Search ($120) ───────────────────────────────────────────
    { channelBudgetId: q1Cbs[4]!.id, amountCents: 12000, startDate: '2026-01-01', endDate: '2026-03-31' }, // SEO Q1

    // ── Q1 2026: Other ($40) ─────────────────────────────────────────────────────
    { channelBudgetId: q1Cbs[5]!.id, amountCents: 4000, startDate: '2026-01-01', endDate: '2026-03-31' }, // Q1 Other

    // ── Q2 2026: Google Ads ($900) ───────────────────────────────────────────────
    { channelBudgetId: q2Cbs[0]!.id, amountCents: 35000, startDate: '2026-04-01', endDate: '2026-04-30' }, // April Push
    { channelBudgetId: q2Cbs[0]!.id, amountCents: 55000, startDate: '2026-05-01', endDate: '2026-06-30' }, // Summer Ramp

    // ── Q2 2026: Meta Ads ($900) ─────────────────────────────────────────────────
    { channelBudgetId: q2Cbs[1]!.id, amountCents: 30000, startDate: '2026-04-01', endDate: '2026-04-30' }, // Spring Awareness
    { channelBudgetId: q2Cbs[1]!.id, amountCents: 30000, startDate: '2026-05-01', endDate: '2026-05-31' }, // May Retargeting
    { channelBudgetId: q2Cbs[1]!.id, amountCents: 30000, startDate: '2026-06-01', endDate: '2026-06-30' }, // Summer Visuals

    // ── Q2 2026: TikTok Ads ($450) ───────────────────────────────────────────────
    { channelBudgetId: q2Cbs[2]!.id, amountCents: 45000, startDate: '2026-04-01', endDate: '2026-06-30' }, // Q2 Viral

    // ── Q2 2026: Affiliate ($250) ────────────────────────────────────────────────
    { channelBudgetId: q2Cbs[3]!.id, amountCents: 25000, startDate: '2026-04-01', endDate: '2026-06-30' }, // Q2 Affiliates

    // ── Q2 2026: Organic Search ($220) ───────────────────────────────────────────
    { channelBudgetId: q2Cbs[4]!.id, amountCents: 22000, startDate: '2026-04-01', endDate: '2026-06-30' }, // SEO Q2

    // ── Q2 2026: Other ($80) ─────────────────────────────────────────────────────
    { channelBudgetId: q2Cbs[5]!.id, amountCents: 8000, startDate: '2026-04-01', endDate: '2026-06-30' }, // Q2 Other
  ]

  const campaigns = await db.insert(campaign).values(campaignSeeds).returning()

  console.log(`✅ Inserted ${campaigns.length} campaigns`)

  // channelBudgetId → channel index
  const cbToChannelIdx = new Map<string, number>()
  for (const cbs of [q4Cbs, q1Cbs, q2Cbs]) {
    cbs.forEach((cb, idx) => cbToChannelIdx.set(cb.id, idx))
  }

  // ─── Spend & Result per campaign ─────────────────────────────────────────────
  //
  // Generate daily spend per campaign, then attribute synthetic signups by
  // channel. If multiple campaigns run in the same channel on the same day,
  // users are split proportionally by spend.

  type DailyEntry = { campaignId: string, channelBudgetId: string, date: string, amountCents: number, roiMultiplier: number }
  const dailyEntries: DailyEntry[] = []

  for (const c of campaigns) {
    const dates = daysInRange(c.startDate, c.endDate!)
    const dailyBudget = c.amountCents / dates.length
    const roiMultiplier = 1.2 + Math.random() * 1.3

    for (const date of dates) {
      const variance = 0.75 + Math.random() * 0.5
      dailyEntries.push({ campaignId: c.id, channelBudgetId: c.channelBudgetId, date, amountCents: Math.round(dailyBudget * variance), roiMultiplier })
    }
  }

  // ─── Synthetic daily signups ──────────────────────────────────────────────────
  //
  // Startup launched Oct 2025. Grows from ~2 signups/day to ~12/day by mid-March
  // 2026, totalling ~1050 real users. Future dates get 0 (no data yet).

  const today = new Date().toISOString().slice(0, 10)
  const launchDate = new Date('2025-10-01')

  // Build date → total spend per channel index (used to distribute users)
  const spendByDateAndChannel = new Map<string, Map<number, number>>()
  for (const entry of dailyEntries) {
    const channelIdx = cbToChannelIdx.get(entry.channelBudgetId) ?? -1
    if (channelIdx < 0) continue
    if (!spendByDateAndChannel.has(entry.date)) spendByDateAndChannel.set(entry.date, new Map())
    const byChannel = spendByDateAndChannel.get(entry.date)!
    byChannel.set(channelIdx, (byChannel.get(channelIdx) ?? 0) + entry.amountCents)
  }

  const usersByDateAndChannel = new Map<string, Map<number, number>>()

  for (const date of spendByDateAndChannel.keys()) {
    const byChannel = new Map<number, number>()
    usersByDateAndChannel.set(date, byChannel)

    if (date > today) continue // no users yet for future dates

    const daysSinceStart = Math.floor((new Date(date).getTime() - launchDate.getTime()) / 86_400_000)
    const base = 1.5 + (daysSinceStart / 167) * 10 // grows ~1.5 → ~11.5/day
    const totalUsers = Math.max(1, Math.round(base * (0.65 + Math.random() * 0.7)))

    // Distribute across channels proportionally by that day's spend
    const spendByChannel = spendByDateAndChannel.get(date)!
    const totalSpend = [...spendByChannel.values()].reduce((sum, v) => sum + v, 0)
    if (totalSpend === 0) continue

    const channelEntries = [...spendByChannel.entries()]
    let distributed = 0
    for (let i = 0; i < channelEntries.length - 1; i++) {
      const [chIdx, chSpend] = channelEntries[i]!
      const chUsers = Math.round(totalUsers * (chSpend / totalSpend))
      byChannel.set(chIdx, chUsers)
      distributed += chUsers
    }
    // Remainder goes to last channel to avoid rounding loss
    const [lastChIdx] = channelEntries[channelEntries.length - 1]!
    byChannel.set(lastChIdx, Math.max(0, totalUsers - distributed))
  }

  const entriesByDate = new Map<string, DailyEntry[]>()
  for (const entry of dailyEntries) {
    if (!entriesByDate.has(entry.date)) entriesByDate.set(entry.date, [])
    entriesByDate.get(entry.date)!.push(entry)
  }

  const spendRecords: { campaignId: string, amountCents: number, date: string }[] = []
  const resultRecords: { campaignId: string, date: string, revenueCents: number, usersAcquired: number }[] = []

  for (const [date, entries] of entriesByDate) {
    const byChannel = usersByDateAndChannel.get(date)

    for (const entry of entries) {
      const channelIdx = cbToChannelIdx.get(entry.channelBudgetId) ?? -1
      const channelUsers = channelIdx >= 0 ? (byChannel?.get(channelIdx) ?? 0) : 0

      // Split channel users across concurrent campaigns in the same channel by spend
      const channelSpend = entries
        .filter(e => cbToChannelIdx.get(e.channelBudgetId) === channelIdx)
        .reduce((sum, e) => sum + e.amountCents, 0)
      const usersAcquired = channelSpend > 0 ? Math.round(channelUsers * (entry.amountCents / channelSpend)) : 0

      const dailyRevenue = Math.round(entry.amountCents * entry.roiMultiplier * (0.8 + Math.random() * 0.4))

      spendRecords.push({ campaignId: entry.campaignId, amountCents: entry.amountCents, date })
      resultRecords.push({ campaignId: entry.campaignId, date, revenueCents: dailyRevenue, usersAcquired })
    }
  }

  await db.insert(spend).values(spendRecords)
  console.log(`✅ Inserted ${spendRecords.length} spend records`)

  await db.insert(result).values(resultRecords)
  console.log(`✅ Inserted ${resultRecords.length} result records`)

  console.log('🎉 Seeding complete!')
}

export async function seedAdmin() {
  const seedAdmin = await tryCatch(
    auth.api.signUpEmail({
      body: {
        email: 'admin@admin.com',
        password: 'password123',
        name: 'Admin Adminson',
      },
    }))
  if (seedAdmin.error) {
    console.log(seedAdmin.error.message || 'admin already exists')
  }
}
