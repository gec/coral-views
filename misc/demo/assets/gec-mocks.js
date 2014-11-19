(function(window, angular, undefined) {

'use strict';

var gecMock = []

/**
 * @ngdoc service
 * @name gecMock.websocketFactoryProvider
 *
 * @description
 * Mock implementation of the $interval service.
 *
 * Use {@link ngMock.$interval#flush `$interval.flush(millis)`} to
 * move forward by `millis` milliseconds and trigger any functions scheduled to run in that
 * time.
 *
 * @param {function()} fn A function that should be called repeatedly.
 * @param {number} delay Number of milliseconds between each function call.
 * @param {number=} [count=0] Number of times to repeat. If not set, or 0, will repeat
 *   indefinitely.
 * @param {boolean=} [invokeApply=true] If set to `false` skips model dirty checking, otherwise
 *   will invoke `fn` within the {@link ng.$rootScope.Scope#$apply $apply} block.
 * @returns {promise} A promise which will be notified on each iteration.
 */
gecMock.WebsocketFactoryProvider = function() {
  var ws = undefined
  this.$get = function() {
    return function( url) {
      if( ! ws) {
        ws = new gecMock.Websocket( url)
      } else {
        if(url)
          ws.url = url
      }
      return ws
    }

  };
};


gecMock.Websocket = function( url) {
  this.isMock = true
  this.url = url
  this.sendFrames = []
  this.isOpen = false
}

gecMock.Websocket.prototype.send = function( frame) {
  this.sendFrames.push( frame)
}
gecMock.Websocket.prototype.pushMessage = function( event) {
  if( this.hasOwnProperty( 'onmessage')) {
    this.onmessage( {data: JSON.stringify( event) })
    return true
  }
  return false
}
gecMock.Websocket.prototype.pushOpen = function( event) {
  if( this.hasOwnProperty( 'onopen')) {
    this.onopen( event)
    this.isOpen = true
    return true
  }
  return false
}
gecMock.Websocket.prototype.pushClose = function( event) {
  if( this.hasOwnProperty( 'onclose')) {
    this.onclose( event)
    return true
  }
  return false
}
gecMock.Websocket.prototype.pushError = function( event) {
  if( this.hasOwnProperty( 'onerror')) {
    this.onerror( event)
    return true
  }
  return false
}




gecMock.SubscriptionProvider = function() {
  this.$get = makeSubscription
};

function makeSubscription() {
  var listeners = {}

  function Subscription() {

  }

  Subscription.subscribe = function( json, $scope, messageListener, errorListener) {
    var subscriptionId = 'subscription.' + Object.keys( json)[0]
    listeners[ subscriptionId] = { 'message': messageListener, 'error': errorListener}
    return subscriptionId
  }
  Subscription.unsubscribe = function( subscriptionId) {
    delete listeners[ subscriptionId];
  }
  Subscription.getStatus = function( ) {
    return {
      state: 'Connected to server',
      reinitializing: false
    }
  }

  Subscription.pushMessage = function( subscriptionId, messageType, messageData) {
    setTimeout( function() {
      listeners[subscriptionId].message( subscriptionId, messageType, messageData)
    }, 0)
  }

  return Subscription
}


gecMock.RestProvider = function() {
  this.$get = makeRest
};

function MockHttpExpectation(method, url, data, headers) {

  this.data = data;
  this.headers = headers;

  this.match = function(m, u, d, h) {
    if (method != m) return false;
    if (!this.matchUrl(u)) return false;
    if (angular.isDefined(d) && !this.matchData(d)) return false;
    if (angular.isDefined(h) && !this.matchHeaders(h)) return false;
    return true;
  };

  this.matchUrl = function(u) {
    if (!url) return true;
    if (angular.isFunction(url.test)) return url.test(u);
    return url == u;
  };

  this.matchHeaders = function(h) {
    if (angular.isUndefined(headers)) return true;
    if (angular.isFunction(headers)) return headers(h);
    return angular.equals(headers, h);
  };

  this.matchData = function(d) {
    if (angular.isUndefined(data)) return true;
    if (data && angular.isFunction(data.test)) return data.test(d);
    if (data && angular.isFunction(data)) return data(d);
    if (data && !angular.isString(data)) {
      return angular.equals(angular.fromJson(angular.toJson(data)), angular.fromJson(d));
    }
    return data == d;
  };

  this.toString = function() {
    return method + ' ' + url;
  };
}


function makeRest() {
  var definitions = [],
      copy = angular.copy

  function Rest() {

  }

  Rest.request = function(method, url, data, name, $scope, successListener) {

    var definition,
        i = -1,
      headers = {};

    while ((definition = definitions[++i])) {
      if (definition.match(method, url, data, headers || {})) {
        if (definition.response) {
          setTimeout( function() {
            $scope.$apply( function() {

              var responseData = copy( definition.response()[1])

              if( name )
                $scope[name] = responseData

              $scope.loading = false

              if( successListener)
                successListener( responseData)
            })
          })

        } else
          throw new Error('No response defined !');

        return;
      }
    }
  }

  Rest.get = function(url, name, $scope, successListener) {
    return Rest.request( 'GET', url, {}, name, $scope, successListener)
  }
  Rest.post = function(url, data, name, $scope, successListener, failureListener) {
    return Rest.request( 'POST', url, data, name, $scope, successListener)
  }
  Rest['delete'] = function(url, name, $scope, successListener, failureListener) {
    return Rest.request( 'DELETE', url, {}, name, $scope, successListener)
  }

  function createResponse(status, data, headers, statusText) {
    if (angular.isFunction(status)) return status;

    return function() {
      return angular.isNumber(status)
        ? [status, data, headers, statusText]
        : [200, status, data];
    };
  }

  Rest.when = function( method, url, data, headers) {
    var definition = new MockHttpExpectation(method, url, data, headers),
        chain = {
          respond: function(status, data, headers, statusText) {
            definition.response = createResponse(status, data, headers, statusText);
          }
        }

    definitions.push(definition)
    return chain
  }

  function createShortMethods(prefix) {
    angular.forEach(['GET', 'DELETE', 'JSONP', 'HEAD'], function(method) {
      Rest[prefix + method] = function(url, headers) {
        return Rest[prefix](method, url, undefined, headers);
      };
    });

    angular.forEach(['PUT', 'POST', 'PATCH'], function(method) {
      Rest[prefix + method] = function(url, data, headers) {
        return Rest[prefix](method, url, data, headers);
      };
    });
  }

  createShortMethods('when');

  return Rest
}

  /**
   * @ngdoc module
   * @name ngMock
   * @packageName angular-mocks
   * @description
   *
   * # ngMock
   *
   * The `ngMock` module provides support to inject and mock Angular services into unit tests.
   * In addition, ngMock also extends various core ng services such that they can be
   * inspected and controlled in a synchronous manner within test code.
   *
   *
   * <div doc-module-components="ngMock"></div>
   *
   */
  angular.module('gecMock', ['ng']).
    provider({
      websocketFactory: gecMock.WebsocketFactoryProvider,
      subscription: gecMock.SubscriptionProvider,
      rest: gecMock.RestProvider
    });

  /**
   * Export
   * @type {Array}
   */
  window.gecMock = gecMock


})(window, window.angular);