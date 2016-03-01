describe('endpoint', function () {
  var scope, $compile, _subscription,// _authentication,
    subscribeInstance = {};
  var element,
    endpointCount = 2,
    endpoints = [],
    endpointsMessage1 = [];
    endpointMessageN = [];

  for( var index = 0; index < endpointCount; index++) {
    endpoints.push( {
      id: 'id'+index,
      name: 'endpoint' + index,
      protocol: 'protocol' + index,
      enabled: true,
      commStatus: {'status': 'COMMS_UP', 'lastHeartbeat': index}
    })
    endpointsMessage1.push( {
      id: 'id'+index,
      name: 'endpoint' + index,
      protocol: 'protocol' + index + 'b',
      enabled: false
    })
    endpointsMessage1.push( {
      id: 'id'+index,
      name: 'endpoint' + index,
      commStatus: {'status': 'COMMS_DOWN', 'lastHeartbeat': (10+index)}
    })
    endpointMessageN.push( {
      'eventType': 'MODIFIED',
      'endpoint': {
        id:         'id' + index,
        name:       'endpoint' + index,
        protocol:   'protocol' + index + 'c',
        enabled:    false,
        commStatus: {'status': 'ERROR', 'lastHeartbeat': (20 + index)}
      }
    })
  }

  function makeSubscriptionId( request, idCounter) {
    var messageKey = Object.keys( request)[0]
    return 'subscription.' + messageKey + '.' + idCounter;
  }

  var authToken = 'some auth token'
  var mock = {
    authentication:   {
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
  }


  beforeEach(module('greenbus.views.rest'));
  beforeEach(module('greenbus.views.subscription'));
  beforeEach(module('greenbus.views.endpoint'));
  beforeEach(module('greenbus.views.template/endpoint/endpoints.html'));
  beforeEach(function() {
    subscribeInstance = {}
    _subscription = {
      subscribe: function (request, subscriberScope, onMessage, onError) {
        subscribeInstance = {
          id: makeSubscriptionId( request, 1),
          request: request,
          scope: subscriberScope,
          onMessage: onMessage,
          onError: onError
        }

        return subscribeInstance.id;
      }
    };

    //_authentication = {}
    _websocketFactory = {}
    module( function ($provide) {
      $provide.value('authentication', mock.authentication)
      //$provide.value('authentication', _authentication);
      $provide.value('websocketFactory', _websocketFactory);
      $provide.value('subscription', _subscription);
    })
  });
  beforeEach( inject(function( $injector) {
    $httpBackend = $injector.get('$httpBackend');
    $httpBackend.when( 'GET', '/models/1/endpoints').respond( endpoints)
  }));
  beforeEach(inject(function ($rootScope, _$compile_) {
    scope = $rootScope;
    $compile = _$compile_;
    element = angular.element( '<gb-endpoints/>');
  }));


  function initCoralEndpointsElement() {
    $compile(element)(scope);
    scope.$digest();
    return findEndpoints();
  }

  function findEndpoints() {
    return element.find('.gb-endpoint');
  }

  function findTd( endpoint, tdIndex) {
    return endpoint.find('td').eq(tdIndex);
  }

  function findAlerts() {
    return element.find('div.alert')
  }
  function findAlertCloseButton( alerts, index) {
    return alerts.eq(index).find('button')
  }

  function findAlertText( alerts, index) {
    return alerts.eq(index).find('span.ng-binding').text()
  }


  it('should start with 0 endpoints', inject( function () {
    var foundEndpoints = initCoralEndpointsElement(),
        foundAlerts = findAlerts();
    expect( foundEndpoints.length).toEqual(0);
    expect( foundAlerts.length).toEqual(0);
  }));

  it('should subscribe to endpoints', inject( function () {
    var request = {
      name: 'SubscribeToEndpoints',
      endpointIds: ['id0', 'id1']
    }
    initCoralEndpointsElement();
    $httpBackend.flush();

    expect( subscribeInstance.onMessage ).toBeDefined()
    expect( subscribeInstance.onError ).toBeDefined()
    expect( subscribeInstance.request ).toEqual( request)
  }));

  it('should start with two endpoints after get', inject( function () {
    initCoralEndpointsElement();
    scope.$digest();
    $httpBackend.flush();

    var foundEndpoints = findEndpoints()
    expect( foundEndpoints.length).toEqual(2);

    var endpoint = foundEndpoints.eq(0),
        endpointStatus = findTd( endpoint, 3),
        endpointStatusSpan = endpointStatus.find('span')
    expect( findTd( endpoint, 0).text()).toBe('endpoint0');
    expect( findTd( endpoint, 1).text()).toBe('protocol0');
    expect( findTd( endpoint, 2).text()).toBe('true');
    expect( endpointStatus.text()).toBe(' Up');
    expect( endpointStatusSpan).toHaveClass('glyphicon glyphicon-arrow-up gb-comms-enabled-up');
    expect( findTd( endpoint, 4).text()).toBe('07:00:00 PM, 12-31-1969'); // 0: start of epoch
  }));

  it('should process initial update from subscription', inject( function () {
    initCoralEndpointsElement();
    scope.$digest();
    $httpBackend.flush();

    subscribeInstance.onMessage( subscribeInstance.id, 'endpoints',  endpointsMessage1)
    scope.$digest();

    var foundEndpoints = findEndpoints()
    expect( foundEndpoints.length).toEqual(2);

    var endpoint = foundEndpoints.eq(0),
        endpointStatus = findTd( endpoint, 3),
        endpointStatusSpan = endpointStatus.find('span')
    expect( findTd( endpoint, 0).text()).toBe('endpoint0');
    expect( findTd( endpoint, 1).text()).toBe('protocol0b');
    expect( findTd( endpoint, 2).text()).toBe('false');
    expect( endpointStatus.text()).toBe(' Down');
    expect( endpointStatusSpan).toHaveClass('glyphicon glyphicon-arrow-down gb-comms-disabled-down');
    expect( findTd( endpoint, 4).text()).toBe('07:00:00 PM, 12-31-1969'); // 0: start of epoch
  }));

  it('should process subsequent updates from subscription', inject( function () {
    initCoralEndpointsElement();
    scope.$digest();
    $httpBackend.flush();

    var message =       {
      'eventType': 'MODIFIED',
      'endpoint': {
        'id': '0',
        'name': 'CloudBridge',
        'commStatus': {
          'status': 'COMMS_UP',
          'lastHeartbeat': 1417807778662
        }
      }
    }

    subscribeInstance.onMessage( subscribeInstance.id, 'endpoint',  endpointMessageN[0])
    scope.$digest();

    var foundEndpoints = findEndpoints()
    expect( foundEndpoints.length).toEqual(2);

    var endpoint = foundEndpoints.eq(0),
        endpointStatus = findTd( endpoint, 3),
        endpointStatusSpan = endpointStatus.find('span')
    expect( findTd( endpoint, 0).text()).toBe('endpoint0');
    expect( findTd( endpoint, 1).text()).toBe('protocol0c');
    expect( findTd( endpoint, 2).text()).toBe('false');
    expect( endpointStatus.text()).toBe(' Error');
    expect( endpointStatusSpan).toHaveClass('glyphicon glyphicon-exclamation-sign gb-comms-disabled-error');
    expect( findTd( endpoint, 4).text()).toBe('07:00:00 PM, 12-31-1969'); // 0: start of epoch
  }));

  it('should receive error message, show alert, and click to remove alert.', inject( function () {
    var foundAlerts, closeButton,
        errorMessage = 'Some error message.',
        message = {
          error: errorMessage
        }

    initCoralEndpointsElement();
    scope.$digest();
    $httpBackend.flush();

    subscribeInstance.onError( errorMessage, message)
    scope.$digest();
    foundAlerts = findAlerts()
    expect( foundAlerts.length).toEqual(1)
    expect( findAlertText( foundAlerts, 0)).toBe( errorMessage)

    closeButton = findAlertCloseButton( foundAlerts, 0)
    closeButton.trigger( 'click')
    foundAlerts = findAlerts()
    expect( foundAlerts.length).toEqual(0)

  }));

});
