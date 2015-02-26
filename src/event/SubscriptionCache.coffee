###
  
###
class SubscriptionCache
  constructor: ( @cacheSize, items) ->
    @itemStore = []
    if( items)
      @itemStore = items[0...@cacheSize] # 0 ... @cacheSize - 1

  onMessage: ( item) ->
    actions = {}
    if( angular.isArray( item))
      console.log( 'SubscriptionCache onMessage length=' + item.length)
      insert i for i in item
      actions.many = true
    else
      actions.insert = item: item
      actions.insert.at = insert item
    # sortByTime()
    if( @itemStore.length > @cacheSize)
      actions.trimmed = @itemStore.splice( @cacheSize, @itemStore.length - @cacheSize)
    actions

  insert: (item) ->
    insertAt = 0
    if( @itemStore.length is 0 or item.time >= @itemStore[0])
      @itemStore.unshift( item)
      insertAt = 0
    else
      i = 1
      loop
        if i >= @itemStore.length
          @itemStore[@itemStore.length] = item
          insertAt = @itemStore.length - 1
          break
        else if item.time >= @itemStore[i]
          @itemStore.splice( i, 0, item)
          insertAt = i
          break
        else
          i++
    insertAt
      
#  sortByTime: ->
#    @itemStore.sort( ( a, b) -> return b.time - a.time)
