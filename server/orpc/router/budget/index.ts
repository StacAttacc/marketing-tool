import list from './list'
import update from './update'
import filteredList from './filteredList'
import create from './create'
import deleteBudget from './deleteBudget'

export const budgetRouter = {
  list,
  filter: filteredList,
  update,
  create,
  delete: deleteBudget,
}
