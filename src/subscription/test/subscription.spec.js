describe('subscription', function () {

  var authToken = 'some auth token'
  var mock = {

    authentication:   {
      isLoggedIn:   function() {return true},
      getAuthToken: function() { return authToken}
    },
    websocket:        {
      send:  jasmine.createSpy('send'),
      close: jasmine.createSpy('close')
    },
    websocketFactory: function(url) {
      return mock.websocket
    },
    location:         {
      protocol: function() { return 'http' },
      host:     function() { return 'localhost' },
      port:     function() { return 9000 }
    },
    rootScope:        {
      $broadcast: jasmine.createSpy('$broadcast'),
      $apply:     function(aFunction) { aFunction() }
    },
    onEvents:         {},
    on:               function(eventId, aFunction) {
      mock.onEvents[eventId] = aFunction
    },

    messageListener: jasmine.createSpy('messageListener'),
    errorListener:   jasmine.createSpy('errorListener')
  }

  function resetAllMockSpies() {
    mock.websocket.send.calls.reset()
    mock.websocket.close.calls.reset()
    mock.rootScope.$broadcast.calls.reset()
    mock.messageListener.calls.reset()
    mock.errorListener.calls.reset()
    mock.onEvents = {}
  }

  //you need to indicate your module in a test
  beforeEach(module('gec.views.subscription'));
//  beforeEach(module('ngMock'));
  beforeEach(function() {
    resetAllMockSpies()
    module(function($provide) {
      $provide.value('authentication', mock.authentication)
      $provide.value('$location', mock.location)
      $provide.value('$rootScope', mock.rootScope)
    })

    // override the default websocketFactory
    angular.module('gec.views.subscription').
      factory('websocketFactory', function($window) {
        return mock.websocketFactory
      })

    spyOn(mock, 'websocketFactory').and.callThrough()
  });


  describe('login successful', function() {

    var json = null
    var scope = null

    beforeEach(function() {
      resetAllMockSpies()
      spyOn(mock.authentication, 'isLoggedIn').and.returnValue(true)
      spyOn(mock, 'on').and.callThrough()

      json = {subscribeToSomething: {}}
      scope = { $on: mock.on}
    })

    it('should go through full scope lifecycle of subscribe, messageListener, and scope $destroy', inject(function(subscription) {
      var subscriptionId = subscription.subscribe(json, scope, mock.messageListener, mock.errorListener)
      expect(subscriptionId).toStartWith('subscription.subscribeToSomething.')
      expect(mock.authentication.isLoggedIn).toHaveBeenCalled();
      expect(mock.websocketFactory).toHaveBeenCalledWith('ws://localhost:9000/websocket?authToken=' + authToken);
      expect(mock.on).toHaveBeenCalledWith('$destroy', jasmine.any(Function));
      expect(scope.subscriptionIds.length).toBe(1)

      // Don't call send until socket is open
      expect(mock.websocket.send).not.toHaveBeenCalled();
      mock.websocket.onopen('open event')
      expect(mock.websocket.send).toHaveBeenCalledWith(JSON.stringify(json));

      // Receive a message
      var message = {
        type:           'some type',
        subscriptionId: subscriptionId,
        data:           'some data'
      }
      var event = {
        data: JSON.stringify(message)
      }
      expect(mock.messageListener).not.toHaveBeenCalled()
      mock.websocket.onmessage(event)
      expect(mock.messageListener).toHaveBeenCalledWith(subscriptionId, message.type, message.data)

      // on $destroy, unsubscribe and remove subscriptionId
      mock.onEvents['$destroy']('some event')
      expect(scope.subscriptionIds.length).toBe(0)
      expect(mock.websocket.send).toHaveBeenCalledWith(JSON.stringify({unsubscribe: subscriptionId}));

      // next message should be for unknown subscriptionId, so it doesn't know the messageListener any more
      mock.websocket.onmessage(event)
      expect(mock.messageListener.calls.count()).toBe(1)

    }));

    it('should process multiple pending subscribes after WebSocket is open', inject(function(subscription) {
      var subscriptionId = subscription.subscribe(json, scope, mock.messageListener, mock.errorListener)
      var subscriptionId2 = subscription.subscribe(json, scope, mock.messageListener, mock.errorListener)
      expect(subscriptionId).toStartWith('subscription.subscribeToSomething.')
      expect(subscriptionId2).toStartWith('subscription.subscribeToSomething.')
      expect(subscriptionId === subscriptionId2).toBeFalse()
      expect(mock.websocketFactory.calls.count()).toBe(1);
      expect(mock.on.calls.count()).toBe(2);
      expect(scope.subscriptionIds.length).toBe(2)

      // Don't call send until socket is open
      expect(mock.websocket.send).not.toHaveBeenCalled();
      mock.websocket.onopen('open event')
      expect(mock.websocket.send).toHaveBeenCalledWith(JSON.stringify(json));
      expect(mock.websocket.send.calls.count()).toBe(2);

      // Receive a message for subscriptionId
      var message = {
        type:           'some type',
        subscriptionId: subscriptionId,
        data:           'some data'
      }
      var event = {
        data: JSON.stringify(message)
      }
      expect(mock.messageListener).not.toHaveBeenCalled()
      mock.websocket.onmessage(event)
      expect(mock.messageListener).toHaveBeenCalledWith(subscriptionId, message.type, message.data)


      // Receive a message for subscriptionId2
      var message2 = {
        type:           'some type',
        subscriptionId: subscriptionId2,
        data:           'some data'
      }
      var event2 = {
        data: JSON.stringify(message2)
      }
      mock.websocket.onmessage(event2)
      expect(mock.messageListener).toHaveBeenCalledWith(subscriptionId2, message2.type, message2.data)


      // on $destroy, unsubscribe and remove subscriptionId
      mock.onEvents['$destroy']('some event')
      expect(scope.subscriptionIds.length).toBe(0)
      expect(mock.websocket.send).toHaveBeenCalledWith(JSON.stringify({unsubscribe: subscriptionId}));

      // next message should be for unknown subscriptionId, so it doesn't know the messageListener any more
      mock.websocket.onmessage(event)
      expect(mock.messageListener.calls.count()).toBe(2)

    }));

    it('should broadcast ConnectionStatus from sever as reef.status', inject(function(subscription) {
      var subscriptionId = subscription.subscribe(json, scope, mock.messageListener, mock.errorListener)
      mock.websocket.onopen('open event')

      // Receive a message
      var message = {
        type: 'ConnectionStatus',
        data: 'some data'
      }
      var event = {
        data: JSON.stringify(message)
      }
      mock.websocket.onmessage(event)
      expect(mock.messageListener).not.toHaveBeenCalled()
      expect(mock.rootScope.$broadcast).toHaveBeenCalledWith('reef.status', message.data)

    }));

    it('should call error listener because of message.error', inject(function(subscription) {
      var subscriptionId = subscription.subscribe(json, scope, mock.messageListener, mock.errorListener)

      // Receive a message
      var message = {
        type:           'some type',
        subscriptionId: subscriptionId,
        data:           'some data',
        error:          'some error'
      }
      var event = {
        data: JSON.stringify(message)
      }
      mock.websocket.onmessage(event)
      expect(mock.messageListener).not.toHaveBeenCalled()
      expect(mock.errorListener).toHaveBeenCalledWith(message.error, message)
      expect(mock.websocket.send).not.toHaveBeenCalled()
    }));

    it('should call error listener because of WebSocket.onclose()', inject(function(subscription) {
      var subscriptionId = subscription.subscribe(json, scope, mock.messageListener, mock.errorListener)

      mock.websocket.onclose(
        {
          code:     1,
          reason:   'some reason',
          wasClean: false
        }
      )

      expect(mock.rootScope.$broadcast).toHaveBeenCalledWith('subscription.status', {
        state:          subscription.STATE.CONNECTION_FAILED,
        reinitializing: false
      })
      expect(mock.errorListener).toHaveBeenCalledWith('WebSocket onclose()', '')
      expect(mock.websocket.send).not.toHaveBeenCalled()
    }));

    it('should call error listener because of WebSocket.onerror()', inject(function(subscription) {
      var subscriptionId = subscription.subscribe(json, scope, mock.messageListener, mock.errorListener)

      mock.websocket.onerror(
        {
          data:    'some data',
          name:    'some name',
          message: 'some message'
        }
      )

      expect(mock.rootScope.$broadcast).toHaveBeenCalledWith('subscription.status', {
        state:          subscription.STATE.CONNECTION_FAILED,
        reinitializing: false
      })
      expect(mock.errorListener).toHaveBeenCalledWith('WebSocket onerror()', '')
      expect(mock.websocket.send).not.toHaveBeenCalled()
    }));
  });

  describe('login failure', function() {

    beforeEach(function() {
      //webSocketUrl = null
      spyOn(mock.authentication, 'isLoggedIn').and.returnValue(false)
    })

    it('should open websocket and send subscription request', inject(function(subscription) {
      var json = {subscribeToSomething: {}}
      var scope = { $on: mock.on}
      subscription.subscribe(json, scope, mock.messageListener, mock.errorListener)
      expect(mock.authentication.isLoggedIn).toHaveBeenCalled();
      expect(mock.websocketFactory).not.toHaveBeenCalled();
    }));
  });


});
