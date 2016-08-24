
GBSubscriptionCacheAction =
  NONE:   0  # item
  UPDATE: 1  # item, at - Do we need always know 'at'?
  INSERT: 2  # item, at
  REMOVE: 3  # item, from
  MOVE:   4  # item, from, to
  TRIM:   5  # items, at, count

class GBSubscriptionCache
  
  ###
    @param cacheSize -   
    @param items -
  ###
  constructor: ( @cacheSize, items, @sortFn) ->
    @itemStore = []
    @itemIdMap = {}
    if( items)
      @itemStore = items[..]
      @itemStore.sort( @sortFn) if @sortFn?
      if @itemStore.length > @cacheSize
        @itemStore = @itemStore[0...@cacheSize] # 0 ... @cacheSize - 1
      for item in @itemStore
        @itemIdMap[item.id] = item
        
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
      console.log( 'GBSubscriptionCache onMessage length=' + item.length)
      actions = (@updateOrInsert i for i in item by -1)
    else
      action = @updateOrInsert item
      if action.type isnt GBSubscriptionCacheAction.NONE
        actions[actions.length] = action
    if( @itemStore.length > @cacheSize)
      count = @itemStore.length - @cacheSize
      trimmed = @itemStore.splice( @cacheSize, count)
      actions[actions.length] =
        type: GBSubscriptionCacheAction.TRIM
        at: @cacheSize
        count: count
        items: trimmed
      for item in trimmed
        delete @itemIdMap[item.id]
    actions

  updateOrInsert: (item) ->
    existing = @itemIdMap[item.id]
    if existing
      @update existing, item
    else
      @insert item
      
  itemAboveIsEarlier: ( item, index) -> index > 0 and @itemStore[index-1].time < item.time
  itemBelowIsLater: ( item, index) -> index < @itemStore.length - 1 and @itemStore[index+1].time > item.time
  itemIsOutOfOrder: ( item, index) -> @itemAboveIsEarlier( item, index) or @itemBelowIsLater( item, index)

  # Should this item be removed after an update?
  # @param item - The item after it's been updated.
  #
  shouldRemoveItemOnUpdate: ( item) -> false
  
  convertInsertActionToIncludeRemove: (item, index, action) ->
    if action.type is GBSubscriptionCacheAction.INSERT
      type: GBSubscriptionCacheAction.MOVE
      from: index
      to: action.at
      item: item
    else
      # No insert, just remove
      type: GBSubscriptionCacheAction.REMOVE
      from: index
      item: item

  update: (item, update) ->
    angular.extend( item, update)
    index = @itemStore.indexOf( item)
    if index >= 0
      if @shouldRemoveItemOnUpdate( item)
        @itemStore.splice( index, 1)
        type: GBSubscriptionCacheAction.REMOVE
        from: index
        item: item
      else if @itemIsOutOfOrder( item, index)
        @itemStore.splice( index, 1)
        action = @insert item
        @convertInsertActionToIncludeRemove item, index, action
      else
        type: GBSubscriptionCacheAction.UPDATE
        at: index
        item: item
    else
      type: GBSubscriptionCacheAction.NONE
      item: item

      
  insert: (item) ->
    insertAt = -1
#    if( @itemStore.length is 0 or item.time >= @itemStore[0].time)
    if( @itemStore.length is 0 or @sortFn?( item, @itemStore[0]) <= 0)
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
        #else if item.time >= @itemStore[i].time
        else if @sortFn?( item, @itemStore[i]) <= 0
          @itemStore.splice( i, 0, item)
          insertAt = i
          break
        else
          i++
          
    if insertAt >= 0
      @itemIdMap[item.id] = item
      # return
      type: GBSubscriptionCacheAction.INSERT
      at: insertAt
      item: item
    else
      # Insert is past @cacheSize
      #return
      type: GBSubscriptionCacheAction.NONE
      item: item

  indexOfId: (id) ->
    for item, index in @itemStore
      return index if item.id is id
    -1

  getItemById: (id) ->
    @itemIdMap[id]
