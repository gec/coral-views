describe('gb-alarms', function () {
  var parentScope, scope, $compile, _subscription, $httpBackend,
      subscribeInstance = {};
  var element,
      alarmCount = 3,
      alarms = [];


  function makeSubscriptionId( request, idCounter) {
    var messageKey = Object.keys( request)[0]
    return 'subscription.' + messageKey + '.' + idCounter;
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
      event:{
        id: 'id'+index,
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
  beforeEach(module('greenbus.views.event'));
  beforeEach(module('template/event/alarms.html'));
  beforeEach(module('template/selection/selectAll.html'));

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


  function findAlarms() {
    return element.find('.gb-alarm');
  }

  function findTd( event, tdIndex) {
    return event.find('td').eq(tdIndex);
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
    scope.alarms[0].checked = true
    scope.alarms[2].checked = true

    $httpBackend.when( 'POST', '/models/1/alarms', { state: 'ACKNOWLEDGED', ids: ids}).respond( acks)
    scope.acknowledgeSelected()
    $httpBackend.flush()
    expect( scope.alarms[0].state).toBe( 'ACKNOWLEDGED')
    expect( scope.alarms[1].state).toBe( 'UNACK_AUDIBLE')
    expect( scope.alarms[2].state).toBe( 'ACKNOWLEDGED')

  }));

  it('should NOT remove selected alarms that are not acknowledged', inject( function () {
    subscribeInstance.onSuccess( subscribeInstance.id, 'alarm', alarms)
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
    scope.alarms[0].checked = true
    scope.alarms[2].checked = true

    var response = {
      exception: 'BadRequestException',
      message: 'Invalid transition between alarm states UNACK_AUDIBLE -> REMOVED'
    }

    $httpBackend.when( 'POST', '/models/1/alarms', { state: 'REMOVED', ids: ids}).respond( 403, response)
    scope.removeSelected()
    $httpBackend.flush()
    expect( scope.alarms.length).toBe( 3)
  }));


  // 403, {"exception":"BadRequestException","message":"No alarm exists for id 1234567890"}

  // Some good, some bad: {"exception":"BadRequestException","message":"No alarm exists for id 1234567890"}

  it('should remove selected alarms', inject( function () {
    subscribeInstance.onSuccess( subscribeInstance.id, 'alarm', alarms)
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
    scope.alarms[0].checked = true
    scope.alarms[2].checked = true

    $httpBackend.when( 'POST', '/models/1/alarms', { state: 'REMOVED', ids: ids}).respond( removeds)
    scope.removeSelected()
    $httpBackend.flush()
    expect( scope.alarms.length).toBe( 1)
    expect( scope.alarms[0].id).toBe( notRemovedId)
    expect( scope.alarms[0].state).toBe( 'UNACK_AUDIBLE')

  }));

  var subResponse = {
    "subscriptionId": "subscription.subscribeToActiveAlarms.e6721611-bdd0-432f-a301-094a9c6f1627", "type": "alarm", "data": [
      {"id": "16", "state": "ACKNOWLEDGED", "event": {"id": "764", "deviceTime": 0, "eventType": "Scada.Breaker", "alarm": true, "severity": 3, "agent": "system", "entity": "218bf05f-b479-49b6-99aa-c2803419d31f", "message": "Breaker Opened: Openstatus validity GOOD", "time": 1418783041335}},
      {"id": "15", "state": "UNACK_SILENT", "event": {"id": "723", "deviceTime": 0, "eventType": "Scada.Breaker", "alarm": true, "severity": 3, "agent": "system", "entity": "218bf05f-b479-49b6-99aa-c2803419d31f", "message": "Breaker Opened: Openstatus validity GOOD", "time": 1418764619159}},
      {"id": "14", "state": "UNACK_SILENT", "event": {"id": "689", "deviceTime": 0, "eventType": "Scada.Breaker", "alarm": true, "severity": 3, "agent": "system", "entity": "218bf05f-b479-49b6-99aa-c2803419d31f", "message": "Breaker Opened: Openstatus validity GOOD", "time": 1418752436508}},
      {"id": "13", "state": "REMOVED", "event": {"id": "673", "deviceTime": 0, "eventType": "Scada.Breaker", "alarm": true, "severity": 3, "agent": "system", "entity": "218bf05f-b479-49b6-99aa-c2803419d31f", "message": "Breaker Opened: Openstatus validity GOOD", "time": 1418751959186}},
      {"id": "12", "state": "ACKNOWLEDGED", "event": {"id": "660", "deviceTime": 0, "eventType": "Scada.Breaker", "alarm": true, "severity": 3, "agent": "system", "entity": "218bf05f-b479-49b6-99aa-c2803419d31f", "message": "Breaker Opened: Openstatus validity GOOD", "time": 1418749142013}},
      {"id": "11", "state": "UNACK_SILENT", "event": {"id": "657", "deviceTime": 0, "eventType": "Scada.Breaker", "alarm": true, "severity": 3, "agent": "system", "entity": "218bf05f-b479-49b6-99aa-c2803419d31f", "message": "Breaker Opened: Openstatus validity GOOD", "time": 1418749012579}},
      {"id": "8", "state": "UNACK_SILENT", "event": {"id": "511", "deviceTime": 0, "eventType": "Scada.Breaker", "alarm": true, "severity": 3, "agent": "system", "entity": "218bf05f-b479-49b6-99aa-c2803419d31f", "message": "Breaker Opened: Openstatus validity GOOD", "time": 1417712605267}},
      {"id": "7", "state": "UNACK_AUDIBLE", "event": {"id": "468", "deviceTime": 0, "eventType": "Scada.Breaker", "alarm": true, "severity": 3, "agent": "system", "entity": "218bf05f-b479-49b6-99aa-c2803419d31f", "message": "Breaker Opened: Openstatus validity GOOD", "time": 1417556630846}},
      {"id": "4", "state": "ACKNOWLEDGED", "event": {"id": "184", "deviceTime": 0, "eventType": "Scada.Breaker", "alarm": true, "severity": 3, "agent": "system", "entity": "218bf05f-b479-49b6-99aa-c2803419d31f", "message": "Breaker Opened: Openstatus validity GOOD", "time": 1416429297224}},
      {"id": "3", "state": "ACKNOWLEDGED", "event": {"id": "48", "deviceTime": 0, "eventType": "Scada.Breaker", "alarm": true, "severity": 3, "agent": "system", "entity": "218bf05f-b479-49b6-99aa-c2803419d31f", "message": "Breaker Opened: Openstatus validity GOOD", "time": 1415304360269}},
      {"id": "2", "state": "UNACK_AUDIBLE", "event": {"id": "22", "deviceTime": 0, "eventType": "Scada.Breaker", "alarm": true, "severity": 3, "agent": "system", "entity": "218bf05f-b479-49b6-99aa-c2803419d31f", "message": "Breaker Opened: Openstatus validity GOOD", "time": 1415288035666}},
      {"id": "1", "state": "UNACK_AUDIBLE", "event": {"id": "17", "deviceTime": 0, "eventType": "Scada.Breaker", "alarm": true, "severity": 3, "agent": "system", "entity": "218bf05f-b479-49b6-99aa-c2803419d31f", "message": "Breaker Opened: Openstatus validity GOOD", "time": 1415287958571}}
    ]
  }

});
