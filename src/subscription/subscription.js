/**
* Copyright 2013-2014 Green Energy Corp.
*
* Licensed to Green Energy Corp (www.greenenergycorp.com) under one or more
* contributor license agreements. See the NOTICE file distributed with this
* work for additional information regarding copyright ownership. Green Energy
* Corp licenses this file to you under the Apache License, Version 2.0 (the
* "License"); you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
* WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
* License for the specific language governing permissions and limitations under
* the License.
*
* Author: Flint O'Brien
*/

angular.module('greenbus.views.subscription', ['greenbus.views.authentication']).

  factory('websocketFactory', ['$window', function($window) {
    var WebSocketClass;

    if ('WebSocket' in $window)
    {
      WebSocketClass = WebSocket;
    }
    else if ('MozWebSocket' in $window)
    {
      WebSocketClass = MozWebSocket;
    }

    return WebSocketClass ? function(url) { return new WebSocketClass(url); } : undefined;
  }]).

  factory('subscription', ['$rootScope', '$location', 'authentication', 'websocketFactory', function( $rootScope, $location, authentication, websocketFactory){


    var STATE = {
      UNOPENED: 'UNOPENED',
      CLOSED: 'CLOSED',
      OPENING: 'OPENING',
      UP: 'UP'
    }

    var status = {
      state: STATE.UNOPENED,
      reinitializing: false,
      description: 'WebSocket unopened'
    }
    function setStatus( state, description, reinitializing) {
      status.state = state
      status.description = description
      if( reinitializing)
        status.reinitializing = reinitializing
      console.log( 'setStatus: ' + status.state + ', ' + description)
      $rootScope.$broadcast( 'subscription.status', status);
    }


    //var WS = window['MozWebSocket'] ? MozWebSocket : WebSocket
    var webSocket = null
    var webSocketPendingTasks = []

    var subscription = {
      listeners: {}   // { subscriptionId: { message: listener, error: listener}, ...}
    };

    /* Assign these WebSocket handlers to a newly created WebSocket */
    var wsHanders = {

      onmessage: function (event) {
        var message = JSON.parse(event.data)

        if( message.type === 'ConnectionStatus') {
          console.debug( 'onMessage.ConnectionStatus ' + message.data)
          handleReefConnectionStatus( message.data)
          return
        }

        // Handle errors
        if(message.error) {
          handleError( message)
          return
        }

//                    console.debug( 'onMessage message.subscriptionId=' + message.subscriptionId + ', message.type=' + message.type)

        var listener = getListenerForMessage( message)
        if( listener && listener.message)
          listener.message( message.subscriptionId, message.type, message.data)
      },
      onopen: function(event) {
        console.log( 'webSocket.onopen event: ' + event)
        setStatus( STATE.UP, '')

        while( webSocketPendingTasks.length > 0) {
          var data = webSocketPendingTasks.shift()
          console.log( 'onopen: send( ' + data + ')')
          webSocket.send( data)
        }
      },
      onclose: function(event) {
        var code = event.code;
        var reason = event.reason;
        var wasClean = event.wasClean;
        console.log( 'webSocket.onclose code: ' + code + ', wasClean: ' + wasClean + ', reason: ' + reason)
        webSocket = null

        setStatus( STATE.CLOSED, 'WebSocket closed. Your network connection is down or the application server appears to be down.')
        removeAllSubscriptions( 'WebSocket onclose()')

        // Cannot redirect here because this webSocket thread fights with the get reply 401 thread.
        // Let the get handle the redirect. Might need to coordinate something with get in the future.
      },
      onerror: function(event) {
        var data = event.data;
        var name = event.name;
        var message = event.message;
        console.log( 'webSocket.onerror name: ' + name + ', message: ' + message + ', data: ' + data)
        setStatus( STATE.CLOSED, 'WebSocket closed with error. Your network connection is down or the application server appears to be down.');
        removeAllSubscriptions( 'WebSocket onerror()')
      }
    }

    function getListenerForMessage( message) {
      if( message.subscriptionId)
        return subscription.listeners[ message.subscriptionId]
      else
        return null
    }

    function handleError( message) {
      //webSocket.close()
      console.log( 'webSocket.handleError message.error: ' + message.error)
      if( message.jsError)
        console.error( 'webSocket.handleError message.jsError: ' + message.jsError)

      var listener = getListenerForMessage( message);
      if( listener && listener.error)
        listener.error( message.error, message)
    }

    function handleReefConnectionStatus( json) {
      // TODO! this is a reef status, not connection
      $rootScope.$broadcast( 'reef.status', json)
    }

    function saveSubscriptionOnScope( $scope, subscriptionId) {
      if( ! $scope.subscriptionIds)
        $scope.subscriptionIds = []
      $scope.subscriptionIds.push( subscriptionId)
    }

    function registerSubscriptionOnScope( $scope, subscriptionId) {

      saveSubscriptionOnScope( $scope, subscriptionId);

      // Register for controller.$destroy event and kill any retry tasks.
      // TODO save return value as unregister function. Could have multiples on one $scope.
      $scope.$on( '$destroy', function( event) {
        if( $scope.subscriptionIds) {
          console.log( 'reef.subscribe $destroy ' + $scope.subscriptionIds.length);
          $scope.subscriptionIds.forEach( function( subscriptionId) {
            unsubscribe( subscriptionId)
            delete subscription.listeners[ subscriptionId]
          })
          $scope.subscriptionIds = []
        }
      });

    }

    function removeAllSubscriptions( error) {
      // save in temp in case a listener.error() tries to resubscribe
      var subscriptionId, listener,
        temp = subscription.listeners
      subscription.listeners = {}
      webSocketPendingTasks = []
      for( subscriptionId in temp) {
        listener = temp[subscriptionId]
        if( listener.error)
          listener.error( error, '')
      }
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

    function makeSubscriptionId( json) {
      var messageKey = Object.keys( json)[0]
      // add the messageKey just for easier debugging.
      return 'subscription.' + messageKey + '.' + generateUUID();
    }

    function addSubscriptionIdToMessage( json) {
      var subscriptionId = makeSubscriptionId( json)
      var messageKey = Object.keys( json)[0]
      json[messageKey].subscriptionId = subscriptionId
      return subscriptionId
    }

    function makeWebSocket() {
      var wsUri = $location.protocol() === 'https' ? 'wss' : 'ws'
      wsUri += '://' + $location.host() + ':' + $location.port()
      wsUri += '/websocket?authToken=' + authentication.getAuthToken()
      var ws = websocketFactory( wsUri)
      if( ws) {
        ws.onmessage = wsHanders.onmessage
        ws.onopen = wsHanders.onopen
        ws.onclose = wsHanders.onclose
        ws.onerror = wsHanders.onerror
      }
      return ws
    }

    function pushPendingSubscription( subscriptionId, $scope, request, messageListener, errorListener) {
      // We're good, so save request to wait for WebSocket.onopen().
      console.log( 'subscribe: send pending ( ' + request + ')')
      webSocketPendingTasks.push( request)
      registerSubscriptionOnScope( $scope, subscriptionId);
      subscription.listeners[ subscriptionId] = { 'message': messageListener, 'error': errorListener}
    }


    function subscribe( json, $scope, messageListener, errorListener) {

      var subscriptionId = addSubscriptionIdToMessage( json)
      var request = JSON.stringify( json)

      // Lazy init of webSocket
      if( status.state == STATE.UP) {

        try {
          webSocket.send( request)

          // We're good, so save request for WebSocket.onmessage()
          console.log( 'subscribe: send( ' + request + ')')
          registerSubscriptionOnScope( $scope, subscriptionId);
          subscription.listeners[ subscriptionId] = { 'message': messageListener, 'error': errorListener}
        } catch( ex) {
          if( errorListener)
            errorListener( 'Could not send subscribe request to server. Exception: ' + ex)
          subscriptionId = null
        }

      } else{

        if( status.state != STATE.OPENING) {
          setStatus( STATE.OPENING, 'Initializing WebSocket for subscription services.')

          try {
            if( ! authentication.isLoggedIn())  // TODO: Should we redirect to login?
              throw 'Not logged in.'
            webSocket = makeWebSocket()
            if( ! webSocket)
              throw 'WebSocket create failed.'

            pushPendingSubscription( subscriptionId, $scope, request, messageListener, errorListener)

          } catch( ex) {
            setStatus( STATE.CLOSED, 'Unable to open WebSocket. Your network connection is down or the application server appears to be down.')
            webSocket = null
            if( errorListener)
              errorListener( 'Could not create connection to server. Exception: ' + ex)
            subscriptionId = null
          }

        } else {
          // Already opening WebSocket, STATE.OPENING. Just push pending.
          pushPendingSubscription( subscriptionId, $scope, request, messageListener, errorListener)
        }

      }

      return subscriptionId
    }

    function unsubscribe( subscriptionId) {
      webSocket.send(JSON.stringify(
        { unsubscribe: subscriptionId}
      ))
      delete subscription[ subscriptionId]
    }


    /**
     * Public API
     */
    return {
      STATE: STATE, // publish STATE enum
      getStatus: function() { return status; },
      subscribe: subscribe,
      unsubscribe: unsubscribe
    }

  }]);
