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
 *
 */



angular.module('greenbus.views.event', ['greenbus.views.subscription']).

  controller('gbAlarmsController', ['$scope', '$attrs', 'subscription', function( $scope, $attrs, subscription) {
    $scope.loading = true
    $scope.alarms = []
    $scope.limit = Number( $attrs.limit || 20);

    function onAlarm( subscriptionId, type, alarm) {
      if( angular.isArray( alarm)) {
        console.log( 'alarmService onAlarm length=' + alarm.length)
        $scope.alarms = alarm.concat( $scope.alarms)
      } else {
        console.log( 'alarmService onAlarm ' + alarm.id + ' "' + alarm.state + '"' + ' "' + alarm.event.message + '"')
        $scope.alarms.unshift( alarm)
      }
      while( $scope.alarms.length > $scope.limit)
        $scope.alarms.pop()
      $scope.loading = false
      $scope.$digest()
    }

    function onError( error, message) {

    }

    var request = {
      subscribeToActiveAlarms: {
        limit: $scope.limit
      }
    }
    return subscription.subscribe( request, $scope, onAlarm, onError)
  }]).

  controller('gbEventsController', ['$scope', '$attrs', 'subscription', function( $scope, $attrs, subscription) {
    $scope.loading = true
    $scope.events = []
    $scope.limit = Number( $attrs.limit || 20);

    $scope.onEvent = function( subscriptionId, type, event) {
      if( angular.isArray( event)) {
        console.log( 'eventService onEvent length=' + event.length)
        $scope.events = event.concat( $scope.events)
      } else {
        console.log( 'eventService onEvent ' + event.id + ' "' + event.entity + '"' + ' "' + event.message + '"')
        $scope.events.unshift( event)
      }
      while( $scope.events.length > $scope.limit)
        $scope.events.pop()
      $scope.loading = false
      $scope.$digest()
    }

    $scope.onError = function( error, message) {

    }

    var request = {
      subscribeToRecentEvents: {
        eventTypes: [],
        limit: $scope.limit
      }
    }
    return subscription.subscribe( request, $scope, $scope.onEvent, $scope.onError)
  }]).

  directive( 'gbAlarms', function(){
    return {
      restrict: 'E', // Element name
      // This HTML will replace the alarmBanner directive.
      replace: true,
      transclude: true,
      scope: true,
      templateUrl: 'template/event/alarms.html',
      controller: 'gbAlarmsController',
      link: function(scope, element, attrs) {
        // Title element
        var title = angular.element(element.children()[0]),
        // Opened / closed state
          opened = true;

        // Clicking on title should open/close the alarmBanner
        title.bind('click', toggle);

        // Toggle the closed/opened state
        function toggle() {
          opened = !opened;
          element.removeClass(opened ? 'closed' : 'opened');
          element.addClass(opened ? 'opened' : 'closed');
        }

        // initialize the alarmBanner
        //toggle();
      }

    }
  }).
  directive( 'gbEvents', function(){
    return {
      restrict: 'E', // Element name
      // This HTML will replace the alarmBanner directive.
      replace: true,
      transclude: true,
      scope: true,
      templateUrl: 'template/event/events.html',
      controller: 'gbEventsController'
    }
  });

