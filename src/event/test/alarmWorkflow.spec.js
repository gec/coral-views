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


  function makeAlarm( index) {
    return {
      id: 'id'+index,
      state: 'UNACK_AUDIBLE',
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
  }

  function copyAlarmWithState( alarm, newState) {
    var a = angular.extend( {}, alarm)
    a.state = newState
    return a
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
    expect( a0.updateState).toBe( 'updating')
    alarmRestMock.thenSuccess( copyAlarmWithState( a0, 'UNACK_SILENT'))
    expect( a0.state).toBe( 'UNACK_SILENT')
    expect( a0.updateState).toBe( 'none')

    alarmRestMock.reset()
    requestSucceeded = alarmWorkflow.acknowledge( gbAlarms, a0)
    expect( requestSucceeded).toBeTruthy()
    expect( alarmRestMock.callsCount).toBe( 1)
    expect( alarmRestMock.ids).toEqual( [a0.id])
    expect( alarmRestMock.newState).toEqual( 'ACKNOWLEDGED')
    expect( a0.updateState).toBe( 'updating')
    alarmRestMock.thenSuccess( copyAlarmWithState( a0, 'ACKNOWLEDGED'))
    expect( a0.state).toBe( 'ACKNOWLEDGED')
    expect( a0.updateState).toBe( 'none')

    alarmRestMock.reset()
    requestSucceeded = alarmWorkflow.remove( gbAlarms, a0)
    expect( requestSucceeded).toBeTruthy()
    expect( alarmRestMock.callsCount).toBe( 1)
    expect( alarmRestMock.ids).toEqual( [a0.id])
    expect( alarmRestMock.newState).toEqual( 'REMOVED')
    expect( a0.updateState).toBe( 'removing')
    alarmRestMock.thenSuccess( copyAlarmWithState( a0, 'REMOVED'))
    expect( a0.state).toBe( 'REMOVED')
    expect( alarms.indexOf( a0)).toBe( -1)
    expect( a0.updateState).toBe( 'none')

  }));

  it('should acknowledge UNACK_AUDIBLE alarm (skip UNACK_SILENT)', inject( function (alarmWorkflow) {
    var requestSucceeded,
        a0 = alarms[0]

    requestSucceeded = alarmWorkflow.acknowledge( gbAlarms, a0)
    expect( requestSucceeded).toBeTruthy()
    expect( alarmRestMock.callsCount).toBe( 1)
    expect( alarmRestMock.ids).toEqual( [a0.id])
    expect( alarmRestMock.newState).toEqual( 'ACKNOWLEDGED')
    expect( a0.updateState).toBe( 'updating')
    alarmRestMock.thenSuccess( copyAlarmWithState( a0, 'ACKNOWLEDGED'))
    expect( a0.state).toBe( 'ACKNOWLEDGED')
    expect( a0.updateState).toBe( 'none')

  }));

  it('should not update or make rest request when alarm is in the wrong state', inject( function (alarmWorkflow) {
    var requestSucceeded,
        a0 = alarms[0]

    requestSucceeded = alarmWorkflow.remove( gbAlarms, a0)
    expect( requestSucceeded).toBeFalsy()
    expect( alarmRestMock.callsCount).toBe( 0)
    expect( a0.state).toBe( 'UNACK_AUDIBLE')
    expect( a0.updateState).toBeUndefined()

    requestSucceeded = alarmWorkflow.acknowledge( gbAlarms, a0)
    expect( requestSucceeded).toBeTruthy()
    alarmRestMock.thenSuccess( copyAlarmWithState( a0, 'ACKNOWLEDGED'))
    expect( a0.state).toBe( 'ACKNOWLEDGED')

    alarmRestMock.reset()
    requestSucceeded = alarmWorkflow.silence( gbAlarms, a0)
    expect( requestSucceeded).toBeFalsy()
    expect( alarmRestMock.callsCount).toBe( 0)
    expect( a0.state).toBe( 'ACKNOWLEDGED')
    expect( a0.updateState).toBe( 'none')

    alarmRestMock.reset()
    requestSucceeded = alarmWorkflow.acknowledge( gbAlarms, a0)
    expect( requestSucceeded).toBeFalsy()
    expect( alarmRestMock.callsCount).toBe( 0)
    expect( a0.state).toBe( 'ACKNOWLEDGED')
    expect( a0.updateState).toBe( 'none')

  }));

  it('should update selected alarms states. Should add then remove animation updateState', inject( function (alarmWorkflow) {
    var requestSucceeded,
        a0 = alarms[0],
        a1 = alarms[1],
        a2 = alarms[2]

    var acks = [
          copyAlarmWithState( a0, 'UNACK_SILENT'),
          copyAlarmWithState( a2, 'UNACK_SILENT')
        ],
        notification = jasmine.createSpy('notification')

    a0.checked = true
    a2.checked = true

    requestSucceeded = alarmWorkflow.silenceSelected( gbAlarms, notification)
    expect( requestSucceeded).toBeTruthy()
    expect( alarmRestMock.callsCount).toBe( 1)
    expect( alarmRestMock.ids).toEqual( [a0.id, a2.id])
    expect( alarmRestMock.newState).toEqual( 'UNACK_SILENT')
    expect( a0.updateState).toBe( 'updating')
    expect( a2.updateState).toBe( 'updating')
    alarmRestMock.thenSuccess( acks)
    expect( a0.state).toBe( 'UNACK_SILENT')
    expect( a1.state).toBe( 'UNACK_AUDIBLE')
    expect( a2.state).toBe( 'UNACK_SILENT')
    expect( a0.updateState).toBe( 'none')
    expect( a2.updateState).toBe( 'none')

    alarmRestMock.reset()
    requestSucceeded = alarmWorkflow.acknowledgeSelected( gbAlarms, notification)
    expect( requestSucceeded).toBeTruthy()
    expect( alarmRestMock.callsCount).toBe( 1)
    expect( alarmRestMock.ids).toEqual( [a2.id, a0.id])
    expect( alarmRestMock.newState).toEqual( 'ACKNOWLEDGED')
    expect( a0.updateState).toBe( 'updating')
    expect( a2.updateState).toBe( 'updating')
    acks = [
      copyAlarmWithState( a0, 'ACKNOWLEDGED'),
      copyAlarmWithState( a2, 'ACKNOWLEDGED')
    ]
    alarmRestMock.thenSuccess( acks)
    expect( a0.state).toBe( 'ACKNOWLEDGED')
    expect( a1.state).toBe( 'UNACK_AUDIBLE')
    expect( a2.state).toBe( 'ACKNOWLEDGED')
    expect( a0.updateState).toBe( 'none')
    expect( a2.updateState).toBe( 'none')

    alarmRestMock.reset()
    requestSucceeded = alarmWorkflow.removeSelected( gbAlarms, notification)
    expect( requestSucceeded).toBeTruthy()
    expect( alarmRestMock.callsCount).toBe( 1)
    expect( alarmRestMock.ids).toEqual( [a2.id, a0.id])
    expect( alarmRestMock.newState).toEqual( 'REMOVED')
    expect( a0.updateState).toBe( 'removing')
    expect( a2.updateState).toBe( 'removing')
    acks = [
      copyAlarmWithState( a0, 'REMOVED'),
      copyAlarmWithState( a2, 'REMOVED')
    ]
    alarmRestMock.thenSuccess( acks)
    expect( a0.state).toBe( 'REMOVED')
    expect( a1.state).toBe( 'UNACK_AUDIBLE')
    expect( a2.state).toBe( 'REMOVED')
    expect( a0.updateState).toBe( 'none')
    expect( a2.updateState).toBe( 'none')

  }));

  //it('should remove animations from alarms upon failure', inject( function () {
  //  subscribeInstance.onSuccess( subscribeInstance.id, 'alarm', alarms)
  //  parentScope.$digest();
  //
  //  var updates = alarms.map( function( a) { return copyAlarmWithState( a, 'ACKNOWLEDGED')})
  //  subscribeInstance.onSuccess( subscribeInstance.id, 'alarm', updates)
  //  parentScope.$digest();
  //
  //  var ids = [
  //        scope.alarms[0].id,
  //        scope.alarms[2].id
  //      ]
  //  scope.alarms[0].checked = true
  //  scope.alarms[2].checked = true
  //
  //  var response = {
  //    exception: 'BadRequestException',
  //    message: 'Could not do it for whatever reason'
  //  }
  //
  //  $httpBackend.when( 'POST', '/models/1/alarms', { state: 'REMOVED', ids: ids}).respond( 403, response)
  //  scope.removeSelected()
  //  $httpBackend.flush()
  //  expect( scope.alarms.length).toBe( 3)
  //  expect( scope.alarms[0].updateState).toBe('none')
  //  expect( scope.alarms[2].updateState).toBe('none')
  //}));
  //
  //it('should remove only selected alarms and show info message if some selected are not removable', inject( function ($timeout) {
  //  subscribeInstance.onSuccess( subscribeInstance.id, 'alarm', alarms)
  //  parentScope.$digest()
  //  var updates = [ copyAlarmWithState( scope.alarms[2], 'ACKNOWLEDGED') ]
  //  subscribeInstance.onSuccess( subscribeInstance.id, 'alarm', updates)
  //  parentScope.$digest();
  //
  //
  //  var removeds = [
  //        copyAlarmWithState( scope.alarms[2], 'REMOVED')
  //      ],ids = [
  //        scope.alarms[2].id
  //      ]
  //  scope.alarms[1].checked = true
  //  scope.alarms[2].checked = true
  //
  //  $httpBackend.when( 'POST', '/models/1/alarms', { state: 'REMOVED', ids: ids}).respond( removeds)
  //  scope.removeSelected()
  //  $httpBackend.flush()
  //  parentScope.$digest();
  //
  //  var alert = element.find('div.alert')
  //  expect( alert).not.toHaveClass('ng-hide')
  //  expect( findAlertText( alert)).toBe( ' Unacknowledged alarms were not removed.')
  //
  //  expect( scope.alarms.length).toBe( 2)
  //  expect( scope.alarms[0].updateState).toBe('none')
  //  expect( scope.alarms[1].updateState).toBe('none')
  //
  //  $timeout.flush()
  //  expect( scope.notification).toBeUndefined()
  //  expect( alert).toHaveClass('ng-hide')
  //
  //}));
  //
  //
  //it('should remove selected alarms', inject( function () {
  //  subscribeInstance.onSuccess( subscribeInstance.id, 'alarm', alarms)
  //  parentScope.$digest();
  //  var updates = alarms.map( function( a) { return copyAlarmWithState( a, 'ACKNOWLEDGED')})
  //  subscribeInstance.onSuccess( subscribeInstance.id, 'alarm', updates)
  //  parentScope.$digest();
  //
  //
  //  var removeds = [
  //        copyAlarmWithState( scope.alarms[0], 'REMOVED'),
  //        copyAlarmWithState( scope.alarms[2], 'REMOVED')
  //      ],
  //      ids = [
  //        scope.alarms[0].id,
  //        scope.alarms[2].id
  //      ],
  //      notRemovedId = scope.alarms[1].id
  //  scope.alarms[0].checked = true
  //  scope.alarms[2].checked = true
  //
  //  $httpBackend.when( 'POST', '/models/1/alarms', { state: 'REMOVED', ids: ids}).respond( removeds)
  //  scope.removeSelected()
  //  $httpBackend.flush()
  //  expect( scope.alarms.length).toBe( 1)
  //  expect( scope.alarms[0].id).toBe( notRemovedId)
  //  expect( scope.alarms[0].state).toBe( 'ACKNOWLEDGED')
  //
  //}));

});
