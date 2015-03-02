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
      
    # TODO: I don't @paged is read by anyone
    @paged = false
    @pageCacheOffset = 0 # current page's index into cache
    @backgrounded = false
    @pagePending = undefined # waiting on rest call
    # When loading the next page, there were some items in the cache, but not enough for a full page.
    # We cache what we have in pagePendingCache to keep it in case it rolls off before the GET replies.
    @pagePendingCache = undefined
    @pagePendingNotify = undefined

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
      when SubscriptionCacheAction.INSERT then @actionInsert action  # item, at
      when SubscriptionCacheAction.REMOVE then @actionRemove action  # item, at
      when SubscriptionCacheAction.MOVE   then @actionMove   action  # item, from, to
      when SubscriptionCacheAction.TRIM   then @actionTrim   action  # items, at, count
      

  actionUpdate: (action) ->
  actionMove: (action) ->
  actionTrim: (action) ->
    
  actionRemove: ( action) ->
    removed = undefined
    removeAt = action.at - @pageCacheOffset
    if removeAt >= 0 and removeAt < @viewSize
      removed = @items[removeAt] 
      @items.splice( removeAt, 1)
    else if removeAt < 0
      @pageCacheOffset -= 1
    removed
  
      
  actionInsert: ( action) ->
    insertAt = action.at - @pageCacheOffset
    # when pageCacheOffset == 0 and insertAt == 0 then page tracks the new item.
    # when > 0 and < viewSize then insert within current page.
    # when insertedAt <= 0 then insert is before this page.
    if (@pageCacheOffset == 0 and insertAt == 0) or (insertAt > 0 and insertAt < @viewSize)
      @items.splice( insertAt, 0, action.item)
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

  pageSuccess: (items) =>
    switch @pagePending
      when 'next'
        # TODO: What if some of the new items should overwrite pagePendingCache items.
        if @pagePendingCache
          items = @pagePendingCache.concat( items)
        @replaceItems items
        @items.sort( ( a, b) -> return b.time - a.time)
        @pagePending = undefined
        @pagePendingCache = undefined
        @paged = true
        @pageCacheOffset = -1
        # See if some of this will fit in the cache.
        @onMessage( items)
        @pagePendingNotify( @pageCacheOffset != 0, @pageCacheOffset, items.length < @viewSize) if @pagePendingNotify
  
      when 'previous'
        #TODO: what if items is empty!
        @replaceItems items
        @items.sort( ( a, b) -> return b.time - a.time)
        @pagePending = undefined
        @pagePendingCache = undefined
        # See if some of this will fit in the cache.
        @onMessage( items)
        # see if we've paged previous enough so we're back in the cache.
        @pageCacheOffset = @indexOfId( @items[0].id)
        @paged = @pageCacheOffset != 0
        @pagePendingNotify( @pageCacheOffset != 0, @pageCacheOffset, false) if @pagePendingNotify

      else
        console.log( 'SubscriptionView.pageSuccess but pagePending is ' + @pagePending)
  
  pageFailure: (items) =>


  #
  # Get the next page.
  #
  # @param pageRest has pageFirst, pageNext, pagePrevious,
  # @param notify function( paged, pageCacheOffset, lastPage)
  # @return string 'paged', 'pending'
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
        @pagePending = 'next'
        @pagePendingNotify = notify
        # TODO: what if length is 0!
        pageRest.pageNext( @items[@items.length-1].id, @viewSize, @pageSuccess, @pageFailure)
        'pending'
      when @pageCacheOffset + 2 * @viewSize <= @itemStore.length
        # Load page from cache
        @pageCacheOffset += @viewSize
        @replaceItems @itemStore[@pageCacheOffset ... (@pageCacheOffset + @viewSize)] # exclude 'to' index
        @paged = true
        'paged'
      else
        # At least some of the next page is off the end of what's loaded in the cache. Maybe past cache capacity.
        # Might be getting a whole or partial page.
        nextPageOffset = @pageCacheOffset + @viewSize
        @pagePendingCache = @itemStore[nextPageOffset...(nextPageOffset + @viewSize)] # empty or partial page.
        limit = @viewSize - @pagePendingCache.length
        @pagePending = 'next'
        @pagePendingNotify = notify
        # TODO: what if length is 0!
        pageRest.pageNext( @items[@items.length-1].id, limit, @pageSuccess, @pageFailure)
        'pending'

  pagePrevious: (pageRest, notify)->
    return 'pastPending' if @pagePending
    # Page previous can be
    #   Within the itemStore
    #   Partially off the end of the itemStore
    #   Fully off the end of the itemStore
    #
    switch

      when @pageCacheOffset < 0
        # Already paged past what's loaded in cache.
        @pagePending = 'previous'
        @pagePendingNotify = notify
        # TODO: what if length is 0!
        pageRest.pagePrevious( @items[0].id, @viewSize, @pageSuccess, @pageFailure)
        'pending'
      when @pageCacheOffset == 0
        # TODO: we're already on the first page. What's up?
        @paged = false
        'paged'
      else
        # Load page from cache
        @pageCacheOffset -= @viewSize
        @pageCacheOffset = 0 if @pageCacheOffset < 0
        @replaceItems @itemStore[@pageCacheOffset ... (@pageCacheOffset + @viewSize)] # exclude 'to' index
        @paged = @pageCacheOffset > 0
        # TODO: 'first' ?
        'paged'

  pageFirst: ->
    @pagePending = undefined # cancel pagePending
    @pageCacheOffset = 0
    @replaceItems @itemStore[@pageCacheOffset ... (@pageCacheOffset + @viewSize)] # exclude 'to' index
    @paged = false

  replaceItems: (source) ->
    @items.splice( 0, @items.length)
    args = [0, 0].concat(source);
    Array.prototype.splice.apply(@items, args)



