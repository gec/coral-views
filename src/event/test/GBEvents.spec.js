describe('GBEvents', function () {
  var eventCount = 3,
      events = [];

  for( var index = 0; index < eventCount; index++) {
    events.push( {
      id: 'id'+index,
      deviceTime: index,
      eventType: 'eventType'+index,
      alarm: null,
      severity: index,
      agent: 'agent'+index,
      entity: 'entitId'+index,
      message: 'message'+index,
      time: index
    })
  }


  beforeEach(module('greenbus.views.event'));


  it('should start with 0 events and set limit', inject( function () {
    var e = new GBEvents( 3)
    expect(e.events.length).toEqual(0);
    expect(e.limit).toEqual(3);
  }));

  it('should limit events from construction', inject( function () {
    var e = new GBEvents( 2, events)
    expect(e.limit).toEqual(2);
    expect(e.events.length).toEqual(2);
  }));

  it('should add single events sorted by reverse time and limit total events', inject( function () {
    var removed,
        e = new GBEvents( 3)

    removed = e.onMessage( {time: 0})
    expect(e.events.length).toEqual(1);
    expect(removed.length).toEqual(0);

    removed = e.onMessage( {time: 2})
    expect(e.events.length).toEqual(2);
    expect(removed.length).toEqual(0);
    expect(e.events).toEqual( [{time: 2},{time: 0}]);

    removed = e.onMessage( {time: 1})
    expect(e.events.length).toEqual(3);
    expect(removed.length).toEqual(0);
    expect(e.events).toEqual( [{time: 2},{time: 1},{time: 0}]);

    removed = e.onMessage( {time: 5})
    expect(e.events.length).toEqual(3);
    expect(removed).toEqual([{time: 0}]);
    expect(e.events).toEqual( [{time: 5},{time: 2},{time: 1}]);

    // add then trim this message.
    removed = e.onMessage( {time: 0})
    expect(e.events.length).toEqual(3);
    expect(removed).toEqual([{time: 0}]);
    expect(e.events).toEqual( [{time: 5},{time: 2},{time: 1}]);

    removed = e.onMessage( {time: 4})
    expect(e.events.length).toEqual(3);
    expect(removed).toEqual([{time: 1}]);
    expect(e.events).toEqual( [{time: 5},{time: 4},{time: 2}]);


  }));

  it('should add event arrays sorted by reverse time and limit total events', inject( function () {
    var removed,
        e = new GBEvents( 3)

    removed = e.onMessage( [{time: 0},{time: 2}])
    expect(e.events.length).toEqual(2);
    expect(removed.length).toEqual(0);
    expect(e.events).toEqual( [{time: 2},{time: 0}]);

    removed = e.onMessage( [{time: 1}])
    expect(e.events.length).toEqual(3);
    expect(removed.length).toEqual(0);
    expect(e.events).toEqual( [{time: 2},{time: 1},{time: 0}]);

    removed = e.onMessage( [{time: 6},{time: 4}])
    expect(e.events.length).toEqual(3);
    expect(removed).toEqual([{time: 1},{time: 0}]);
    expect(e.events).toEqual( [{time: 6},{time: 4},{time: 2}]);

    // add then trim this message.
    removed = e.onMessage( [{time: 0}])
    expect(e.events.length).toEqual(3);
    expect(removed).toEqual([{time: 0}]);
    expect(e.events).toEqual( [{time: 6},{time: 4},{time: 2}]);

    removed = e.onMessage( [{time: 5}])
    expect(e.events.length).toEqual(3);
    expect(removed).toEqual([{time: 2}]);
    expect(e.events).toEqual( [{time: 6},{time: 5},{time: 4}]);

    removed = e.onMessage( [])
    expect(e.events.length).toEqual(3);
    expect(removed.length).toEqual(0);
    expect(e.events).toEqual( [{time: 6},{time: 5},{time: 4}]);
  }));

});
