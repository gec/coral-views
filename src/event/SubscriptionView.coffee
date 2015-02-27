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
      
    @paged = false
    @viewOffset = 0
    @backgrounded = false
    @pagePending = undefined
    # When loading the next page, there were some items in the cache, but not enough for a full page.
    # We cache what we have in pagePendingCache to keep it in case it rolls off before the GET replies.
    @pagePendingCache = undefined

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

    acts = (@act action for action in actions)
    removedItems = (removed for removed in acts when removed) # filter on defined (i.e. not undefined)
    
    if( @items.length > @viewSize)
      removedItems = removedItems.concat( @items.splice( @viewSize, @items.length - @viewSize))
      
    removedItems
    
#    if actions.many
#      @items = @itemStore[@viewOffset ... (@viewOffset + @viewSize)] # exclude 'to' index
#      # TODO: don't know which items were removed.
#    else
#      if actions.remove
#        removed = @actionRemove actions.remove
#      if actions.insert
#        inserted = @actionInsert actions.insert
#        if inserted
#          if removed and removed != inserted
#            removedItems[removedItems.length] = removed
#          if( @items.length > @viewSize)
#            removedItems = removedItems.concat( @items.splice( @viewSize, @items.length - @viewSize))
#      else if removed
#        removedItems[removedItems.length] = removed
#
#    removedItems

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
    removeAt = action.at - @viewOffset
    if removeAt >= 0 and removeAt < @viewSize
      removed = @items[removeAt] 
      @items.splice( removeAt, 1)
    else if removeAt < 0
      @viewOffset -= 1
    removed
  
      
  actionInsert: ( action) ->
    inserted = undefined
    insertAt = action.at - @viewOffset
    if insertAt >= 0 and insertAt < @viewSize
      @items.splice( insertAt, 0, action.item)
      inserted = action.item
    else if insertAt < 0
      @viewOffset += 1
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
      @items = @itemStore[0...@viewSize] # 0 to viewSize - 1
      @backgrounded = false


  pageSuccess: (items) =>
    switch @pagePending
      when 'next'
        @items = @pagePendingCache.concat( items)
        @pagePending = undefined
        @pagePendingCache = undefined
        # do we add to the cache?
        # do we update pageOffset?
  
#    if not @paged
#      background()
#      @paged = true

  pageFailure: (items) =>


  #                    <- items loaded -> capacity max
  # SubscriptionCache [iiiiiiiiiiiiiiiiii            ]
  #                   [page0][page1][page2][page3][page4][page5]
  # GetCache                                      [                    ]
  #
  # page1 - load from cached
  # page2 - Some in cache. GET the rest and store in cache
  # page3 - GET and store in cache
  # page4 - GET and store in SubscriptionCache and GetCache.
  # page5 - GET and store in GetCache.
  #
  pageNext: (pageRest) ->
    return false if @pagePending
    # Page next can be
    #   Within the itemStore
    #   Partially off the end of the itemStore
    #   Fully off the end of the itemStore
    #
    switch
      
      when @viewOffset + 2 * @viewSize <= @itemStore.length
        # Load page from cache
        @viewOffset += @viewSize
        @items = @itemStore[@viewOffset ... (@viewOffset + @viewSize)] # exclude 'to' index
        @paged = true
#      # Partially within cache
#      when @viewOffset + @viewSize + 1 < @itemStore.length
#        limit = @itemStore.length - (@viewOffset + @viewSize)
#        @pagePending = 'next'
#        pageRest.next( @items[@items.length], limit, @pageSuccess, @pageFailure)
      # Off the end of what's loaded in the cache. Maybe past cache capacity.
      else
        # Need to GET more that what's in cache. Might need to GET a whole or partial page.
        nextPageOffset = @viewOffset + @viewSize
        @pagePendingCache = @itemStore[nextPageOffset...(nextPageOffset + @viewSize)] # empty or partial page.
        limit = @viewSize - @pagePendingCache.length
        @pagePending = 'next'
        # TODO: what if length is 0!
        pageRest.next( @items[@items.length-1].id, limit, @pageSuccess, @pageFailure)
    true

  pagePrevious: (pageRest)->
    if not @pagePending
      @pagePending = 'previous'
      pageRest.previous( @pageSuccess, @pageFailure)
      true
    else
      false

  pageFirst: ->
    foreground()
    


