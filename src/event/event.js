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



angular.module('greenbus.views.event', ['greenbus.views.rest', 'greenbus.views.subscription']).

  controller('gbAlarmsController', ['$scope', '$attrs', 'rest', 'subscription', function( $scope, $attrs, rest, subscription) {
    $scope.loading = true
    $scope.alarms = []
//    $scope.alarmsFiltered = []
    $scope.limit = Number( $attrs.limit || 20);
    $scope.selectAllState = 0
    $scope.searchText = ''

    var alarmIdMap = {}


    function findById( id ) {
      var i, item,
          length = $scope.alarms.length

      for( i = 0; i < length; i++ ) {
        item = $scope.alarms[i]
        if( item.id === id )
          return item
      }
      return undefined
    }

    function sortByTime() {
      $scope.alarms.sort( function( a, b) { return b.event.time - a.event.time})
    }

    // alarm can be an array or one alarm.
    //
    function onAlarm( subscriptionId, type, alarm) {
      var existing

      if( angular.isArray( alarm)) {
        var newAlarms = []
        console.log( 'alarmService onAlarm length=' + alarm.length)
        alarm.forEach( function( a) {
          a.updateState = 'none'
          existing = alarmIdMap[a.id]
          if( existing)
            onUpdate( existing, a)
          else {
            newAlarms.push( a)
            alarmIdMap[a.id] = a
          }
        })
        $scope.alarms = newAlarms.concat( $scope.alarms)
      } else {
        console.log( 'alarmService onAlarm ' + alarm.id + ' "' + alarm.state + '"' + ' "' + alarm.event.message + '"')
        alarm.updateState = 'none'
        existing = alarmIdMap[alarm.id]
        if( existing)
          onUpdate( existing, alarm)
        else {
          $scope.alarms.unshift( alarm)
          alarmIdMap[alarm.id] = alarm
        }
      }

      while( $scope.alarms.length > $scope.limit) {
        var removed = $scope.alarms.pop();
        delete alarmIdMap[removed.id];
      }

      sortByTime()

      $scope.loading = false
      $scope.$digest()
    }

    function onError( error, message) {
      console.error( 'gbAlarmsController.onError ' + error + ', message: ' + message)

    }

    function onUpdate( alarm, update) {
      if( alarm) {

        if( update.state === 'REMOVED') {
          var i = $scope.alarms.indexOf( alarm)
          if( i >= 0)
            $scope.alarms.splice( i, 1);
          delete alarmIdMap[alarm.id];
        } else {
          alarm.state = update.state
          alarm.event = update.event
          alarm.updateState = 'none'
        }
      }
    }
    function onUpdates( alarms) {
      alarms.forEach( function( a) {
        onUpdate( findById( a.id), a)
      })
      sortByTime()
    }

    function updateRequest( ids, newState) {
      if( ! ids || ids.length === 0)
        return

      var arg = {
        state: newState,
        ids: ids
      }
      rest.post( '/models/1/alarms', arg, null, $scope,
        function( alarms) {
          onUpdates( alarms)
        },
        function( ex, statusCode, headers, config) {
          console.log( 'gbAlarmsController.updateRequest ERROR updating alarms with ids: ' + ids.join() + ' to state "' + newState + '". Exception: ' + ex.exception + ' - ' + ex.message)
        }
      )
    }

    $scope.silence = function( alarm) {
      if( alarm.state === 'UNACK_AUDIBLE') {
        alarm.updateState = 'updating' // TODO: what if already updating?
        updateRequest( [alarm.id], 'UNACK_SILENT')
      }
    }

    $scope.acknowledge = function( alarm) {
      if( alarm.state === 'UNACK_AUDIBLE' || alarm.state === 'UNACK_SILENT') {
        updateRequest( [alarm.id], 'ACKNOWLEDGED')
        alarm.updateState = 'updating' // TODO: what if already updating?
      }
    }

    function isSelectedAndUnackAudible( alarm) {
      return alarm.checked && alarm.state === 'UNACK_AUDIBLE'
    }
    function isSelectedAndUnack( alarm) {
      return alarm.checked && ( alarm.state === 'UNACK_AUDIBLE' || alarm.state === 'UNACK_SILENT')
    }
    function isSelectedAndNotRemoving( alarm) {
      return alarm.checked && alarm.state !== 'REMOVED' && alarm.updateState !== 'removing'
    }
    function getId( alarm) { return alarm.id }

    function updateSelected( filter, newState, newUpdateState) {
      var selected = $scope.alarms.filter( filter),
          ids = selected.map( getId)
      selected.forEach( function( a) { a.updateState = newUpdateState})
      updateRequest( ids, newState)
    }
    $scope.silenceSelected = function() { updateSelected( isSelectedAndUnackAudible, 'UNACK_SILENT', 'updating') }
    $scope.acknowledgeSelected = function() { updateSelected( isSelectedAndUnack, 'ACKNOWLEDGED', 'updating') }
    $scope.removeSelected = function() { updateSelected( isSelectedAndNotRemoving, 'REMOVED', 'removing') }
//    $scope.hitIt = function() {
//      var selected = $scope.alarms.filter( isSelectedAndUnack),
//          ids = selected.map( getId),
//          newState = 'ACKNOWLEDGED'
//      ids.push( '1234567890')
//      selected.forEach( function( a) { a.updateState = 'updating'})
//      updateRequest( ids, newState)
//    }

    // Called by selection
    $scope.selectAllChanged = function( state) {
      $scope.selectAllState = state
      return state
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
  }).

  filter('alarmStateClass', function() {
    return function(state, updateState) {
      var s
      switch( state) {
        case 'UNACK_AUDIBLE': s = 'fa fa-bell gb-alarm-unack'; break;
        case 'UNACK_SILENT': s = 'fa fa-bell gb-alarm-unack'; break;
        case 'ACKNOWLEDGED': s = 'fa fa-bell-slash-o  gb-alarm-ack'; break;
        case 'REMOVED': s = 'fa fa-trash-o  gb-alarm-ack'; break;
        default: s = 'fa fa-question-circle gb-alarm-unack'; break;
      }

      if( updateState !== 'none')
        s += ' fa-spin'
      return s
    };
  }).
  filter('alarmStateTitle', function() {
    return function(state) {
      switch( state) {
        case 'UNACK_AUDIBLE': return 'Unacknowledged audible'
        case 'UNACK_SILENT': return 'Unacknowledged'
        case 'ACKNOWLEDGED': return 'Acknowledged'
        case 'REMOVED': return 'Removed'
        default: return 'Unknown state: ' + state
      }
    };
  }).

  filter('alarmAudibleClass', function() {
    return function(state) {
      switch( state) {
        case 'UNACK_AUDIBLE': return 'fa fa-volume-up gb-alarm-unack'
        case 'UNACK_SILENT': return 'fa'
        case 'ACKNOWLEDGED': return 'fa'
        case 'REMOVED': return 'fa'
        default: return 'fa fa-question-circle gb-alarm-unack'
      }
    };
  }).
  filter('alarmAudibleTitle', function() {
    return function(state) {
      switch( state) {
        case 'UNACK_AUDIBLE': return 'Unacknowledged audible'
        case 'UNACK_SILENT': return 'Unacknowledged'
        case 'ACKNOWLEDGED': return 'Acknowledged'
        case 'REMOVED': return 'Removed'
        default: return 'Unknown state: ' + state
      }
    };
  })
;

