import type { InferRouterInputs, InferRouterOutputs } from '@orpc/server'

import { budgetRouter } from './budget'
import { channelRouter } from './channel'
import { channelBudgetRouter } from './channel_budget'
import { spendRouter } from './spend'
import { campaignRouter } from './campaign'
import { resultRouter } from './result'
import { demoRouter } from './demo'
import { budgetPredictionRouter } from './budgetPrediction'
import { llmRouter } from './llm'
import { userRouter } from './user'

export const router = {
  budget: budgetRouter,
  channel: channelRouter,
  channelBudget: channelBudgetRouter,
  spend: spendRouter,
  campaign: campaignRouter,
  result: resultRouter,
  demo: demoRouter,
  budgetPrediction: budgetPredictionRouter,
  llm: llmRouter,
  user: userRouter,
}

export type Router = typeof router
export type RouterOutputs = InferRouterOutputs<typeof router>
export type RouterInputs = InferRouterInputs<typeof router>
export type ResultRouter = InferRouterOutputs<typeof resultRouter>
export type SpendRouter = InferRouterOutputs<typeof spendRouter>
export type CampaignRouter = InferRouterOutputs<typeof campaignRouter>
