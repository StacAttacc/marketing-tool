import list from './list'
import filteredList from './filteredList'
import create from './create'
import update from './update'
import deleteResult from './deleteResult'
import totalUsersAllTime from './totalUsersAllTime'

export const resultRouter = {
  list,
  filter: filteredList,
  update,
  create,
  delete: deleteResult,
  totalUsersAllTime,
}
