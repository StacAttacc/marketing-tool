import list from './list'
import update from './update'
import filteredList from './filteredList'
import create from './create'
import deleteCampaign from './deleteCampaign'

export const campaignRouter = {
  list,
  update,
  filter: filteredList,
  create,
  delete: deleteCampaign,
}
