describe('alarmWorkflow', function () {
  var gbAlarms,
      alarmCount = 3,
      alarms = []


  var alarmRestMock = {
    callsCount: 0,
    ids: undefined,
    newState: undefined,
    callee: undefined,
    success: undefined,
    failure: undefined,
    update: function( ids, newState, callee, success, failure) {
      alarmRestMock.callsCount ++
      alarmRestMock.ids = ids
      alarmRestMock.newState = newState
      alarmRestMock.callee = callee
      alarmRestMock.success = success
      alarmRestMock.failure = failure
      return !( ! ids || ids.length === 0)
    },
    thenSuccess: function( data) {
      alarmRestMock.success.call( alarmRestMock.callee, data)
    },
    thenFailure: function( ex, statusCode) {
      alarmRestMock.failure.call( alarmRestMock.callee, alarmRestMock.ids, alarmRestMock.newState, ex, statusCode)
    },
    reset: function() {
      alarmRestMock.callsCount = 0
      alarmRestMock.ids = undefined
      alarmRestMock.newState = undefined
      alarmRestMock.callee = undefined
      alarmRestMock.success = undefined
      alarmRestMock.failure = undefined
    }
  }

  //alarmWorkflow = {
  //  silence:             function(_gbAlarms, _alarm) {
  //  },
  //  acknowledge:         function(_gbAlarms, _alarm) {
  //  },
  //  remove:              function(_gbAlarms, _alarm) {
  //  },
  //  silenceSelected:     function(_gbAlarms, _notification) {
  //  },
  //  acknowledgeSelected: function(_gbAlarms, _notification) {
  //  }
  //}


  function makeAlarm( index, state, checked, updateState) {
    if( state === undefined)
      state = 'UNACK_AUDIBLE'
    var alarm = {
      id: 'id'+index,
      state: state,
      eventId: 'id'+index,
      deviceTime: index,
      eventType: 'eventType'+index,
      alarm: true,
      severity: index,
      agent: 'agent'+index,
      entity: 'entitId'+index,
      message: 'message'+index,
      time: index
    }

    if( checked !== undefined)
      alarm._checked = checked
    if( updateState !== undefined)
      alarm._updateState = updateState

    return alarm
  }

  function copyAlarmWithState( alarm, newState) {
    var key,
        newAlarm = {}

    for( key in alarm) {
      if( key !== 'state' && key !== '_checked' && key !== '_updateState')
        newAlarm[key] = alarm[key]
    }
    newAlarm.state = newState
    return newAlarm
  }

  beforeEach(module('greenbus.views.event'));

  beforeEach(function () {

    alarmRestMock.reset()
    module( function ($provide) {
      $provide.value('alarmRest', alarmRestMock);
    });

    alarms = []
    for( var index = 0; index < alarmCount; index++) {
      var alarm = makeAlarm( index)
      alarms.push( alarm)
    }
    gbAlarms = new GBAlarms( alarmCount, alarms)

  });

  it('should step UNACK_AUDIBLE alarm through each state to REMOVED. Should add then remove animation updateState.', inject( function (alarmWorkflow) {
    var requestSucceeded,
        a0 = alarms[0]

    requestSucceeded = alarmWorkflow.silence( gbAlarms, a0)
    expect( requestSucceeded).toBeTruthy()
    expect( alarmRestMock.callsCount).toBe( 1)
    expect( alarmRestMock.ids).toEqual( [a0.id])
    expect( alarmRestMock.newState).toEqual( 'UNACK_SILENT')
    expect( a0._updateState).toBe( 'updating')
    alarmRestMock.thenSuccess( copyAlarmWithState( a0, 'UNACK_SILENT'))
    expect( a0.state).toBe( 'UNACK_SILENT')
    expect( a0._updateState).toBe( 'none')

    alarmRestMock.reset()
    requestSucceeded = alarmWorkflow.acknowledge( gbAlarms, a0)
    expect( requestSucceeded).toBeTruthy()
    expect( alarmRestMock.callsCount).toBe( 1)
    expect( alarmRestMock.ids).toEqual( [a0.id])
    expect( alarmRestMock.newState).toEqual( 'ACKNOWLEDGED')
    expect( a0._updateState).toBe( 'updating')
    alarmRestMock.thenSuccess( copyAlarmWithState( a0, 'ACKNOWLEDGED'))
    expect( a0.state).toBe( 'ACKNOWLEDGED')
    expect( a0._updateState).toBe( 'none')

    alarmRestMock.reset()
    requestSucceeded = alarmWorkflow.remove( gbAlarms, a0)
    expect( requestSucceeded).toBeTruthy()
    expect( alarmRestMock.callsCount).toBe( 1)
    expect( alarmRestMock.ids).toEqual( [a0.id])
    expect( alarmRestMock.newState).toEqual( 'REMOVED')
    expect( a0._updateState).toBe( 'removing')
    alarmRestMock.thenSuccess( copyAlarmWithState( a0, 'REMOVED'))
    expect( a0.state).toBe( 'REMOVED')
    expect( alarms.indexOf( a0)).toBe( -1)
    expect( a0._updateState).toBe( 'none')

  }));

  it('should acknowledge UNACK_AUDIBLE alarm (skip UNACK_SILENT)', inject( function (alarmWorkflow) {
    var requestSucceeded,
        a0 = alarms[0]

    requestSucceeded = alarmWorkflow.acknowledge( gbAlarms, a0)
    expect( requestSucceeded).toBeTruthy()
    expect( alarmRestMock.callsCount).toBe( 1)
    expect( alarmRestMock.ids).toEqual( [a0.id])
    expect( alarmRestMock.newState).toEqual( 'ACKNOWLEDGED')
    expect( a0._updateState).toBe( 'updating')
    alarmRestMock.thenSuccess( copyAlarmWithState( a0, 'ACKNOWLEDGED'))
    expect( a0.state).toBe( 'ACKNOWLEDGED')
    expect( a0._updateState).toBe( 'none')

  }));

  it('should not update or make rest request when alarm is in the wrong state', inject( function (alarmWorkflow) {
    var requestSucceeded,
        a0 = alarms[0]

    requestSucceeded = alarmWorkflow.remove( gbAlarms, a0)
    expect( requestSucceeded).toBeFalsy()
    expect( alarmRestMock.callsCount).toBe( 0)
    expect( a0.state).toBe( 'UNACK_AUDIBLE')
    expect( a0._updateState).toBeUndefined()

    requestSucceeded = alarmWorkflow.acknowledge( gbAlarms, a0)
    expect( requestSucceeded).toBeTruthy()
    alarmRestMock.thenSuccess( copyAlarmWithState( a0, 'ACKNOWLEDGED'))
    expect( a0.state).toBe( 'ACKNOWLEDGED')

    alarmRestMock.reset()
    requestSucceeded = alarmWorkflow.silence( gbAlarms, a0)
    expect( requestSucceeded).toBeFalsy()
    expect( alarmRestMock.callsCount).toBe( 0)
    expect( a0.state).toBe( 'ACKNOWLEDGED')
    expect( a0._updateState).toBe( 'none')

    alarmRestMock.reset()
    requestSucceeded = alarmWorkflow.acknowledge( gbAlarms, a0)
    expect( requestSucceeded).toBeFalsy()
    expect( alarmRestMock.callsCount).toBe( 0)
    expect( a0.state).toBe( 'ACKNOWLEDGED')
    expect( a0._updateState).toBe( 'none')

  }));

  it('should update selected alarms states. Should add then remove animation updateState', inject( function (alarmWorkflow) {
    var requestSucceeded,
        a0 = alarms[0],
        a1 = alarms[1],
        a2 = alarms[2]

    var reply = [
          copyAlarmWithState( a0, 'UNACK_SILENT'),
          copyAlarmWithState( a2, 'UNACK_SILENT')
        ],
        notification = jasmine.createSpy('notification')

    a0._checked = 1
    a2._checked = 1

    requestSucceeded = alarmWorkflow.silenceSelected( gbAlarms, notification)
    expect( requestSucceeded).toBeTruthy()
    expect( notification).not.toHaveBeenCalled()
    expect( alarmRestMock.callsCount).toBe( 1)
    expect( alarmRestMock.ids).toEqual( [a0.id, a2.id])
    expect( alarmRestMock.newState).toEqual( 'UNACK_SILENT')
    expect( a0._updateState).toBe( 'updating')
    expect( a2._updateState).toBe( 'updating')
    alarmRestMock.thenSuccess( reply)
    expect( a0.state).toBe( 'UNACK_SILENT')
    expect( a1.state).toBe( 'UNACK_AUDIBLE')
    expect( a2.state).toBe( 'UNACK_SILENT')
    expect( a0._updateState).toBe( 'none')
    expect( a2._updateState).toBe( 'none')

    alarmRestMock.reset()
    requestSucceeded = alarmWorkflow.acknowledgeSelected( gbAlarms, notification)
    expect( notification).not.toHaveBeenCalled()
    expect( requestSucceeded).toBeTruthy()
    expect( alarmRestMock.callsCount).toBe( 1)
    expect( alarmRestMock.ids).toEqual( [a2.id, a0.id])
    expect( alarmRestMock.newState).toEqual( 'ACKNOWLEDGED')
    expect( a0._updateState).toBe( 'updating')
    expect( a2._updateState).toBe( 'updating')
    reply = [
      copyAlarmWithState( a0, 'ACKNOWLEDGED'),
      copyAlarmWithState( a2, 'ACKNOWLEDGED')
    ]
    alarmRestMock.thenSuccess( reply)
    expect( a0.state).toBe( 'ACKNOWLEDGED')
    expect( a1.state).toBe( 'UNACK_AUDIBLE')
    expect( a2.state).toBe( 'ACKNOWLEDGED')
    expect( a0._updateState).toBe( 'none')
    expect( a2._updateState).toBe( 'none')

    alarmRestMock.reset()
    requestSucceeded = alarmWorkflow.removeSelected( gbAlarms, notification)
    expect( notification).not.toHaveBeenCalled()
    expect( requestSucceeded).toBeTruthy()
    expect( alarmRestMock.callsCount).toBe( 1)
    expect( alarmRestMock.ids).toEqual( [a2.id, a0.id])
    expect( alarmRestMock.newState).toEqual( 'REMOVED')
    expect( a0._updateState).toBe( 'removing')
    expect( a2._updateState).toBe( 'removing')
    reply = [
      copyAlarmWithState( a0, 'REMOVED'),
      copyAlarmWithState( a2, 'REMOVED')
    ]
    alarmRestMock.thenSuccess( reply)
    expect( a0.state).toBe( 'REMOVED')
    expect( a1.state).toBe( 'UNACK_AUDIBLE')
    expect( a2.state).toBe( 'REMOVED')
    expect( a0._updateState).toBe( 'none')
    expect( a2._updateState).toBe( 'none')

  }));

  describe('actions on selections', function () {

    beforeEach(function () {

      // All states, both not updating and updating.
      alarms = [
        makeAlarm(0, 'UNACK_AUDIBLE', 1), // 1: checked
        makeAlarm(1, 'UNACK_SILENT', 1),
        makeAlarm(2, 'ACKNOWLEDGED', 1),
        makeAlarm(3, 'REMOVED', 1),
        makeAlarm(4, 'UNACK_AUDIBLE', 1, 'updating'), // 1: checked, _updateState
        makeAlarm(5, 'UNACK_SILENT', 1, 'updating'),
        makeAlarm(6, 'ACKNOWLEDGED', 1, 'removing')
      ]
      gbAlarms = new GBAlarms(10, alarms)
    })


    it('silenceSelected should only update UNACK_AUDIBLE and no notify because some are selected.', inject( function (alarmWorkflow) {
      var requestSucceeded, targetIds, reply,
          notification = jasmine.createSpy('notification')

      targetIds = [alarms[0].id]
      reply = [ copyAlarmWithState( alarms[0], 'UNACK_SILENT')]
      reply[0].time = 100 // on update, this will sort back to index 0

      requestSucceeded = alarmWorkflow.silenceSelected( gbAlarms, notification)
      expect( notification).not.toHaveBeenCalled()
      expect( requestSucceeded).toBeTruthy()
      expect( alarmRestMock.callsCount).toBe( 1)
      expect( alarmRestMock.ids).toEqual( targetIds)
      expect( alarmRestMock.newState).toEqual( 'UNACK_SILENT')
      expect( alarms[0]._updateState).toBe( 'updating')
      expect( alarms[1]._updateState).toBeUndefined()
      alarmRestMock.thenSuccess( reply)
      expect( alarms[0].state).toBe( 'UNACK_SILENT')
      expect( alarms[0]._updateState).toBe( 'none')

    }));

    it('silenceSelected detects no UNACK_AUDIBLE selected and calls notify and not request.', inject( function (alarmWorkflow) {
      var requestSucceeded,
          notification = jasmine.createSpy('notification')

      // Uncheck alarms that can be silenced
      alarms[0]._checked = 0
      requestSucceeded = alarmWorkflow.silenceSelected( gbAlarms, notification)
      expect( notification).toHaveBeenCalledWith( 'info', 'No audible alarms are selected.', 5000)
      expect( requestSucceeded).toBeFalsy()
      expect( alarmRestMock.callsCount).toBe( 0)
      expect( alarms[0]._updateState).toBeUndefined()

    }));


    it('acknowledgeSelected should only update UNACK_AUDIBLE, UNACK_SILENT and no notify because some are selected.', inject( function (alarmWorkflow) {
      var requestSucceeded, targetIds, reply,
          notification = jasmine.createSpy('notification')

      targetIds = [alarms[0].id, alarms[1].id]
      reply = [
        copyAlarmWithState( alarms[0], 'ACKNOWLEDGED'),
        copyAlarmWithState( alarms[1], 'ACKNOWLEDGED')
      ]
      reply[0].time = 100  // on update, this will sort back to index 0
      reply[1].time = 101

      requestSucceeded = alarmWorkflow.acknowledgeSelected( gbAlarms, notification)
      expect( notification).not.toHaveBeenCalled()
      expect( requestSucceeded).toBeTruthy()
      expect( alarmRestMock.callsCount).toBe( 1)
      expect( alarmRestMock.ids).toEqual( targetIds)
      expect( alarmRestMock.newState).toEqual( 'ACKNOWLEDGED')
      expect( alarms[0]._updateState).toBe( 'updating')
      expect( alarms[1]._updateState).toBe( 'updating')
      alarmRestMock.thenSuccess( reply)
      expect( alarms[0].state).toBe( 'ACKNOWLEDGED')
      expect( alarms[1].state).toBe( 'ACKNOWLEDGED')
      expect( alarms[0]._updateState).toBe( 'none')
      expect( alarms[1]._updateState).toBe( 'none')

    }));

    it('acknowledgeSelected detects no UNACK_AUDIBLE, UNACK_SILENT selected and calls notify and not request.', inject( function (alarmWorkflow) {
      var requestSucceeded,
          notification = jasmine.createSpy('notification')

      // Uncheck alarms that can be acknowledged
      alarms[0]._checked = 0
      alarms[1]._checked = 0
      requestSucceeded = alarmWorkflow.acknowledgeSelected( gbAlarms, notification)
      expect( notification).toHaveBeenCalledWith( 'info', 'No unacknowledged alarms are selected.', 5000)
      expect( requestSucceeded).toBeFalsy()
      expect( alarmRestMock.callsCount).toBe( 0)
      expect( alarms[0]._updateState).toBeUndefined()
      expect( alarms[1]._updateState).toBeUndefined()

    }));


    it('removeSelected should only update ACKNOWLEDGED and notify because some selected are not removable.', inject( function (alarmWorkflow) {
      var requestSucceeded, targetIds, reply, alarmToBeRemoved, finalAlarmCount
          notification = jasmine.createSpy('notification')

      alarmToBeRemoved = alarms[2]
      finalAlarmCount = alarms.length - 1
      targetIds = [alarms[2].id]
      reply = [copyAlarmWithState( alarms[2], 'REMOVED')]
      reply[0].time = 100  // on update, this will sort to index 0

      requestSucceeded = alarmWorkflow.removeSelected( gbAlarms, notification)
      expect( notification).toHaveBeenCalledWith('info', 'Unacknowledged alarms were not removed.', 5000)
      expect( requestSucceeded).toBeTruthy()
      expect( alarmRestMock.callsCount).toBe( 1)
      expect( alarmRestMock.ids).toEqual( targetIds)
      expect( alarmRestMock.newState).toEqual( 'REMOVED')
      expect( alarms[2]._updateState).toBe( 'removing')
      alarmRestMock.thenSuccess( reply)
      expect( alarmToBeRemoved.state).toBe( 'REMOVED')
      expect( alarmToBeRemoved._updateState).toBe( 'none')
      expect( alarms.indexOf( alarmToBeRemoved)).toBe( -1)
      expect( alarms.length).toBe( finalAlarmCount)
    }));

    it('removeSelected detects no ACKNOWLEDGED selected and calls notify and not request.', inject( function (alarmWorkflow) {
      var requestSucceeded,
          notification = jasmine.createSpy('notification')

      // Uncheck alarms that can be removed
      alarms[2]._checked = 0
      requestSucceeded = alarmWorkflow.removeSelected( gbAlarms, notification)
      expect( notification).toHaveBeenCalledWith( 'info', 'No acknowledged alarms are selected.', 5000)
      expect( requestSucceeded).toBeFalsy()
      expect( alarmRestMock.callsCount).toBe( 0)
      expect( alarms[3]._updateState).toBeUndefined()

    }));

  })


});
