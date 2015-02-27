
SubscriptionCacheAction =
  NONE:   0  # item
  UPDATE: 1  # item
  INSERT: 2  # item, at
  REMOVE: 3  # item, at
  MOVE:   4  # item, from, to
  TRIM:   5  # items, at, count

class SubscriptionCache
  
  ###
    @param cacheSize -   
    @param items -
  ###
  constructor: ( @cacheSize, items) ->
    @itemStore = []
    if( items)
      @itemStore = items[0...@cacheSize] # 0 ... @cacheSize - 1

  onMessage: ( item) ->
    actions = []
    return actions if not item
    isArray = angular.isArray( item)
    if isArray
      switch item.length
        when 0
          return actions
        when 1
          isArray = false
          item = item[0]
          
    if( isArray)
      console.log( 'SubscriptionCache onMessage length=' + item.length)
      actions = (@insert i for i in item by -1)
    else
      action = @insert item
      if action.type isnt SubscriptionCacheAction.NONE
        actions[actions.length] = action
    if( @itemStore.length > @cacheSize)
      count = @itemStore.length - @cacheSize
      actions[actions.length] =
        type: SubscriptionCacheAction.TRIM
        at: @cacheSize
        count: count
        items: @itemStore.splice( @cacheSize, count)
    actions

  insert: (item) ->
    insertAt = -1
    if( @itemStore.length is 0 or item.time >= @itemStore[0].time)
      @itemStore.unshift( item)
      insertAt = 0
    else
      i = 1
      loop
        if i >= @itemStore.length
          if @itemStore.length < @cacheSize
            @itemStore[@itemStore.length] = item
            insertAt = @itemStore.length - 1
          break
        else if item.time >= @itemStore[i].time
          @itemStore.splice( i, 0, item)
          insertAt = i
          break
        else
          i++
    if insertAt >= 0
      type: SubscriptionCacheAction.INSERT
      at: insertAt
      item: item
    else
      type: SubscriptionCacheAction.NONE
      item: item

#  sortByTime: ->
#    @itemStore.sort( ( a, b) -> return b.time - a.time)
