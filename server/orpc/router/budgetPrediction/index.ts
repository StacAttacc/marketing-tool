import create from './create'
import filteredList from './filteredList'
import getChannelPredictions from './getChannelPredictions'
import deleteBudgetPrediction from './deleteBudgetPrediction'

export const budgetPredictionRouter = { create, filter: filteredList, getChannelPredictions, delete: deleteBudgetPrediction }
