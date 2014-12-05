/**
 * Copyright 2013-2014 Green Energy Corp.
 *
 * Licensed to Green Energy Corp (www.greenenergycorp.com) under one or more
 * contributor license agreements. See the NOTICE file distributed with this
 * work for additional information regarding copyright ownership. Green Energy
 * Corp licenses this file to you under the Apache License, Version 2.0 (the
 * 'License'); you may not use this file except in compliance with the License.
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
 *
 */



angular.module('greenbus.views.endpoint', ['greenbus.views.rest', 'greenbus.views.subscription']).

  controller( 'gbEndpointsController', ['$scope', 'rest', 'subscription', function( $scope, rest, subscription) {
    $scope.endpoints = []

    var CommStatusNames = {
      COMMS_DOWN: 'Down',
      COMMS_UP: 'Up',
      ERROR: 'Error',
      UNKNOWN: 'Unknown'
    }

    function findEndpointIndex( id) {
      var i, endpoint,
          length = $scope.endpoints.length

      for( i = 0; i < length; i++) {
        endpoint = $scope.endpoints[i]
        if( endpoint.id === id)
          return i
      }
      return -1
    }
    function findEndpoint( id) {

      var index = findEndpointIndex( id)
      if( index >= 0)
        return $scope.endpoints[index]
      else
        return null
    }



    function getCommStatus( commStatus) {
      var status = CommStatusNames.UNKNOWN,
          lastHeartbeat = 0
      if( commStatus) {
        var statusValue = commStatus.status || 'UNKNOWN'
        status = CommStatusNames[statusValue]
        lastHeartbeat = commStatus.lastHeartbeat || 0
      }
      return { status: status, lastHeartbeat: lastHeartbeat}
    }
    function updateEndpoint( update) {
      var endpoint = findEndpoint( update.id)
      if( endpoint) {
        if( update.hasOwnProperty( 'name'))
          endpoint.name = update.name
        if( update.hasOwnProperty( 'protocol'))
          endpoint.protocol = update.protocol
        if( update.hasOwnProperty( 'enabled'))
          endpoint.enabled = update.enabled
        if( update.hasOwnProperty( 'commStatus')) {
          endpoint.commStatus = getCommStatus( update.commStatus)
        }
      }
    }
    function removeEndpoint( id) {
      var index = findEndpointIndex( id)
      if( index >= 0)
        return $scope.endpoints.splice(index,1)
    }

    function messageEndpoints( endpoints) {
      endpoints.forEach( function( endpoint) {
        updateEndpoint( endpoint)
      })
    }

    function messageEndpoint( endpointNotification) {
      var ep = endpointNotification.endpoint
      switch( endpointNotification.eventType) {
        case 'ADDED':
          ep.commStatus = getCommStatus( ep.commStatus)
          $scope.endpoints.push( ep)
          break;
        case 'MODIFIED':
          updateEndpoint( endpointNotification.endpoint)
          break;
        case 'REMOVED':
          removeEndpoint( endpointNotification.endpoint)
          break;
      }
    }

    rest.get( '/models/1/endpoints', 'endpoints', $scope, function(data){
      var endpointIds = data.map( function(endpoint){ return endpoint.id})
      $scope.endpoints.forEach( function(endpoint){
        endpoint.commStatus = getCommStatus( endpoint.commStatus)
      })
      subscription.subscribe(
        {subscribeToEndpoints: {'endpointIds': endpointIds}},
        $scope,
        function( subscriptionId, messageType, endpointNotification){
          switch( messageType) {
            case "endpoints": messageEndpoints( endpointNotification); break; // subscription return.
            case "endpoint": messageEndpoint( endpointNotification); break;   // subscribe push
            default:
              console.error( 'EndpointController.subscription unknown message type "' + messageType + '"')
          }
          $scope.$digest()
        },
        function( messageError, message){
          console.error( 'EndpointController.subscription error: ' + messageError)
        })

    });
  }]).

  directive( 'gbEndpoints', function(){
    return {
      restrict: 'E', // Element name
      // This HTML will replace the directive.
      replace: true,
      transclude: true,
      scope: true,
      templateUrl: 'template/endpoint/endpoints.html',
      controller: 'gbEndpointsController'
    }
  }).
  filter('gbCommStatusIcon', function() {
    function getCss( enabled, statusString) {
      if( enabled)
        return 'gb-comms-enabled-' + statusString
      else
        return 'gb-comms-disabled-' + statusString
    }
    return function(status, enabled) {
      var klass
      switch( status) {
        case 'Up': klass = 'glyphicon glyphicon-arrow-up ' + getCss( enabled, 'up'); break;
        case 'Down': klass = 'glyphicon glyphicon-arrow-down ' + getCss( enabled, 'down'); break;
        case 'Error': klass = 'glyphicon glyphicon-exclamation-sign ' + getCss( enabled, 'error'); break;
        case 'Unknown': klass = 'glyphicon glyphicon-question-sign ' + getCss( enabled, 'unknown'); break;
        default:
          klass = 'glyphicon glyphicon-question-sign ' + getCss( enabled, 'unknown');
      }
      return klass
    };
  });

