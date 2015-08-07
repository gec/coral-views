(function(window, angular, undefined) {

'use strict';

var gbMock = []

/**
 * @ngdoc service
 * @name gbMock.websocketFactoryProvider
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
gbMock.WebsocketFactoryProvider = function() {
  var ws = undefined
  this.$get = function() {
    return function( url) {
      if( ! ws) {
        ws = new gbMock.Websocket( url)
      } else {
        if(url)
          ws.url = url
      }
      return ws
    }

  };
};


gbMock.Websocket = function( url) {
  this.isMock = true
  this.url = url
  this.sendFrames = []
  this.isOpen = false
}

gbMock.Websocket.prototype.send = function( frame) {
  this.sendFrames.push( frame)
}
gbMock.Websocket.prototype.pushMessage = function( event) {
  if( this.hasOwnProperty( 'onmessage')) {
    this.onmessage( {data: JSON.stringify( event) })
    return true
  }
  return false
}
gbMock.Websocket.prototype.pushOpen = function( event) {
  if( this.hasOwnProperty( 'onopen')) {
    this.onopen( event)
    this.isOpen = true
    return true
  }
  return false
}
gbMock.Websocket.prototype.pushClose = function( event) {
  if( this.hasOwnProperty( 'onclose')) {
    this.onclose( event)
    return true
  }
  return false
}
gbMock.Websocket.prototype.pushError = function( event) {
  if( this.hasOwnProperty( 'onerror')) {
    this.onerror( event)
    return true
  }
  return false
}




gbMock.SubscriptionProvider = function() {
  this.$get = makeSubscription
};

function makeSubscription() {
  var listeners = {},
      status = {
        status: 'UNOPENED',
        reinitializing: false,
        description: 'WebSocket unopened'
      }

  function generateUUID(){
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = (d + Math.random()*16)%16 | 0;
      d = Math.floor(d/16);
      return (c=='x' ? r : (r&0x7|0x8)).toString(16);
    });
    return uuid;
  }


  function Subscription() {

  }
  Subscription.saveSubscriptionOnScope = function( $scope, subscriptionId) {
    if( ! $scope.__subscriptionIds)
      $scope.__subscriptionIds = []
    $scope.__subscriptionIds.push( subscriptionId)
  }

  Subscription.subscribe = function( json, $scope, messageListener, errorListener) {
    var subscriptionId = 'subscription.' + json.name + '.' + generateUUID()
    listeners[ subscriptionId] = { 'message': messageListener, 'error': errorListener}
    this.saveSubscriptionOnScope( $scope, subscriptionId)
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

  Subscription.STATUS = {
    UNOPENED: 'UNOPENED',
    OPENING: 'OPENING',
    CLOSED: 'CLOSED',
    UP: 'UP'
  }

  Subscription.getStatus = function() {
    return this.status
  }

  return Subscription
}


gbMock.RestProvider = function() {
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


function makeRest($injector) {
  var definitions = [],
      copy = angular.copy,
      status = {
        status:         'UP',
        reinitializing: false,
        description:    ''
      }

  function Rest() {

  }

  Rest.request = function(method, url, data, name, $scope, successListener) {

    var definition,
        $q = $injector.get('$q'),
        i = -1,
        headers = {};

    function makeThen( response, digest) {
      var deferred = $q.defer()

      setTimeout( function() {
        var resolveArg = {data: copy( response)}

        if( digest ) {
          if( $scope ) {
            deferred.resolve( resolveArg)
          } else {
            var rootScope = $injector.get('$rootScope')
            rootScope.$apply(function() {
              deferred.resolve( resolveArg)
            })
          }
        } else {
          deferred.resolve( resolveArg)
        }
      })

      return deferred.promise
    }

    while ((definition = definitions[++i])) {
      if (definition.match(method, url, data, headers || {})) {
        if (definition.response) {
          setTimeout( function() {
            var responseData = copy( definition.response()[1])

            if( $scope) {
              $scope.$apply( function() {

                if( name )
                  $scope[name] = responseData

                $scope.loading = false

                if( successListener)
                  successListener( responseData)
              })
            } else {
              if( successListener) {
                var rootScope = $injector.get('$rootScope')
                rootScope.$apply( function() {
                  successListener( responseData)
                })
              }
            }
          })

          return makeThen( definition.response()[1], true) // t: do digest
          //return {
          //  then: function( success, error) {
          //    setTimeout( function() {
          //      var responseData = copy( definition.response()[1])
          //
          //      if( $scope) {
          //        // name and loading already assigned above.
          //
          //        $scope.$apply( function() {
          //          if( success)
          //            success( {data: responseData})
          //        })
          //      } else {
          //        if( success) {
          //          var rootScope = $injector.get('$rootScope')
          //          rootScope.$apply( function() {
          //            success( {data: responseData})
          //          })
          //        }
          //      }
          //    })
          //
          //  }
          //}

        } else
          throw new Error('gbMock.rest: No response defined for ' + method + ' ' + url);

        return;
      }
    }
    throw new Error('gbMock.rest: No matching request found for ' + method + ' ' + url);
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

  Rest.STATUS =  {
    NOT_LOGGED_IN: 'NOT_LOGGED_IN',
    APPLICATION_SERVER_DOWN: 'APPLICATION_SERVER_DOWN',
    APPLICATION_REQUEST_FAILURE: 'APPLICATION_REQUEST_FAILURE',
    UP: 'UP'
  }

  Rest.getStatus = function() {
    return status
  }

  Rest.queryParameterFromArrayOrString = function(parameter, arrayOrString) {
    var parameterEqual = parameter + '='
    var query = ''
    if( angular.isArray(arrayOrString) ) {
      arrayOrString.forEach(function(value, index) {
        if( index === 0 )
          query = parameterEqual + value
        else
          query = query + '&' + parameterEqual + value
      })
    } else {
      if( arrayOrString && arrayOrString.length > 0 )
        query = parameterEqual + arrayOrString
    }
    return query
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


gbMock.RouteParamsProvider = function() {
  this.$get = makeRouteParams
};

function makeRouteParams() {
  var listeners = {}

  function RouteParams() {

  }

  RouteParams.navId = ''
  RouteParams.sourceUrl = ''

  return RouteParams
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
  angular.module('gbMock', ['ng']).
    provider({
      websocketFactory: gbMock.WebsocketFactoryProvider,
      subscription: gbMock.SubscriptionProvider,
      rest: gbMock.RestProvider,
      $routeParams: gbMock.RouteParamsProvider
    });

  /**
   * Export
   * @type {Array}
   */
  window.gbMock = gbMock


})(window, window.angular);