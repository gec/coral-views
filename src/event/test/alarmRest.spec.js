describe('alarmRest', function () {
  var parentScope, scope, $httpBackend, replyMock,
      alarmCount = 3,
      alarms = []


  var authToken = 'some auth token'
  var authenticationMock =   {
      isLoggedIn:   function() {
        return true
      },
      getAuthToken: function() {
        return authToken
      },
      getHttpHeaders: function() {
        return {'Authorization': authToken}
      }
    }


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

  beforeEach(module('greenbus.views.authentication'));
  beforeEach(module('greenbus.views.rest'));
  beforeEach(module('greenbus.views.event'));

  beforeEach(function () {
    module( function ($provide) {
      $provide.value('authentication', authenticationMock)
    });

    alarms = []
    for( var index = 0; index < alarmCount; index++) {
      var alarm = makeAlarm( index)
      alarms.push( alarm)
    }
    replyMock = jasmine.createSpyObj('replyMock', ['success', 'failure'])

  });

  beforeEach( inject(function( $injector) {
    $httpBackend = $injector.get('$httpBackend')
  }))


  afterEach( function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });


  it('should send an http POST request to update alarm state and successful reply', inject( function ( alarmRest) {

    // Remember our own alarms[2] declared above is now scope.alarms[0] because of time sorting
    var alarm = alarms[0],
        alarmUnackSilent = copyAlarmWithState( alarm, 'UNACK_SILENT'),
        alarmAck = copyAlarmWithState( alarm, 'ACKNOWLEDGED')

    $httpBackend.when( 'POST', '/models/1/alarms', { state: 'ACKNOWLEDGED', ids: [alarm.id]}).respond( [alarmAck])
    alarmRest.update( [alarm.id], 'ACKNOWLEDGED', replyMock, replyMock.success, replyMock.failure)
    $httpBackend.flush()
    expect( replyMock.success).toHaveBeenCalledWith( [alarmAck])
    expect( replyMock.failure).not.toHaveBeenCalled()

  }));

  it('should notify caller of failure', inject( function ( alarmRest) {

    // Remember our own alarms[2] declared above is now scope.alarms[0] because of time sorting
    var alarm = alarms[0],
        alarmUnackSilent = copyAlarmWithState( alarm, 'UNACK_SILENT'),
        alarmAck = copyAlarmWithState( alarm, 'ACKNOWLEDGED')

    $httpBackend.when( 'POST', '/models/1/alarms', { state: 'ACKNOWLEDGED', ids: [alarm.id]}).respond( 403, {})
    alarmRest.update( [alarm.id], 'ACKNOWLEDGED', replyMock, replyMock.success, replyMock.failure)
    $httpBackend.flush()
    expect( replyMock.failure).toHaveBeenCalledWith( [alarm.id], 'ACKNOWLEDGED', {}, 403)
    expect( replyMock.success).not.toHaveBeenCalled()

  }));


});
