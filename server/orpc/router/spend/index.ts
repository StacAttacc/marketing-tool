import list from './list'
import update from './update'
import filteredList from './filteredList'
import create from './create'
import deleteSpend from './deleteSpend'

export const spendRouter = {
  list,
  update,
  filter: filteredList,
  create,
  delete: deleteSpend,
}
