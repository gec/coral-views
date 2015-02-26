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
  constructor: ( @viewSize, @cacheSize, @items) ->
    @cacheSize ?= @viewSize
    super @cacheSize, @items
    @items ?= []
    # trim to viewSize
    if( @items.length > @viewSize)
      @items.splice( @viewSize, @items.length - @viewSize)
      
    @paged = false
    @viewOffset = 0
    @backgrounded = false
    @pagePending = undefined
    # The part of the next page that was in the cache. Keep it in case it rolls off
    # before the GET reply.
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

    if actions.many
      @items = @itemStore[@viewOffset ... (@viewOffset + @viewSize)] # exclude 'to' index
      if @items.length > @viewSize
        removedItems = @items.splice( @viewSize, @items.length - @viewSize)
    else
      removedItems = actionRemove actions.remove if actions.remove 
      actionInsert actions.insert if actions.insert
      
    removedItems

    
  actionRemove: ( remove) ->
    removeAt = remove.at - @viewOffset
    if removeAt >= 0 and removeAt < @viewSize
      @items.splice( removeAt, 1)
    else if removeAt < 0
      @viewOffset -= 1
    
      
  actionInsert: ( insert) ->
    insertAt = insert.at - @viewOffset
    if insertAt >= 0 and insertAt < @viewSize
      @items.splice( insertAt, insert.item)
    else if insertAt < 0
      @viewOffset += 1
    
  
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
    if @pagePending is 'next'
      @items = @pagePendingCache.concat( items)
    if not @paged
      background()
      @paged = true
    @items = items

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
  pageNext: ->
    return false if @pagePending
    # Page next can be
    #   Within the itemStore
    #   Partially off the end of the itemStore
    #   Fully off the end of the itemStore
    #
    switch
      
      when @viewOffset + 2 * @viewSize < @itemStore.length
        # Load page from cache
        @viewOffset += @viewSize
        @items = @itemStore[@viewOffset ... (@viewOffset + @viewSize)] # exclude 'to' index
        @paged = true
#      # Partially within cache
#      when @viewOffset + @viewSize + 1 < @itemStore.length
#        limit = @itemStore.length - (@viewOffset + @viewSize)
#        @pagePending = 'next'
#        @pageRest.next( @items[@items.length], limit, @pageSuccess, @pageFailure)
      # Off the end of what's loaded in the cache. Maybe past cache capacity.
      else
        # Need to GET more that what's in cache. Might need to GET a whole or partial page.
        nextPageOffset = @viewOffset + @viewSize
        @pagePendingCache = @itemStore[nextPageOffset...(nextPageOffset + @viewSize)] # empty or partial page.
        limit = @viewSize - @pagePendingCache.length
        @pagePending = 'next'
        @pageRest.next( @items[@items.length], limit, @pageSuccess, @pageFailure)
    true

  pagePrevious: ->
    if not @pagePending
      @pagePending = 'previous'
      @pageRest.next( @pageSuccess, @pageFailure)
      true
    else
      false

  pageFirst: ->
    foreground()
    


