describe('SubscriptionView', function () {
  var items, itemsSorted, pageRest,
      page1, page2, page3,
      itemCount = 6

  beforeEach( function() {
    items = []
    for( var index = 0; index < itemCount; index++) {
      var index10 = index * 10
      items.push( {
        id: 'id'+ index10,
        time: index10
      })
    }
    itemsSorted = items.slice(0).sort( function( a, b) { return b.time - a.time})
    page1 = itemsSorted.slice(0,2) // 50, 40
    page2 = itemsSorted.slice(2,4) // 30, 20
    page3 = itemsSorted.slice(4,6) // 10, 0

    pageRest = {
      pageNext: function( startAfterId, limit, pageSuccess, pageFailure) {
        pageRest.nextStartAfterId = startAfterId
        pageRest.nextLimit = limit
        pageRest.nextSuccess = pageSuccess
        pageRest.nextFailure = pageFailure
      },
      pagePrevious: function( startAfterId, limit, pageSuccess, pageFailure) {
        pageRest.previousStartAfterId = startAfterId
        pageRest.previousLimit = limit
        pageRest.previousSuccess = pageSuccess
        pageRest.previousFailure = pageFailure
      }

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
    var view = new SubscriptionView( 2, 2, items.slice(0,3))
    expect(view.viewSize).toEqual(2);
    expect(view.cacheSize).toEqual(2);
    expect(view.items.length).toEqual(2);
    expect(view.itemStore.length).toEqual(2);
    expect(view.items).toEqual([items[2], items[1]]); // reverse time

    view = new SubscriptionView( 1, 2, items.slice(0,3))
    expect(view.viewSize).toEqual(1);
    expect(view.cacheSize).toEqual(2);
    expect(view.items.length).toEqual(1);
    expect(view.itemStore.length).toEqual(2);
  }));

  it('onMessage should add single items sorted by reverse time and limit total items', inject( function () {
    var removed,
        view = new SubscriptionView( 3),
        i0 = {time: 0, id: 'id0'},
        i1 = {time: 10, id: 'id10'},
        i2 = {time: 20, id: 'id20'},
        i3 = {time: 30, id: 'id30'},
        i4 = {time: 40, id: 'id40'},
        i5 = {time: 50, id: 'id50'},
        i6 = {time: 60, id: 'id60'}

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
        i0 = {time: 0, id: 'id0'},
        i1 = {time: 10, id: 'id10'},
        i2 = {time: 20, id: 'id20'},
        i3 = {time: 30, id: 'id30'},
        i4 = {time: 40, id: 'id40'},
        i5 = {time: 50, id: 'id50'},
        i6 = {time: 60, id: 'id60'}

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

  it('pageNext get from cache, cache, then GET', inject( function () {
    var state,
        view = new SubscriptionView( 2, 6, items),
        i6 = {time: 60, id: 'id60'},
        i7 = {time: 70, id: 'id70'}


    expect(view.items).toEqual( page1);
    expect(view.itemStore).toEqual( itemsSorted.slice(0,6));

    state = view.pageNext( pageRest)
    expect(state).toBe(SubscriptionViewState.PAGED);
    expect(view.items.length).toEqual(2);
    expect(view.items).toEqual( page2);

    state = view.pageNext( pageRest)
    expect(state).toBe(SubscriptionViewState.PAGED);
    expect(view.items.length).toEqual(2);
    expect(view.items).toEqual( itemsSorted.slice(4,6));

    state = view.pageNext( pageRest)
    expect(state).toBe(SubscriptionViewState.PAGING_NEXT);
    expect(view.items.length).toEqual(2);
    expect(view.items).toEqual( itemsSorted.slice(4,6));
    expect(view.pagePending.direction).toBe('next');
    expect( pageRest.nextStartAfterId).toBe( itemsSorted[5].id)
    
    pageRest.nextSuccess( [i6, i7])
    expect(view.pagePending).not.toBeDefined();
    expect(view.items).toEqual( [i7, i6]);
    expect(view.itemStore).toEqual( [i7,i6].concat( itemsSorted.slice(0,4)));

  }));

  it('pageNext should get partial from cache, then use GET  because paged. Store results in SubscriptionCache', inject( function () {
    var state,
        view = new SubscriptionView( 2, 6, itemsSorted.slice(0,3))

    expect(view.items).toEqual( page1);
    expect(view.itemStore).toEqual( itemsSorted.slice(0,3));

    // pageNext partial from cache.
    state = view.pageNext( pageRest)
    expect(state).toBe(SubscriptionViewState.PAGING_NEXT);
    expect(view.pagePending.direction).toEqual( 'next');
    expect(view.pagePending.cache).toEqual( itemsSorted.slice(2,3));
    expect(view.items).toEqual( page1); // not paged yet
    expect( pageRest.nextStartAfterId).toBe( itemsSorted[1].id)
    // page while paging
    state = view.pageNext( pageRest)
    expect(state).toBe('pastPending');
    // GET success
    pageRest.nextSuccess( [page2[1]])
    expect(view.pagePending).not.toBeDefined();
    expect(view.items).toEqual( page2);
    expect(view.itemStore).toEqual( itemsSorted.slice(0,4));

    // pageNext all from GET.
    state = view.pageNext( pageRest)
    expect(state).toBe(SubscriptionViewState.PAGING_NEXT);
    expect(view.pagePending.direction).toEqual( 'next');
    expect(view.pagePending.cache).toBeUndefined();
    expect(view.items).toEqual( page2); // not paged yet
    expect( pageRest.nextStartAfterId).toBe( itemsSorted[3].id)

    pageRest.nextSuccess( page3)
    expect(view.pagePending).not.toBeDefined();
    expect(view.items).toEqual( page3);
    expect(view.itemStore).toEqual( itemsSorted.slice(0,6));

  }));
  
  it('pageNext with view at end of cache should use GET. No current results to store in SubscriptionCache', inject( function () {
    var state,
        view = new SubscriptionView( 2, 2, itemsSorted.slice(0,2))

    expect(view.items).toEqual( page1);
    expect(view.itemStore).toEqual( page1);

    // pageNext partial from cache.
    state = view.pageNext( pageRest)
    expect(state).toBe(SubscriptionViewState.PAGING_NEXT);
    expect(view.pagePending.direction).toEqual( 'next');
    expect(view.pagePending.cache).toEqual( []);
    expect(view.items).toEqual( page1); // not paged yet
    
    // GET success
    pageRest.nextSuccess( page2)
    expect(view.pagePending).not.toBeDefined();
    expect(view.items).toEqual( page2);
    expect(view.itemStore).toEqual( page1);

  }));

  it('when paged, onMessage before page should update pageCacheOffset so pageNext is in sync', inject( function () {
    var state, removed,
        view = new SubscriptionView( 2, 7, items),
        i6 = {time: 60, id: 'id60'}

    expect(view.items).toEqual( page1);
    expect(view.itemStore).toEqual( itemsSorted.slice(0,6));

    state = view.pageNext( pageRest)
    expect(state).toBe(SubscriptionViewState.PAGED);
    expect(view.items.length).toEqual(2);
    expect(view.items).toEqual( page2);
    expect(view.pageCacheOffset).toEqual( 2);

    removed = view.onMessage( i6)
    expect(removed.length).toEqual( 0);
    expect(view.items.length).toEqual(2);
    expect(view.items).toEqual( page2);
    expect(view.pageCacheOffset).toEqual( 3);

    state = view.pageNext( pageRest)
    expect(state).toBe(SubscriptionViewState.PAGED);
    expect(view.items.length).toEqual(2);
    expect(view.items).toEqual( page3);

  }));

  it('when paged, onMessage inserted at pageCacheOffset, pageCacheOffset should be updated', inject( function () {
    var state, removed,
        view = new SubscriptionView( 2, 7, items),
        i31 = {time: 31, id: 'id31'}

    expect(view.items).toEqual( page1);
    expect(view.itemStore).toEqual( itemsSorted.slice(0,6));

    state = view.pageNext( pageRest)
    expect(state).toBe(SubscriptionViewState.PAGED);
    expect(view.items.length).toEqual(2);
    expect(view.items).toEqual( page2);
    expect(view.pageCacheOffset).toEqual( 2);

    removed = view.onMessage( i31)
    expect(removed.length).toEqual( 0);
    expect(view.items.length).toEqual(2);
    expect(view.items).toEqual( page2);
    expect(view.pageCacheOffset).toEqual( 3);

    state = view.pageNext( pageRest)
    expect(state).toBe(SubscriptionViewState.PAGED);
    expect(view.items.length).toEqual(2);
    expect(view.items).toEqual( page3);

  }));

  it('when paged, onMessage within page should affect the current and next page', inject( function () {
    var state, removed,
        view = new SubscriptionView( 2, 7, items),
        page35 = itemsSorted.slice(3,5),
        i25 = {time: 25, id: 'id25'}

    expect(view.items).toEqual( page1);
    expect(view.itemStore).toEqual( itemsSorted.slice(0,6));

    state = view.pageNext( pageRest)
    expect(state).toBe(SubscriptionViewState.PAGED);
    expect(view.items.length).toEqual(2);
    expect(view.items).toEqual( page2);
    expect(view.pageCacheOffset).toEqual( 2);

    removed = view.onMessage( i25)
    expect(removed.length).toEqual( 1);
    expect(removed).toEqual( [itemsSorted[3]]);
    expect(view.items.length).toEqual(2);
    expect(view.items).toEqual( [page2[0], i25]);
    expect(view.pageCacheOffset).toEqual( 2);

    state = view.pageNext( pageRest)
    expect(state).toBe(SubscriptionViewState.PAGED);
    expect(view.items.length).toEqual(2);
    expect(view.items).toEqual( page35);

  }));

  it('when paged, onMessage after page should not affect the current page', inject( function () {
    var state, removed,
        view = new SubscriptionView( 2, 7, items),// 0, 10, 20, 30, 40, 50
        i05 = {time: 5, id: 'id5'},
        page3 = [itemsSorted[4], i05] // 10, 5

    expect(view.items).toEqual( page1);
    expect(view.itemStore).toEqual( itemsSorted.slice(0,6));

    state = view.pageNext( pageRest)
    expect(state).toBe(SubscriptionViewState.PAGED);
    expect(view.items.length).toEqual(2);
    expect(view.items).toEqual( page2);
    expect(view.pageCacheOffset).toEqual( 2);

    removed = view.onMessage( i05)
    expect(removed.length).toEqual( 0);
    expect(view.items.length).toEqual(2);
    expect(view.items).toEqual( page2);
    expect(view.pageCacheOffset).toEqual( 2);

    state = view.pageNext( pageRest)
    expect(state).toBe(SubscriptionViewState.PAGED);
    expect(view.items.length).toEqual(2);
    expect(view.items).toEqual( page3);

  }));

  it('should pageNext and pagePrevious from from cache', inject( function () {
    var state,
        view = new SubscriptionView( 2, 6, items)

    expect(view.items).toEqual( page1);
    expect(view.itemStore).toEqual( itemsSorted.slice(0,6));

    state = view.pageNext( pageRest)
    expect(state).toBe(SubscriptionViewState.PAGED);
    expect(view.pagePending).not.toBeDefined();
    expect(view.items.length).toEqual(2);
    expect(view.items).toEqual( page2);

    state = view.pageNext( pageRest)
    expect(state).toBe(SubscriptionViewState.PAGED);
    expect(view.pagePending).not.toBeDefined();
    expect(view.items.length).toEqual(2);
    expect(view.items).toEqual( page3);

    state = view.pagePrevious( pageRest)
    expect(state).toBe(SubscriptionViewState.PAGED);
    expect(view.pagePending).not.toBeDefined();
    expect(view.items.length).toEqual(2);
    expect(view.items).toEqual( page2);

    state = view.pagePrevious( pageRest)
    expect(state).toBe(SubscriptionViewState.CURRENT);
    expect(view.pagePending).not.toBeDefined();
    expect(view.items.length).toEqual(2);
    expect(view.items).toEqual( page1);
    expect(view.pageCacheOffset).toBe(0);

  }));
  
  it('should pageNext past cache then pagePrevious back to cache', inject( function () {
    var view = new SubscriptionView( 2, 6, items.slice(1,6)), // not t=0
        i02 = {time: 2, id: 'id02'},
        i04 = {time: 2, id: 'id04'},
        i06 = {time: 2, id: 'id06'},
        i08 = {time: 2, id: 'id08'},
        page3 = [itemsSorted[4], i08]

    expect(view.items).toEqual( page1);
    expect(view.itemStore).toEqual( itemsSorted.slice(0,5));

    // pageNext to get past cache
    state = view.pageNext( pageRest)
    state = view.pageNext( pageRest)
    state = view.pageNext( pageRest)
    expect(view.pagePending.direction).toBe('next');
    pageRest.nextSuccess( i08)
    expect(view.items).toEqual( page3);
    expect(view.pageCacheOffset).toBe(-1);


    state = view.pagePrevious( pageRest)
    expect(state).toBe(SubscriptionViewState.PAGING_PREVIOUS);
    expect(view.pagePending.direction).toBe('previous');
    expect(view.items.length).toEqual(2);
    expect(view.items).toEqual( page3);
    expect( pageRest.previousStartAfterId).toBe( page3[0].id)

    pageRest.previousSuccess( page2)
    expect(view.items).toEqual( page2);
    expect(view.pageCacheOffset).toBe(2);

    state = view.pagePrevious( pageRest)
    expect(state).toBe(SubscriptionViewState.CURRENT);
    expect(view.pagePending).toBeUndefined();
    expect(view.items.length).toEqual(2);
    expect(view.items).toEqual( page1);
    expect(view.pageCacheOffset).toBe(0);

  }));

});
