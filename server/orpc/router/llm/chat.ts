import Anthropic from '@anthropic-ai/sdk'
import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import { eq, sum } from 'drizzle-orm'
import { authorized } from '~~/server/orpc/authorized'
import { tryCatch } from '~~/shared/utils/tryCatch'
import { env } from '~~/server/env'
import { budget, spend, channelBudget, channel, campaign, result, budgetPrediction, channelPrediction } from '~~/server/database/schemas'

const inputSchema = z.object({
  text: z.string().min(1).optional(),
  budgetId: z.string().uuid().optional(),
  images: z.array(z.object({
    data: z.string(),
    mimeType: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  })).optional(),
}).refine(
  d => d.text || d.budgetId || (d.images && d.images.length > 0),
  { message: 'At least one of text, budgetId, or images is required' },
)

export default authorized
  .input(inputSchema)
  .handler(async ({ input, context }) => {
    const { db } = context
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

    const contentBlocks: Anthropic.Messages.ContentBlockParam[] = []

    if (input.budgetId) {
      const { data: budgetRows, error: budgetError } = await tryCatch(
        db.select().from(budget).where(eq(budget.id, input.budgetId)),
      )
      if (budgetError || !budgetRows?.[0]) throw new ORPCError('INTERNAL_SERVER_ERROR')
      const budgetRow = budgetRows[0]

      const { data: spendRows, error: spendError } = await tryCatch(
        db.select({ amountCents: spend.amountCents, channelName: channel.name })
          .from(spend)
          .innerJoin(campaign, eq(spend.campaignId, campaign.id))
          .innerJoin(channelBudget, eq(campaign.channelBudgetId, channelBudget.id))
          .innerJoin(channel, eq(channelBudget.channelId, channel.id))
          .where(eq(channelBudget.budgetId, input.budgetId)),
      )
      if (spendError) throw new ORPCError('INTERNAL_SERVER_ERROR')

      const { data: resultRows, error: resultError } = await tryCatch(
        db.select({ revenueCents: result.revenueCents, usersAcquired: result.usersAcquired, channelName: channel.name })
          .from(result)
          .innerJoin(campaign, eq(result.campaignId, campaign.id))
          .innerJoin(channelBudget, eq(campaign.channelBudgetId, channelBudget.id))
          .innerJoin(channel, eq(channelBudget.channelId, channel.id))
          .where(eq(channelBudget.budgetId, input.budgetId)),
      )
      if (resultError) throw new ORPCError('INTERNAL_SERVER_ERROR')

      const { data: predictionRows, error: predictionError } = await tryCatch(
        db.select({
          predictionPeriod: budgetPrediction.predictionPeriod,
          totalBudgetCents: budgetPrediction.totalBudgetCents,
          predictedRevenueCents: sum(channelPrediction.predictedRevenueCents),
          predictedUsersAcquired: sum(channelPrediction.predictedUsersAcquired),
        })
          .from(budgetPrediction)
          .leftJoin(channelPrediction, eq(channelPrediction.budgetPredictionId, budgetPrediction.id))
          .where(eq(budgetPrediction.budgetId, input.budgetId))
          .groupBy(budgetPrediction.id, budgetPrediction.predictionPeriod, budgetPrediction.totalBudgetCents),
      )
      if (predictionError) throw new ORPCError('INTERNAL_SERVER_ERROR')

      const spendByChannel: Record<string, number> = {}
      for (const s of spendRows ?? []) {
        spendByChannel[s.channelName] = (spendByChannel[s.channelName] ?? 0) + s.amountCents
      }

      const resultByChannel: Record<string, { revenueCents: number, usersAcquired: number }> = {}
      for (const r of resultRows ?? []) {
        const prev = resultByChannel[r.channelName] ?? { revenueCents: 0, usersAcquired: 0 }
        resultByChannel[r.channelName] = {
          revenueCents: prev.revenueCents + (r.revenueCents ?? 0),
          usersAcquired: prev.usersAcquired + (r.usersAcquired ?? 0),
        }
      }

      const channelNames = new Set([...Object.keys(spendByChannel), ...Object.keys(resultByChannel)])

      const budgetContext = {
        budget: {
          period: budgetRow.budgetPeriod,
          totalBudgetCents: budgetRow.totalBudgetCents,
          startDate: budgetRow.startDate,
          endDate: budgetRow.endDate,
        },
        channels: [...channelNames].map(name => ({
          channel: name,
          spendCents: spendByChannel[name] ?? 0,
          revenueCents: resultByChannel[name]?.revenueCents ?? 0,
          usersAcquired: resultByChannel[name]?.usersAcquired ?? 0,
        })),
        predictions: (predictionRows ?? []).map(p => ({
          period: p.predictionPeriod,
          totalBudgetCents: p.totalBudgetCents,
          predictedRevenueCents: Number(p.predictedRevenueCents ?? 0),
          predictedUsersAcquired: Number(p.predictedUsersAcquired ?? 0),
        })),
      }

      contentBlocks.push({ type: 'text', text: JSON.stringify(budgetContext) })
    }

    for (const img of input.images ?? []) {
      contentBlocks.push({
        type: 'image',
        source: { type: 'base64', media_type: img.mimeType, data: img.data },
      })
    }

    if (input.text) {
      contentBlocks.push({ type: 'text', text: input.text })
    }

    const { data, error } = await tryCatch(
      client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: 'You are a marketing budget analyst assistant. Be concise and data-driven. Always respond with plain text only.',
        messages: [{ role: 'user', content: contentBlocks }],
      }),
    )

    if (error || !data) throw new ORPCError('INTERNAL_SERVER_ERROR')

    const content = data.content[0]
    if (content?.type !== 'text') throw new ORPCError('INTERNAL_SERVER_ERROR')

    return { text: content.text }
  })
