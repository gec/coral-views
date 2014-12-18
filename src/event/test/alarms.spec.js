describe('gb-alarms', function () {
  var parentScope, scope, $compile, _subscription,
      subscribeInstance = {};
  var element,
      alarmCount = 3,
      alarms = [];
      alarmsUnackSilent = [];
      alarmsAck = [];

  for( var index = 0; index < alarmCount; index++) {
    var alarm = {
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
    alarms.push( alarm)

    var alarmUnackSilent = angular.extend( {}, alarm)
    var alarmAck = angular.extend( {}, alarm)
    alarmUnackSilent.state = 'UNACK_SILENT'
    alarmAck.state = 'ACKNOWLEDGED'

    alarmsUnackSilent.push( alarmUnackSilent)
    alarmsAck.push( alarmAck)

  }

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

  });

  beforeEach( inject(function( $injector) {
    $httpBackend = $injector.get('$httpBackend');
    $httpBackend.when( 'POST', '/models/1/alarms', { state: 'UNACK_SILENT', ids: [alarms[0].id]}).respond( [alarmsUnackSilent[0]])
    $httpBackend.when( 'POST', '/models/1/alarms', { state: 'ACKNOWLEDGED', ids: [alarmsUnackSilent[0].id]}).respond( [alarmsAck[0]])
    $httpBackend.when( 'POST', '/models/1/alarms', { state: 'ACKNOWLEDGED', ids: [alarms[0].id]}).respond( [alarmsAck[0]])

    $httpBackend.when( 'POST', '/models/1/alarms', { state: 'UNACK_SILENT', ids: [alarms[1].id]}).respond( [alarmsUnackSilent[1]])
    $httpBackend.when( 'POST', '/models/1/alarms', { state: 'ACKNOWLEDGED', ids: [alarmsUnackSilent[1].id]}).respond( [alarmsAck[1]])
    $httpBackend.when( 'POST', '/models/1/alarms', { state: 'ACKNOWLEDGED', ids: [alarms[1].id]}).respond( [alarmsAck[1]])

  }));


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

  it('should create multiple alarms', inject( function () {
    subscribeInstance.onSuccess( subscribeInstance.id, 'alarm', alarms)
    parentScope.$digest();
    var foundAlarms = findAlarms()
    expect( foundAlarms.length).toEqual(3);
  }));

  it('should update alarm state', inject( function () {
    subscribeInstance.onSuccess( subscribeInstance.id, 'alarm', alarms)
    parentScope.$digest();
    var foundAlarms = findAlarms()
    expect( foundAlarms.length).toEqual(3);

    scope.silence( scope.alarms[0])
    $httpBackend.flush()
    expect( scope.alarms[0].state).toBe( 'UNACK_SILENT')

    scope.acknowledge( scope.alarms[0])
    $httpBackend.flush()
    expect( scope.alarms[0].state).toBe( 'ACKNOWLEDGED')

    scope.acknowledge( scope.alarms[1])
    $httpBackend.flush()
    expect( scope.alarms[1].state).toBe( 'ACKNOWLEDGED')

  }));

});
