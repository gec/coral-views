
class GBAlarmSubscriptionView extends GBSubscriptionView
  # Should this item be removed?
  # @param item - The item after it's been updated.
  #
  shouldRemoveItemOnUpdate: ( item) ->
    item._updateState = 'none'
    return item.state == 'REMOVED'

  onUpdateFailure: ( ids, newState) ->
    for id in ids
      alarm = @getItemById id
      alarm._updateState = 'none' if alarm

  filter: (theFilter) ->
    @items.filter( theFilter)
