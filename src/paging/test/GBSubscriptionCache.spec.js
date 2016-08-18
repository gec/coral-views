describe('GBSubscriptionCache', function () {

  beforeEach(module('greenbus.views.event'));

  it('should start with 0 items and set limit', inject( function () {
    var cache = new GBSubscriptionCache( 3)
    expect(cache.itemStore.length).toEqual(0);
    expect(cache.cacheSize).toEqual(3);
  }));

  it('should limit items from construction', inject( function () {
    var i0 = {time: 0, id: 'id0'},
        i1 = {time: 1, id: 'id1'},
        i2 = {time: 2, id: 'id2'}

    var cache = new GBSubscriptionCache( 2, [i0,i1,i2])
    expect(cache.cacheSize).toEqual(2);
    expect(cache.itemStore.length).toEqual(2);
  }));

  it('should add single items sorted by reverse time and limit total items', inject( function () {
    var actions, action,
        cache = new GBSubscriptionCache( 3),
        i0 = {time: 0, id: 'id0'},
        i1 = {time: 1, id: 'id1'},
        i2 = {time: 2, id: 'id2'},
        i3 = {time: 3, id: 'id3'},
        i4 = {time: 4, id: 'id4'},
        i5 = {time: 5, id: 'id5'},
        i6 = {time: 6, id: 'id6'}

    actions = cache.onMessage( i0)
    expect(cache.itemStore.length).toEqual(1);
    expect(actions.length).toEqual( 1);
    action = actions[0]
    expect(action.type).toEqual( GBSubscriptionCacheAction.INSERT);
    expect(action.at).toEqual( 0);
    expect(action.item).toEqual( i0);

    actions = cache.onMessage( i2)
    expect(cache.itemStore.length).toEqual(2);
    expect(actions.length).toEqual( 1);
    action = actions[0]
    expect(action.type).toEqual( GBSubscriptionCacheAction.INSERT);
    expect(action.at).toEqual( 0);
    expect(action.item).toEqual( i2);
    expect(cache.itemStore).toEqual( [i2,i0]);

    actions = cache.onMessage( i1)
    expect(cache.itemStore.length).toEqual(3);
    expect(actions.length).toEqual( 1);
    action = actions[0]
    expect(action.type).toEqual( GBSubscriptionCacheAction.INSERT);
    expect(action.at).toEqual( 1);
    expect(action.item).toEqual( i1);
    expect(cache.itemStore).toEqual( [i2,i1,i0]);

    actions = cache.onMessage( i5)
    expect(cache.itemStore.length).toEqual(3);
    expect(actions.length).toEqual( 2);
    action = actions[0]
    expect(action.type).toEqual( GBSubscriptionCacheAction.INSERT);
    expect(action.at).toEqual( 0);
    expect(action.item).toEqual( i5);
    action = actions[1]
    expect(action.type).toEqual( GBSubscriptionCacheAction.TRIM);
    expect(action.at).toEqual( 3);
    expect(action.count).toEqual( 1);
    expect(action.items).toEqual( [i0]);
    expect(cache.itemStore).toEqual( [i5,i2,i1]);

    // add then trim this message.
    actions = cache.onMessage( i0)
    expect(cache.itemStore.length).toEqual(3);
    expect(actions.length).toEqual( 0);
    expect(cache.itemStore).toEqual( [i5,i2,i1]);

    actions = cache.onMessage( i4)
    expect(cache.itemStore.length).toEqual(3);
    expect(actions.length).toEqual( 2);
    action = actions[0]
    expect(action.type).toEqual( GBSubscriptionCacheAction.INSERT);
    expect(action.at).toEqual( 1);
    expect(action.item).toEqual( i4);
    action = actions[1]
    expect(action.type).toEqual( GBSubscriptionCacheAction.TRIM);
    expect(action.at).toEqual( 3);
    expect(action.count).toEqual( 1);
    expect(action.items).toEqual( [i1]);
    expect(cache.itemStore).toEqual( [i5,i4,i2]);


  }));

  it('should add item arrays sorted by reverse time and limit total items', inject( function () {
    var actions, action,
        cache = new GBSubscriptionCache( 3),
        i0 = {time: 0, id: 'id0'},
        i1 = {time: 1, id: 'id1'},
        i2 = {time: 2, id: 'id2'},
        i3 = {time: 3, id: 'id3'},
        i4 = {time: 4, id: 'id4'},
        i5 = {time: 5, id: 'id5'},
        i6 = {time: 6, id: 'id6'}

    actions = cache.onMessage( [i0,i2])
    expect(cache.itemStore.length).toEqual(2);
    expect(actions.length).toEqual( 2);
    action = actions[0]
    expect(action.type).toEqual( GBSubscriptionCacheAction.INSERT);
    expect(action.at).toEqual( 0);
    expect(action.item).toEqual( i2);
    action = actions[1]
    expect(action.type).toEqual( GBSubscriptionCacheAction.INSERT);
    expect(action.at).toEqual( 1);
    expect(action.item).toEqual( i0);
    expect(cache.itemStore).toEqual( [i2,i0]);

    actions = cache.onMessage( [i1])
    expect(cache.itemStore.length).toEqual(3);
    expect(actions.length).toEqual( 1);
    action = actions[0]
    expect(action.type).toEqual( GBSubscriptionCacheAction.INSERT);
    expect(action.at).toEqual( 1);
    expect(action.item).toEqual( i1);
    expect(cache.itemStore).toEqual( [i2,i1,i0]);

    actions = cache.onMessage( [i6,i4])
    expect(cache.itemStore.length).toEqual(3);
    expect(actions.length).toEqual( 3);
    action = actions[0]
    expect(action.type).toEqual( GBSubscriptionCacheAction.INSERT);
    expect(action.at).toEqual( 0);
    expect(action.item).toEqual( i4);
    action = actions[1]
    expect(action.type).toEqual( GBSubscriptionCacheAction.INSERT);
    expect(action.at).toEqual( 0);
    expect(action.item).toEqual( i6);
    action = actions[2]
    expect(action.type).toEqual( GBSubscriptionCacheAction.TRIM);
    expect(action.at).toEqual( 3);
    expect(action.count).toEqual( 2);
    expect(action.items).toEqual( [i1,i0]);
    expect(cache.itemStore).toEqual( [i6,i4,i2]);

    // add then trim this message.
    actions = cache.onMessage( [i0])
    expect(cache.itemStore.length).toEqual(3);
    expect(actions.length).toEqual( 0);
    expect(cache.itemStore).toEqual( [i6,i4,i2]);

    actions = cache.onMessage( [i5])
    expect(cache.itemStore.length).toEqual(3);
    expect(actions.length).toEqual( 2);
    action = actions[0]
    expect(action.type).toEqual( GBSubscriptionCacheAction.INSERT);
    expect(action.at).toEqual( 1);
    expect(action.item).toEqual( i5);
    action = actions[1]
    expect(action.type).toEqual( GBSubscriptionCacheAction.TRIM);
    expect(action.at).toEqual( 3);
    expect(action.count).toEqual( 1);
    expect(action.items).toEqual( [i2]);
    expect(cache.itemStore).toEqual( [i6,i5,i4]);

    actions = cache.onMessage( [])
    expect(cache.itemStore.length).toEqual(3);
    expect(actions.length).toEqual( 0);
    expect(cache.itemStore).toEqual( [i6,i5,i4]);
  }));

  it('should manage item updates', inject( function () {
    var actions, action,
        cache = new GBSubscriptionCache( 3),
        i0 = {time: 0, id: 'id0'},
        i1 = {time: 1, id: 'id1'},
        i2 = {time: 2, id: 'id2'},
        i3 = {time: 3, id: 'id3'},
        i4 = {time: 4, id: 'id4'},
        i5 = {time: 5, id: 'id5'},
        i6 = {time: 6, id: 'id6'}

    actions = cache.onMessage( i1)
    actions = cache.onMessage( i1)
    expect(cache.itemStore.length).toEqual(1);
    expect(actions.length).toEqual( 1);
    action = actions[0]
    expect(action.type).toEqual( GBSubscriptionCacheAction.UPDATE);
    expect(action.at).toEqual( 0);
    expect(action.item).toEqual( i1);

    
    actions = cache.onMessage( i2)
    actions = cache.onMessage( i2)
    expect(cache.itemStore.length).toEqual(2);
    expect(actions.length).toEqual( 1);
    action = actions[0]
    expect(action.type).toEqual( GBSubscriptionCacheAction.UPDATE);
    expect(action.at).toEqual( 0);
    expect(action.item).toEqual( i2);
    expect(cache.itemStore).toEqual( [i2,i1]);

    
    actions = cache.onMessage( i3)
    actions = cache.onMessage( i3)
    expect(cache.itemStore.length).toEqual(3);
    expect(actions.length).toEqual( 1);
    action = actions[0]
    expect(action.type).toEqual( GBSubscriptionCacheAction.UPDATE);
    expect(action.at).toEqual( 0);
    expect(action.item).toEqual( i3);
    expect(cache.itemStore).toEqual( [i3,i2,i1]);


    var i2t4 = {time: 4, id: 'id2'},
        i2t0 = {time: 0, id: 'id2'}

    // middle to index 0
    actions = cache.onMessage( i2t4)
    expect(cache.itemStore.length).toEqual(3);
    expect(actions.length).toEqual( 1);
    action = actions[0]
    expect(action.type).toEqual( GBSubscriptionCacheAction.MOVE);
    expect(action.from).toEqual( 1);
    expect(action.to).toEqual( 0);
    expect(action.item).toEqual( i2t4);
    expect(cache.itemStore).toEqual( [i2t4,i3,i1]);

    // index 0 to index 2
    actions = cache.onMessage( i2t0)
    expect(cache.itemStore.length).toEqual(3);
    expect(actions.length).toEqual( 1);
    action = actions[0]
    expect(action.type).toEqual( GBSubscriptionCacheAction.MOVE);
    expect(action.from).toEqual( 0);
    expect(action.to).toEqual( 2);
    expect(action.item).toEqual( i2t0);
    expect(cache.itemStore).toEqual( [i3,i1,i2t0]);

    // index 2 to middle
    i2 = {time: 2, id: 'id2'}
    actions = cache.onMessage( i2)
    expect(cache.itemStore.length).toEqual(3);
    expect(actions.length).toEqual( 1);
    action = actions[0]
    expect(action.type).toEqual( GBSubscriptionCacheAction.MOVE);
    expect(action.from).toEqual( 2);
    expect(action.to).toEqual( 1);
    expect(action.item).toEqual( i2);
    expect(cache.itemStore).toEqual( [i3,i2,i1]);

    // Put one off the end of the cache as a noop
    actions = cache.onMessage( i0)
    expect(cache.itemStore.length).toEqual(3);
    expect(actions.length).toEqual( 0);
    expect(cache.itemStore).toEqual( [i3,i2,i1]);

    // middle to index 2
    actions = cache.onMessage( i2t0)
    expect(cache.itemStore.length).toEqual(3);
    expect(actions.length).toEqual( 1);
    action = actions[0]
    expect(action.type).toEqual( GBSubscriptionCacheAction.MOVE);
    expect(action.from).toEqual( 1);
    expect(action.to).toEqual( 2);
    expect(action.item).toEqual( i2t0);
    expect(cache.itemStore).toEqual( [i3,i1,i2t0]);

  }));
  
});
