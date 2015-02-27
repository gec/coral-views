describe('SubscriptionView', function () {
  var items,
      itemCount = 3

  beforeEach( function() {
    items = []
    for( var index = 0; index < itemCount; index++) {
      items.push( {
        id: 'id'+index,
        time: index
      })
    }
  })


  beforeEach(module('greenbus.views.event'));


  it('should start with 0 items and set limit', inject( function () {
    var view = new SubscriptionView( 3)
    expect(view.items.length).toEqual(0);
    expect(view.viewSize).toEqual(3);
    expect(view.cacheSize).toEqual(3);
    expect(view.items.length).toEqual(0);
    expect(view.itemStore.length).toEqual(0);
  }));

  it('should limit items from construction', inject( function () {
    var view = new SubscriptionView( 2, 2, items)
    expect(view.viewSize).toEqual(2);
    expect(view.cacheSize).toEqual(2);
    expect(view.items.length).toEqual(2);
    expect(view.itemStore.length).toEqual(2);

    view = new SubscriptionView( 1, 2, items)
    expect(view.viewSize).toEqual(1);
    expect(view.cacheSize).toEqual(2);
    expect(view.items.length).toEqual(1);
    expect(view.itemStore.length).toEqual(2);
  }));

  it('onMessage should add single items sorted by reverse time and limit total items', inject( function () {
    var removed,
        view = new SubscriptionView( 3),
        i0 = {time: 0},
        i1 = {time: 1},
        i2 = {time: 2},
        i3 = {time: 3},
        i4 = {time: 4},
        i5 = {time: 5},
        i6 = {time: 6}

    removed = view.onMessage( i0)
    expect(view.items.length).toEqual(1);
    expect(removed.length).toEqual( 0);

    removed = view.onMessage( i2)
    expect(view.items.length).toEqual(2);
    expect(removed.length).toEqual( 0);
    expect(view.items).toEqual( [i2,i0]);

    removed = view.onMessage( i1)
    expect(view.items.length).toEqual(3);
    expect(removed.length).toEqual( 0);
    expect(view.items).toEqual( [i2,i1,i0]);

    removed = view.onMessage( i5)
    expect(view.items.length).toEqual(3);
    expect(removed).toEqual( [i0]);
    expect(view.items).toEqual( [i5,i2,i1]);

    // add then trim this message.
    removed = view.onMessage( i0)
    expect(view.items.length).toEqual(3);
    expect(removed.length).toEqual(0);
    expect(view.items).toEqual( [i5,i2,i1]);

    removed = view.onMessage( i4)
    expect(view.items.length).toEqual(3);
    expect(removed).toEqual( [i1]);
    expect(view.items).toEqual( [i5,i4,i2]);


  }));
  it('onMessage should trim items with view limit is less than cache limit', inject( function () {
    var removed,
        view = new SubscriptionView( 2, 3),
        i0 = {time: 0},
        i1 = {time: 1},
        i2 = {time: 2},
        i3 = {time: 3},
        i4 = {time: 4},
        i5 = {time: 5},
        i6 = {time: 6}

    removed = view.onMessage( i0)
    expect(view.items.length).toEqual(1);
    expect(removed.length).toEqual( 0);

    removed = view.onMessage( i2)
    expect(view.items.length).toEqual(2);
    expect(removed.length).toEqual( 0);
    expect(view.items).toEqual( [i2,i0]);

    removed = view.onMessage( i1)
    expect(view.items.length).toEqual(2);
    expect(removed.length).toEqual( 1);
    expect(view.items).toEqual( [i2,i1]);

    removed = view.onMessage( i5)
    expect(view.items.length).toEqual(2);
    expect(removed).toEqual( [i1]);
    expect(view.items).toEqual( [i5,i2]);

    // add then trim this message.
    removed = view.onMessage( i0)
    expect(view.items.length).toEqual(2);
    expect(removed.length).toEqual(0);
    expect(view.items).toEqual( [i5,i2]);

    removed = view.onMessage( i4)
    expect(view.items.length).toEqual(2);
    expect(removed).toEqual( [i2]);
    expect(view.items).toEqual( [i5,i4]);


  }));

  it('should add item arrays sorted by reverse time and limit total items', inject( function () {
    var removed,
        view = new SubscriptionView( 3),
        i0 = {time: 0},
        i1 = {time: 1},
        i2 = {time: 2},
        i3 = {time: 3},
        i4 = {time: 4},
        i5 = {time: 5},
        i6 = {time: 6}

    //removed = view.onMessage( [i0,i2])
    //expect(view.items.length).toEqual(2);
    //expect(removed.many).toBeTruthy();
    //expect(view.items).toEqual( [i2,i0]);
    //
    //removed = view.onMessage( [i1])
    //expect(view.items.length).toEqual(3);
    //expect(removed.insert.at).toEqual( 1);
    //expect(removed.insert.item).toEqual( i1);
    //expect(view.items).toEqual( [i2,i1,i0]);
    //
    //removed = view.onMessage( [i6,i4])
    //expect(view.items.length).toEqual(3);
    //expect(removed.many).toBeTruthy();
    //expect(removed.trimmed).toEqual( [i1,i0]);
    //expect(view.items).toEqual( [i6,i4,i2]);
    //
    //// add then trim this message.
    //removed = view.onMessage( [i0])
    //expect(view.items.length).toEqual(3);
    //expect(removed).toEqual({});
    //expect(removed.trimmed).toBeUndefined();
    //expect(view.items).toEqual( [i6,i4,i2]);
    //
    //removed = view.onMessage( [i5])
    //expect(view.items.length).toEqual(3);
    //expect(removed.insert.at).toEqual( 1);
    //expect(removed.insert.item).toEqual( i5);
    //expect(removed.trimmed).toEqual( [i2]);
    //expect(view.items).toEqual( [i6,i5,i4]);
    //
    //removed = view.onMessage( [])
    //expect(view.items.length).toEqual(3);
    //expect(removed).toEqual({});
    //expect(removed.trimmed).toBeUndefined();
    //expect(view.items).toEqual( [i6,i5,i4]);
  }));

});
