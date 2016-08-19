describe('gb-alarms', function () {
  var parentScope, scope, $compile, _subscription, $httpBackend,
      subscribeInstance = {};
  var element,
      alarmCount = 3,
      alarms = [];


  function makeSubscriptionId( request, idCounter) {
    return 'subscription.' + request.name + '.' + idCounter;
  }

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
  beforeEach(module('greenbus.views.subscription'));
  beforeEach(module('greenbus.views.selection'));
  beforeEach(module('greenbus.views.pager'));
  beforeEach(module('greenbus.views.template/pager/pager.html'));
  beforeEach(module('greenbus.views.event'));
  beforeEach(module('greenbus.views.template/event/alarms.html'));
  beforeEach(module('greenbus.views.template/selection/selectAll.html'));

  beforeEach(function () {
    subscribeInstance = {}
    _subscription = {
      subscribe: function (request, subscriberScope, onSuccess, onError) {
        subscribeInstance = {
          id: makeSubscriptionId( request, 1),
          request: request,
          scope: subscriberScope,
          onSuccess: onSuccess,
          onError: onError
        }

        return subscribeInstance.id;
      }
    };

    _websocketFactory = {}
    module( function ($provide) {
      $provide.value('websocketFactory', _websocketFactory);
      $provide.value('authentication', authenticationMock);
      $provide.value('subscription', _subscription);
    });

    alarms = []
    for( var index = 0; index < alarmCount; index++) {
      var alarm = makeAlarm( index)
      alarms.push( alarm)
    }

  });

  beforeEach( inject(function( $injector) {
    $httpBackend = $injector.get('$httpBackend')
  }))


  beforeEach(inject(function ($rootScope, _$compile_) {

    parentScope = $rootScope.$new();
    $compile = _$compile_;

    element = angular.element( '<gb-alarms limit="4"></gb-alarms>');
    $compile(element)(parentScope);
    scope = element.isolateScope() || element.scope()
    parentScope.$digest();
  }));

  afterEach( function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  function findAlarms() {
    return element.find('.gb-alarm');
  }

  function findTd( event, tdIndex) {
    return event.find('td').eq(tdIndex);
  }

  function findAlertText( alert) {
//    return alert[0].children[1].children[0].textContent
    return alert[0].children[0].textContent
  }

  it('should create multiple sorted alarms', inject( function () {
    subscribeInstance.onSuccess( subscribeInstance.id, 'alarm', alarms)
    parentScope.$digest();
    var foundAlarms = findAlarms()
    expect( foundAlarms.length).toEqual(3);

    expect( scope.alarms[0]).toBe( alarms[2])
    expect( scope.alarms[1]).toBe( alarms[1])
    expect( scope.alarms[2]).toBe( alarms[0])
  }));

  it('should handle subscribe messages that are updates (single alarm)', inject( function () {
    subscribeInstance.onSuccess( subscribeInstance.id, 'alarm', alarms[0])
    parentScope.$digest();
    subscribeInstance.onSuccess( subscribeInstance.id, 'alarm', angular.extend( {}, alarms[0]))
    parentScope.$digest();
    var foundAlarms = findAlarms()
    expect( foundAlarms.length).toEqual(1);
  }));

  it('should handle subscribe messages that are updates (array of alarms)', inject( function () {
    subscribeInstance.onSuccess( subscribeInstance.id, 'alarm', alarms)
    parentScope.$digest();

    var updates = alarms.map( function( a) { return copyAlarmWithState( a, 'UNACK_SILENT')})
    subscribeInstance.onSuccess( subscribeInstance.id, 'alarm', updates)
    parentScope.$digest();
    var foundAlarms = findAlarms()
    expect( foundAlarms.length).toEqual(3);
  }));

  it('should update single alarm state', inject( function () {
    subscribeInstance.onSuccess( subscribeInstance.id, 'alarm', alarms)
    parentScope.$digest();

    // Remember our own alarms[2] declared above is now scope.alarms[0] because of time sorting
    var alarm = scope.alarms[0],
        alarmUnackSilent = copyAlarmWithState( alarm, 'UNACK_SILENT'),
        alarmAck = copyAlarmWithState( alarm, 'ACKNOWLEDGED')

    $httpBackend.when( 'POST', '/models/1/alarms', { state: 'UNACK_SILENT', ids: [alarm.id]}).respond( [alarmUnackSilent])
    scope.silence( alarm)
    $httpBackend.flush()
    expect( scope.alarms[0].state).toBe( 'UNACK_SILENT')

    $httpBackend.when( 'POST', '/models/1/alarms', { state: 'ACKNOWLEDGED', ids: [alarm.id]}).respond( [alarmAck])
    scope.acknowledge( alarm)
    $httpBackend.flush()
    expect( scope.alarms[0].state).toBe( 'ACKNOWLEDGED')

    alarm = scope.alarms[1]
    alarmAck = copyAlarmWithState( alarm, 'ACKNOWLEDGED')

    $httpBackend.when( 'POST', '/models/1/alarms', { state: 'ACKNOWLEDGED', ids: [alarm.id]}).respond( [alarmAck])
    scope.acknowledge( alarm)
    $httpBackend.flush()
    expect( scope.alarms[1].state).toBe( 'ACKNOWLEDGED')

  }));

  it('should update selected alarms states', inject( function () {
    subscribeInstance.onSuccess( subscribeInstance.id, 'alarm', alarms)
    parentScope.$digest();

    var acks = [
          copyAlarmWithState( scope.alarms[0], 'ACKNOWLEDGED'),
          copyAlarmWithState( scope.alarms[2], 'ACKNOWLEDGED')
        ],
        ids = [
          scope.alarms[0].id,
          scope.alarms[2].id
        ]
    scope.alarms[0]._checked = 1
    scope.alarms[2]._checked = 1

    $httpBackend.when( 'POST', '/models/1/alarms', { state: 'ACKNOWLEDGED', ids: ids}).respond( acks)
    scope.acknowledgeSelected()
    $httpBackend.flush()
    expect( scope.alarms[0].state).toBe( 'ACKNOWLEDGED')
    expect( scope.alarms[1].state).toBe( 'UNACK_AUDIBLE')
    expect( scope.alarms[2].state).toBe( 'ACKNOWLEDGED')

  }));

  it('should remove animations from alarms upon failure', inject( function () {
    subscribeInstance.onSuccess( subscribeInstance.id, 'alarm', alarms)
    parentScope.$digest();

    var updates = alarms.map( function( a) { return copyAlarmWithState( a, 'ACKNOWLEDGED')})
    subscribeInstance.onSuccess( subscribeInstance.id, 'alarm', updates)
    parentScope.$digest();

    var ids = [
      scope.alarms[0].id,
      scope.alarms[2].id
    ]
    scope.alarms[0]._checked = 1
    scope.alarms[2]._checked = 1

    var response = {
      exception: 'BadRequestException',
      message: 'Could not do it for whatever reason'
    }

    $httpBackend.when( 'POST', '/models/1/alarms', { state: 'REMOVED', ids: ids}).respond( 403, response)
    scope.removeSelected()
    $httpBackend.flush()
    expect( scope.alarms.length).toBe( 3)
    expect( scope.alarms[0]._updateState).toBe('none')
    expect( scope.alarms[2]._updateState).toBe('none')
  }));

  it('should NOT remove selected alarms if none are acknowledged. Should not send post remove', inject( function ($timeout) {
    subscribeInstance.onSuccess( subscribeInstance.id, 'alarm', alarms)
    parentScope.$digest();

    var ids = [
      scope.alarms[0].id,
      scope.alarms[2].id
    ]
    scope.alarms[0]._checked = 1
    scope.alarms[2]._checked = 1

    scope.removeSelected()
    parentScope.$digest();

    var alert = angular.element( element.find('div.alert')[0])
    expect( alert).not.toHaveClass('ng-hide')

    expect( scope.alarms.length).toBe( 3)
    expect( scope.alarms[0]._updateState).toBeUndefined()
    expect( scope.alarms[2]._updateState).toBeUndefined()

    $timeout.flush()
    expect( scope.notification).toBeUndefined()
    expect( alert).toHaveClass('ng-hide')

  }));

  it('should remove only selected alarms and show info message if some selected are not removable', inject( function ($timeout) {
    subscribeInstance.onSuccess( subscribeInstance.id, 'alarm', alarms)
    parentScope.$digest()
    var updates = [ copyAlarmWithState( scope.alarms[2], 'ACKNOWLEDGED') ]
    subscribeInstance.onSuccess( subscribeInstance.id, 'alarm', updates)
    parentScope.$digest();


    var removeds = [
      copyAlarmWithState( scope.alarms[2], 'REMOVED')
    ],ids = [
      scope.alarms[2].id
    ]
    scope.alarms[1]._checked = 1
    scope.alarms[2]._checked = 1

    $httpBackend.when( 'POST', '/models/1/alarms', { state: 'REMOVED', ids: ids}).respond( removeds)
    scope.removeSelected()
    $httpBackend.flush()
    parentScope.$digest();

    var alert = angular.element( element.find('div.alert')[0])
    expect( alert).not.toHaveClass('ng-hide')
    expect( findAlertText( alert)).toBe( ' Unacknowledged alarms were not removed.')

    expect( scope.alarms.length).toBe( 2)
    expect( scope.alarms[0]._updateState).toBeUndefined()
    expect( scope.alarms[1]._updateState).toBeUndefined()

    $timeout.flush()
    expect( scope.notification).toBeUndefined()
    expect( alert).toHaveClass('ng-hide')

  }));

  // One unack alarm. Tried to remove it. Got failure.
  // Request: {"state":"REMOVED","ids":["20"]}
  // Response: {"exception":"BadRequestException","message":"Invalid transition between alarm states UNACK_AUDIBLE -> REMOVED"}
  // Bells remained spinning

  // Two alarms. One unack, one ack.
  // Request: {"state":"REMOVED","ids":["21","20"]}
  // Response: {"exception":"BadRequestException","message":"Invalid transition between alarm states UNACK_AUDIBLE -> REMOVED"}
  // Bells remained spinning
  // Refresh: both alarms remain.

  // 403, {"exception":"BadRequestException","message":"No alarm exists for id 1234567890"}
  // Bells remained spinning

  // Some good, some bad: {"exception":"BadRequestException","message":"No alarm exists for id 1234567890"}

  it('should remove selected alarms', inject( function () {
    subscribeInstance.onSuccess( subscribeInstance.id, 'alarm', alarms)
    parentScope.$digest();
    var updates = alarms.map( function( a) { return copyAlarmWithState( a, 'ACKNOWLEDGED')})
    subscribeInstance.onSuccess( subscribeInstance.id, 'alarm', updates)
    parentScope.$digest();


    var removeds = [
          copyAlarmWithState( scope.alarms[0], 'REMOVED'),
          copyAlarmWithState( scope.alarms[2], 'REMOVED')
        ],
        ids = [
          scope.alarms[0].id,
          scope.alarms[2].id
        ],
        notRemovedId = scope.alarms[1].id
    scope.alarms[0]._checked = 1
    scope.alarms[2]._checked = 1

    $httpBackend.when( 'POST', '/models/1/alarms', { state: 'REMOVED', ids: ids}).respond( removeds)
    scope.removeSelected()
    $httpBackend.flush()
    expect( scope.alarms.length).toBe( 1)
    expect( scope.alarms[0].id).toBe( notRemovedId)
    expect( scope.alarms[0].state).toBe( 'ACKNOWLEDGED')

  }));

});
