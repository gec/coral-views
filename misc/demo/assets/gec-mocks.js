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
    listeners[subscriptionId].message( subscriptionId, messageType, messageData)
  }

  return Subscription
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
      subscription: gecMock.SubscriptionProvider
    });

  /**
   * Export
   * @type {Array}
   */
  window.gecMock = gecMock


})(window, window.angular);