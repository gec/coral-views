describe('gb-events', function () {
  var scope, $compile, _subscription,
    subscribeInstance = {};
  var element,
    eventCount = 3,
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

  function makeSubscriptionId( request, idCounter) {
    return 'subscription.' + request.name + '.' + idCounter;
  }

  var authToken = 'some auth token',
      authenticationMock =   {
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
  beforeEach(module('greenbus.views.event'));
  beforeEach(module('greenbus.views.template/event/events.html'));
  beforeEach(module('greenbus.views.template/event/alarms.html'));

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

  beforeEach(inject(function ($rootScope, _$compile_) {

    scope = $rootScope;
    $compile = _$compile_;

    element = angular.element( '<gb-events limit="40"  />');
  }));


  function initGbEventsElement() {
    $compile(element)(scope);
    scope.$digest();
    return findEvents();
  }

  function findEvents() {
    return element.find('.gb-event');
  }

  function findTd( event, tdIndex) {
    return event.find('td').eq(tdIndex);
  }

  it('should start with 0 events', inject( function () {
    var foundEvents = initGbEventsElement();
    expect( foundEvents.length).toEqual(0);
  }));

  it('should subscribe to events', inject( function () {
    var request = {
      name: 'SubscribeToEvents',
      //eventTypes: [],
      limit: 40
    }
    initGbEventsElement();
    expect( subscribeInstance.onSuccess ).toBeDefined()
    expect( subscribeInstance.onError ).toBeDefined()
    expect( subscribeInstance.request ).toEqual( request)
  }));

  it('should create one event', inject( function () {
    initGbEventsElement();
    subscribeInstance.onSuccess( subscribeInstance.id, 'event', events[0])
    scope.$digest();

    var foundEvents = findEvents()
    expect( foundEvents.length).toEqual(1);

    var event = foundEvents.eq(0)
    expect( findTd( event, 0).text()).toBe('eventType0');
    expect( findTd( event, 2).text()).toBe('0');
    expect( findTd( event, 4).text()).toBe('message0');
    expect( findTd( event, 5).text()).toBe('7:00:00 PM, 12-31-1969'); // 0: start of epoch
  }));

  it('should create multiple events', inject( function () {
    initGbEventsElement();
    subscribeInstance.onSuccess( subscribeInstance.id, 'event', events)
    scope.$digest();
    var foundEvents = findEvents()
    expect( foundEvents.length).toEqual(3);

  }));

});
