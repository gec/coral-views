describe('GBAlarms', function () {
  var alarmCount = 7,
      alarms = [];

  for( var index = 0; index < alarmCount; index++) {
    alarms.push( {
      id: 'id'+index,
      //state: 'UNACKNOWLEDGED',
      //deviceTime: index,
      //eventType: 'alarmType'+index,
      //alarm: null,
      //severity: index,
      //agent: 'agent'+index,
      //entity: 'entitId'+index,
      //message: 'message'+index,
      time: index * 10
    })
  }


  beforeEach(module('greenbus.views.event'));


  it('should start with 0 alarms and set limit', inject( function () {
    var e = new GBAlarms( 3)
    expect(e.alarms.length).toEqual(0);
    expect(e.limit).toEqual(3);
  }));

  it('should limit alarms from construction', inject( function () {
    var e = new GBAlarms( 2, alarms)
    expect(e.limit).toEqual(2);
    expect(e.alarms.length).toEqual(2);
  }));

  it('should add single alarms sorted by reverse time and limit total alarms', inject( function () {
    var removed,
        a = new GBAlarms( 3)

    removed = a.onMessage( alarms[0])
    expect(a.alarms.length).toEqual(1);
    expect(removed.length).toEqual(0);

    removed = a.onMessage( alarms[2])
    expect(a.alarms.length).toEqual(2);
    expect(removed.length).toEqual(0);
    expect(a.alarms).toEqual( [alarms[2],alarms[0]]);

    removed = a.onMessage( alarms[1])
    expect(a.alarms.length).toEqual(3);
    expect(removed.length).toEqual(0);
    expect(a.alarms).toEqual( [alarms[2],alarms[1],alarms[0]]);

    removed = a.onMessage( alarms[5])
    expect(a.alarms.length).toEqual(3);
    expect(removed).toEqual([alarms[0]]);
    expect(a.alarms).toEqual( [alarms[5],alarms[2],alarms[1]]);

    // add then trim this message.
    removed = a.onMessage( alarms[0])
    expect(a.alarms.length).toEqual(3);
    expect(removed).toEqual([alarms[0]]);
    expect(a.alarms).toEqual( [alarms[5],alarms[2],alarms[1]]);

    removed = a.onMessage( alarms[4])
    expect(a.alarms.length).toEqual(3);
    expect(removed).toEqual([alarms[1]]);
    expect(a.alarms).toEqual( [alarms[5],alarms[4],alarms[2]]);


  }));

  it('should add alarm arrays sorted by reverse time and limit total alarms', inject( function () {
    var removed,
        a = new GBAlarms( 3)

    removed = a.onMessage( [alarms[0],alarms[2]])
    expect(a.alarms.length).toEqual(2);
    expect(removed.length).toEqual(0);
    expect(a.alarms).toEqual( [alarms[2],alarms[0]]);

    removed = a.onMessage( [alarms[1]])
    expect(a.alarms.length).toEqual(3);
    expect(removed.length).toEqual(0);
    expect(a.alarms).toEqual( [alarms[2],alarms[1],alarms[0]]);

    removed = a.onMessage( [alarms[6],alarms[4]])
    expect(a.alarms.length).toEqual(3);
    expect(removed).toEqual([alarms[1],alarms[0]]);
    expect(a.alarms).toEqual( [alarms[6],alarms[4],alarms[2]]);

    // add then trim this message.
    removed = a.onMessage( [alarms[0]])
    expect(a.alarms.length).toEqual(3);
    expect(removed).toEqual([alarms[0]]);
    expect(a.alarms).toEqual( [alarms[6],alarms[4],alarms[2]]);

    removed = a.onMessage( [alarms[5]])
    expect(a.alarms.length).toEqual(3);
    expect(removed).toEqual([alarms[2]]);
    expect(a.alarms).toEqual( [alarms[6],alarms[5],alarms[4]]);

    removed = a.onMessage( [])
    expect(a.alarms.length).toEqual(3);
    expect(removed.length).toEqual(0);
    expect(a.alarms).toEqual( [alarms[6],alarms[5],alarms[4]]);
  }));

  it('should update alarm and resort by reverse time', inject( function () {
    var removed,
        a = new GBAlarms( 3),
        a1 = {id: 'a', time: 11, state: 'UNACK_AUDIBLE'},
        a2 = {id: 'a', time: 12, state: 'UNACK_SILENT'},
        a3 = {id: 'a', time: 53, state: 'ACKNOWLEDGED'},
        a4 = {id: 'a', time: 54, state: 'REMOVED'}

    removed = a.onMessage( [alarms[0],alarms[1],alarms[5]])
    expect(a.alarms.length).toEqual(3);
    expect(removed.length).toEqual(0);


    removed = a.onMessage( [a1])
    expect(a.alarms.length).toEqual(3);
    expect(removed.length).toEqual(1);
    expect(a.alarms).toEqual( [alarms[5],a1,alarms[1]]);

    removed = a.onMessage( [a2])
    expect(a.alarms.length).toEqual(3);
    expect(removed.length).toEqual(0);
    expect(a.alarms).toEqual( [alarms[5],a2,alarms[1]]);

    removed = a.onMessage( [a3])
    expect(a.alarms.length).toEqual(3);
    expect(removed.length).toEqual(0);
    expect(a.alarms).toEqual( [a3,alarms[5],alarms[1]]);

    removed = a.onMessage( [a4])
    expect(a.alarms.length).toEqual(2);
    expect(removed.length).toEqual(1);
    expect(removed).toEqual( [a4]);
    expect(a.alarms).toEqual( [alarms[5],alarms[1]]);

  }));

});
