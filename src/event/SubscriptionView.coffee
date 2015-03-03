SubscriptionViewState =
  CURRENT:         0  # Viewing current items (aka. on the first page).
  PAGING_NEXT:     1  # Waiting on REST request for pageNext or pagePrevious.
  PAGING_PREVIOUS: 2  # Waiting on REST request for pageNext or pagePrevious.
  PAGED:           3  # pageNext or pagePrevious was successful and not on first page (aka. current items)
  NO_ITEMS:        4  # pageNext or pagePrevious was successful but there were no more items.

###

  Manage a set of items as subscription messages come in.

  For paging, we could be paging inside the cache or past the end of the cache.

  View  Cache
  3     3
  2     2
        1

  @param _limit - Maximum number of alarms
  @param _items - if supplied, this array will be update and sorted with onMessage calls.
                  Each item needs a 'time' property which holds a Javascript Date.
  @constructor
###
class SubscriptionView extends SubscriptionCache
  constructor: ( @viewSize, @cacheSize, items) ->
    @cacheSize ?= @viewSize
    super @cacheSize, items
    @items = @itemStore[0...@viewSize] # 0 to viewSize - 1
    # trim to viewSize
    if( @items.length > @viewSize)
      @items.splice( @viewSize, @items.length - @viewSize)
      
    @state = SubscriptionViewState.CURRENT
    @pageCacheOffset = 0 # current page's index into cache
    @backgrounded = false

    # pagePending when waiting on a rest call to return.
    #   direction: 'next'|'previous'
    #   cache:[items]
    #   notify: ()->}
    #
    # cache when loading the next page, there were some items in the cache, but not enough for a full page.
    # We cache what we have to keep them in case they roll off before the GET replies.
    #
    @pagePending = undefined

    # When we get the next page, it might be empty. After that, pagePrevious doesn't have an ID
    # to use to get a previous page. We'll use this cache to get the previous page.
    @previousPageCache = undefined

  # Could get the insert index for one. Copy array for n.
  # i 1
  # What about alarms which rearrange items with update?
  # r 1, i 0
  #
  # Don't need trim info from cache since our size can be different.
  #
  onMessage: ( item) ->
    removedItems = []
    actions = super item
    
    if @pageCacheOffset >= 0
      acts = (@act action for action in actions)
      removedItems = (removed for removed in acts when removed) # filter on defined (i.e. not undefined)

      if( @items.length > @viewSize)
        removedItems = removedItems.concat( @items.splice( @viewSize, @items.length - @viewSize))

    removedItems
    
  act: (action) ->
    switch action.type
      when SubscriptionCacheAction.UPDATE then @actionUpdate action  # item
      when SubscriptionCacheAction.INSERT then @actionInsert action.item, action.at  # item, at
      when SubscriptionCacheAction.REMOVE then @actionRemove action.item, action.from  # item, at
      when SubscriptionCacheAction.MOVE   then @actionMove   action  # item, from, to
      when SubscriptionCacheAction.TRIM   then @actionTrim   action  # items, at, count
      

  actionUpdate: (action) ->
  actionMove: (action) ->
    @actionRemove action.item, action.from
    @actionInsert action.item, action.to

  # Trim the rest of the cache. We don't trim the view, but we might
  # be off the cache after this.
  actionTrim: (action) ->
    trimAt = action.at - @pageCacheOffset
    if trimAt <= 0
      @pageCacheOffset = -1

  actionRemove: ( item, from) ->
    removed = undefined
    removeAt = from - @pageCacheOffset
    if removeAt >= 0 and removeAt < @viewSize
      removed = @items[removeAt] 
      @items.splice( removeAt, 1)
    else if removeAt < 0
      @pageCacheOffset -= 1
    removed
  
      
  actionInsert: ( item, insertAt) ->
    insertAt = insertAt - @pageCacheOffset
    # when pageCacheOffset == 0 and insertAt == 0 then page tracks the new item.
    # when > 0 and < viewSize then insert within current page.
    # when insertedAt <= 0 then insert is before this page.
    if (@pageCacheOffset == 0 and insertAt == 0) or (insertAt > 0 and insertAt < @viewSize)
      @items.splice( insertAt, 0, item)
    else if insertAt <= 0
      @pageCacheOffset += 1
    undefined

#  insert: (item) ->
#    if( @items.length is 0 or item.time >= @items[0])
#      @items.unshift( item)
#    else
#      i = 1
#      loop
#        if i >= @items.length
#          @items[@items.length] = item
#          break
#        else if item.time >= @items[i]
#          @items.splice( i, 0, item)
#          break
#        else
#          i++
#
#  sortByTime: ->
#    @items.sort( ( a, b) -> return b.time - a.time)
    
  background: ->
    if not @backgrounded
      @backgrounded = true
      @items.splice( 0, @items.length) # empty array
    
  foreground: ->
    if @backgrounded
      @replaceItems @itemStore[0...@viewSize] # 0 to viewSize - 1
      @backgrounded = false

  updateState: ->
    @state = switch
      when @items.length == 0 then SubscriptionViewState.NO_ITEMS
      when @pageCacheOffset > 0 then SubscriptionViewState.PAGED
      else SubscriptionViewState.CURRENT

  pageSuccess: (items) =>
    switch @pagePending?.direction
      when 'next'
        # TODO: What if some of the new items should overwrite pagePendingCache items.
        if @pagePending.cache
          items = @pagePending.cache.concat( items)
        @previousPageCache = @items[..]
        @replaceItems items
        @items.sort( ( a, b) -> return b.time - a.time)
        # TODO: If the items can fit in the cache, we should set a valid pageCacheOffset
        @pageCacheOffset = -1
        # See if some of this will fit in the cache.
        @onMessage( items)
        @updateState()
        @pagePending.notify( @state, @pageCacheOffset, items.length < @viewSize, @previousPageCache) if @pagePending?.notify
        @pagePending = undefined

      when 'previous'
        #TODO: what if items is empty!
        oldItems = @items[..]
        @replaceItems items
        @items.sort( ( a, b) -> return b.time - a.time)
        # See if some of this will fit in the cache.
        @onMessage( items)
        # see if we've paged previous enough so we're back in the cache.
        @pageCacheOffset = @indexOfId( @items[0].id)
        @updateState()
        @pagePending.notify( @state, @pageCacheOffset, false, oldItems) if @pagePending?.notify
        @pagePending = undefined

      else
        console.log( 'SubscriptionView.pageSuccess but pagePending is ' + @pagePending?.direction)
  
  pageFailure: (items) =>


  #
  # Get the next page and return state.
  #
  # @param pageRest has pageFirst, pageNext, pagePrevious,
  # @param notify function( paged, pageCacheOffset, lastPage)
  # @return SubscriptionViewState
  #
  pageNext: (pageRest, notify) ->
    return 'pastPending' if @pagePending
    # Page next can be
    #   Within the itemStore
    #   Partially off the end of the itemStore
    #   Fully off the end of the itemStore
    #
    switch
      
      when @pageCacheOffset < 0
        # Already paged past what's loaded in cache.
        @pagePending =
          direction: 'next'
          notify: notify
        # TODO: what if length is 0!
        pageRest.pageNext( @items[@items.length-1].id, @viewSize, @pageSuccess, @pageFailure)
        @state = SubscriptionViewState.PAGING_NEXT
        
      when @pageCacheOffset + 2 * @viewSize <= @itemStore.length
        # Load page from cache
        @pageCacheOffset += @viewSize
        @replaceItems @itemStore[@pageCacheOffset ... (@pageCacheOffset + @viewSize)] # exclude 'to' index
        @state = SubscriptionViewState.PAGED
        
      else
        # At least some of the next page is off the end of what's loaded in the cache. Maybe past cache capacity.
        # Might be getting a whole or partial page.
        nextPageOffset = @pageCacheOffset + @viewSize
        @pagePending =
          direction: 'next'
          notify: notify
          cache: @itemStore[nextPageOffset...(nextPageOffset + @viewSize)] # empty or partial page.
        limit = @viewSize - @pagePending.cache.length
        # TODO: what if length is 0!
        pageRest.pageNext( @items[@items.length-1].id, limit, @pageSuccess, @pageFailure)
        @state = SubscriptionViewState.PAGING_NEXT

  # Get previous page and return state
  pagePrevious: (pageRest, notify)->
    return 'pastPending' if @pagePending
    # Page previous can be
    #   Within the itemStore
    #   Partially off the end of the itemStore
    #   Fully off the end of the itemStore
    #
    switch

      when @pageCacheOffset < 0 and @items.length == 0
        @replaceItems @previousPageCache
        @previousPageCache = undefined
        @pageCacheOffset = @indexOfId( @items[0].id)
        @updateState()
  
      when @pageCacheOffset < 0
        # Already paged past what's loaded in cache.
        @pagePending =
          direction: 'previous'
          notify: notify
        # TODO: what if length is 0!
        pageRest.pagePrevious( @items[0].id, @viewSize, @pageSuccess, @pageFailure)
        @state = SubscriptionViewState.PAGING_PREVIOUS
        
      when @pageCacheOffset == 0
        # TODO: we're already on the first page. What's up?
        @state = SubscriptionViewState.CURRENT
        
      else
        # Load page from cache
        @pageCacheOffset -= @viewSize
        @pageCacheOffset = 0 if @pageCacheOffset < 0
        @replaceItems @itemStore[@pageCacheOffset ... (@pageCacheOffset + @viewSize)] # exclude 'to' index
        @state = if @pageCacheOffset > 0 then SubscriptionViewState.PAGED else SubscriptionViewState.CURRENT

  pageFirst: ->
    @pagePending = undefined # cancel pagePending
    @pageCacheOffset = 0
    @replaceItems @itemStore[@pageCacheOffset ... (@pageCacheOffset + @viewSize)] # exclude 'to' index
    @updateState()


  replaceItems: (source) ->
    @items.splice( 0, @items.length)
    args = [0, 0].concat(source);
    Array.prototype.splice.apply(@items, args)


class AlarmSubscriptionView extends SubscriptionView
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
