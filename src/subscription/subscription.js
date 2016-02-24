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


    var STATUS = {
          UNOPENED: 'UNOPENED',
          OPENING: 'OPENING',
          CLOSED: 'CLOSED',
          UP: 'UP'
        },
        DIGEST = {
          NONE: 0,   // No current Angular digest cycle
          CURRENT: 1 // Currently within a Angular digest cycle
        }
        
        

    var status = {
      status: STATUS.UNOPENED,
      reinitializing: false,
      description: 'WebSocket unopened'
    }
    function setStatus( digestState, theStatus, description, reinitializing) {

      if( status.status !== theStatus || status.description !== description ||  status.reinitializing !== reinitializing) {
        status.status = theStatus
        status.description = description
        if( reinitializing)
          status.reinitializing = reinitializing
        console.log( 'subscription.setStatus: ' + status.status + ' - ' + description)
        if( digestState === DIGEST.CURRENT) {
          $rootScope.$broadcast( 'subscription.status', status);
        } else {
          $rootScope.$apply( function() {
            $rootScope.$broadcast( 'subscription.status', status);
          })
        }
      }
    }


    //var WS = window['MozWebSocket'] ? MozWebSocket : WebSocket
    var webSocket = null,
        webSocketPendingTasks = [],
        subscriptionIdMap = {} // { subscriptionId: { message: listener, error: listener}, ...}

    /* Assign these WebSocket handlers to a newly created WebSocket */
    var wsHanders = {

      onmessage: function (event) {
        var message = JSON.parse(event.data)

        switch( message.type) {
          case 'ConnectionStatus':
            console.debug( 'onMessage.ConnectionStatus ' + message.data)
            handleGreenBusConnectionStatus( message.data)
            break;
          case 'ExceptionMessage':
            console.error( 'ExceptionMessage: ' + JSON.stringify( message.data))
            break;
          case 'SubscriptionExceptionMessage':
            console.error( 'SubscriptionExceptionMessage: ' + JSON.stringify( message.data))
            break;

          default:
            // console.debug( 'onMessage message.subscriptionId=' + message.subscriptionId + ', message.type=' + message.type)
            var listener = getListenerForMessage( message)
            if( listener)
              handleMessageWithListener( message, listener)
        }
      },
      onopen: function(event) {
        console.log( 'webSocket.onopen event: ' + event)
        setStatus( DIGEST.NONE, STATUS.UP, '')

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

        setStatus( DIGEST.NONE, STATUS.CLOSED, 'WebSocket closed. Your network connection is down or the application server appears to be down.')
        removeAllSubscriptions( 'WebSocket onclose()')

        // Cannot redirect here because this webSocket thread fights with the get reply 401 thread.
        // Let the get handle the redirect. Might need to coordinate something with get in the future.
      },
      onerror: function(event) {
        var data = event.data;
        var name = event.name;
        var message = event.message;
        console.log( 'webSocket.onerror name: ' + name + ', message: ' + message + ', data: ' + data)
        setStatus( DIGEST.NONE, STATUS.CLOSED, 'WebSocket closed with error. Your network connection is down or the application server appears to be down.');
        removeAllSubscriptions( 'WebSocket onerror()')
      }
    }

    function getListenerForMessage( message) {
      if( message.subscriptionId)
        return subscriptionIdMap[ message.subscriptionId]
      else
        return null
    }

    function handleMessageWithListener( message, listener) {
      if( ! message.error) {

        if( listener.message)
          listener.message( message.subscriptionId, message.type, message.data)

      } else {

        console.log( 'webSocket.handleError message.error: ' + message.error)
        if( message.jsError)
          console.error( 'webSocket.handleError message.jsError: ' + message.jsError)

        if( listener.error)
          listener.error( message.error, message)

      }
    }

    function handleGreenBusConnectionStatus( json) {
      $rootScope.$apply( function() {
        $rootScope.$broadcast( 'greenbus.status', json)
      })

    }

    function saveSubscriptionOnScope( scope, subscriptionId) {
      if( ! scope.__subscriptionIds)
        scope.__subscriptionIds = []
      scope.__subscriptionIds.push( subscriptionId)
    }

    function registerSubscriptionOnScope( scope, subscriptionId) {

      saveSubscriptionOnScope( scope, subscriptionId);

      // Register for controller.$destroy event and kill any retry tasks.
      // TODO save return value as unregister function. Could have multiples on one scope.
      scope.$on( '$destroy', function( event) {
        if( scope.__subscriptionIds) {
          console.log( 'subscription $destroy ' + scope.__subscriptionIds.length);
          scope.__subscriptionIds.forEach( function( subscriptionId) {
            unsubscribe( subscriptionId)
            if( subscriptionIdMap.hasOwnProperty( subscriptionId))
              delete subscriptionIdMap[ subscriptionId];
          })
          scope.__subscriptionIds = []
        }
      });

    }

    function removeAllSubscriptions( error) {
      // save in temp in case a listener.error() tries to resubscribe
      var subscriptionId, listener,
          temp = subscriptionIdMap
      subscriptionIdMap = {}
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
      //var messageKey = Object.keys( json)[0]
      // add the messageKey just for easier debugging.
      return 'subscription.' + json.name + '.' + generateUUID();
    }

    function addSubscriptionIdToMessage( json) {
      var subscriptionId = makeSubscriptionId( json)
      json.subscriptionId = subscriptionId
      json.authToken = authentication.getAuthToken()
      return subscriptionId
    }

    function makeWebSocket() {
      var wsUri = $location.protocol() === 'https' ? 'wss' : 'ws'
      wsUri += '://' + $location.host() + ':' + $location.port()
      // Note: The WebSocket API doesn't have a way to add headers like 'Authorization', so we put in on the URL
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

    function pushPendingSubscription( subscriptionId, scope, request, messageListener, errorListener) {
      // We're good, so save request to wait for WebSocket.onopen().
      console.log( 'subscribe: send pending ( ' + request + ')')
      webSocketPendingTasks.push( request)
      registerSubscriptionOnScope( scope, subscriptionId);
      subscriptionIdMap[ subscriptionId] = { 'message': messageListener, 'error': errorListener}
    }

    /**
     * Called on each message coming over the WebSocket
     * @callback onMessage
     * @param {string} subscriptionId
     * @param {string} messageType
     * @param {(object|array)} data
     */

    /**
     * Called on each error coming over the WebSocket
     *
     * @callback onError
     * @param {string} error - Error description
     * @param {Object} message - The raw message containing the error
     * @param {string} message.type - The message type (ex: measurements, endpoints, etc.).
     * @param {string} message.subscriptionId - The subscription ID assigned by this subscription client.
     * @param {Object} message.error - Same as error above
     * @param {Object} message.jsError - Optional JSON error if there was a JSON parsing problem in the request.
     * @param {(object|array)} data - Data is usually undefined or null.
     */

    /**
     *
     * Error handling
     * * Send to
     *
     * @param {Object} json - The request sent over the WebSocket.
     * @param {string} json.name - The subscription name recognized by the server.
     * @param {*}      json.* - The subscription request properties that goes with the specific subscription
     * @param {scope} scope - Unsubscribe it registered on scope $destroy event.
     * @param {onMessage} onMessage - Called for each message
     * @param {onError}   onError - Called when message contains an error (an 'error' property)
     * @returns {string} subscriptionId used when calling unsubscribe
     */
    function subscribe( json, scope, onMessage, onError) {

      var subscriptionId = addSubscriptionIdToMessage( json)
      var request = JSON.stringify( json)

      // Lazy init of webSocket
      if( status.status == STATUS.UP) {

        try {
          webSocket.send( request)

          // We're good, so save request for WebSocket.onmessage()
          console.log( 'subscribe: send( ' + request + ')')
          registerSubscriptionOnScope( scope, subscriptionId);
          subscriptionIdMap[ subscriptionId] = { 'message': onMessage, 'error': onError}
        } catch( ex) {
          if( onError)
            onError( 'Could not send subscribe request to server. Exception: ' + ex)
          subscriptionId = null
        }

      } else{

        if( status.status != STATUS.OPENING) {
          setStatus( DIGEST.CURRENT, STATUS.OPENING, 'Initializing WebSocket for subscription services.')

          try {
            if( ! authentication.isLoggedIn())  // TODO: Should we redirect to login?
              throw 'Not logged in.'
            webSocket = makeWebSocket()
            if( ! webSocket)
              throw 'WebSocket create failed.'

            pushPendingSubscription( subscriptionId, scope, request, onMessage, onError)

          } catch( ex) {
            var description = 'Unable to open WebSocket connection to server. Exception: ' + ex
            // TODO: not logged in!
            setStatus( DIGEST.CURRENT, STATUS.CLOSED, description)
            webSocket = null
            if( onError)
              onError( description)
            subscriptionId = null
          }

        } else {
          // Already opening WebSocket, STATUS.OPENING. Just push pending.
          pushPendingSubscription( subscriptionId, scope, request, onMessage, onError)
        }

      }

      return subscriptionId
    }

    function unsubscribe( subscriptionId) {
      if( webSocket)
        webSocket.send(JSON.stringify(
          {
            name: 'Unsubscribe',
            authToken: authentication.getAuthToken(),
            subscriptionId: subscriptionId
          }
        ))
      if( subscriptionIdMap.hasOwnProperty( subscriptionId))
        delete subscriptionIdMap[ subscriptionId]
    }


    /**
     * Public API
     */
    return {
      STATUS: STATUS, // publish STATUS enum
      getStatus: function() { return status; },
      subscribe: subscribe,
      unsubscribe: unsubscribe
    }

  }]);
