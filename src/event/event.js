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

  factory('alarmRest', ['rest', function( rest) {

    /**
     *
     * @param ids Array of alarm IDs
     * @param newState Examples; 'UNACK_SILENT','ACKNOWLEDGED'
     */
    function update( ids, newState, callee, success, failure) {
      if( ! ids || ids.length === 0)
        return false

      var arg = {
        state: newState,
        ids: ids
      }

      rest.post( '/models/1/alarms', arg, null, null,
        function( data) {
          success.call( callee, data)
        },
        function( ex, statusCode, headers, config){
          console.log( 'alarmRest ERROR updating alarms with ids: ' + ids.join() + ' to state "' + newState + '". Exception: ' + ex.exception + ' - ' + ex.message)
          failure.call( callee, ids, newState)
        }
      )

      return true
    }


    /**
     * Public API
     */
    return {
      update: update
    }
  }]).

  factory('alarmWorkflow', ['alarmRest', function( alarmRest) {
    var serviceName = 'alarmWorkflow.updateRequest'

    /**
     * Operator is updating one or more alarm states
     * @param ids Alarm IDs
     * @param newState
     * @param gbAlarms
     */
    function updateRequest( ids, newState, gbAlarms) {
      if( ! ids || ids.length === 0)
        return

      alarmRest.update( ids, newState, gbAlarms, gbAlarms.onMessage, gbAlarms.onUpdateFailure)
    }

    function silence( alarm) {
      if( alarm.state === 'UNACK_AUDIBLE') {
        if( updateRequest( [alarm.id], 'UNACK_SILENT'))
          alarm.updateState = 'updating' // TODO: what if already updating?
      }
    }

    function acknowledge( alarm) {
      if( alarm.state === 'UNACK_AUDIBLE' || alarm.state === 'UNACK_SILENT') {
        if( updateRequest( [alarm.id], 'ACKNOWLEDGED'))
          alarm.updateState = 'updating' // TODO: what if already updating?
      }
    }

    function remove( alarm) {
      if( alarm.state === 'ACKNOWLEDGED' && alarm.updateState !== 'removing') {
        if( updateRequest( [alarm.id], 'REMOVED'))
          alarm.updateState = 'removing' // TODO: what if already updating?
      }
    }



    var filter = {
      isSelected: function( alarm) {
        return alarm.checked
      },
      isSelectedAndUnackAudible: function( alarm) {
        return alarm.checked && alarm.state === 'UNACK_AUDIBLE' && alarm.updateState !== 'updating'
      },
      isSelectedAndUnack: function( alarm) {
        return alarm.checked && ( alarm.state === 'UNACK_AUDIBLE' || alarm.state === 'UNACK_SILENT') && alarm.updateState !== 'updating'
      },
      isSelectedAndRemovable: function( alarm) {
        return alarm.checked && alarm.state === 'ACKNOWLEDGED' && alarm.updateState !== 'removing'
      }
    }
    function getId( alarm) { return alarm.id }


    function updateSelected( filter, newState, newUpdateState, allSelectedAreNotValidMessage, someSelectedAreNotValidMessage, gbAlarms, notification) {
      var selectedAndValid = this.alarms.filter( filter)

      if( selectedAndValid.length > 0) {
        var ids = selectedAndValid.map( getId)
        selectedAndValid.forEach( function( a) { a.updateState = newUpdateState})
        if( someSelectedAreNotValidMessage) {
          var selected = this.alarms.filter( filter.isSelected)
          if( selected.length > selectedAndValid.length)
            notification( 'info', someSelectedAreNotValidMessage, 5000)
        }
        updateRequest( ids, newState, gbAlarms)
      } else {
        notification( 'info', allSelectedAreNotValidMessage, 5000)
      }
    }

    function silenceSelected( gbAlarms, notification) { updateSelected( filter.isSelectedAndUnackAudible, 'UNACK_SILENT', 'updating', 'No audible alarms are selected.', gbAlarms, notification) }
    function acknowledgeSelected( gbAlarms, notification) { updateSelected( filter.isSelectedAndUnack, 'ACKNOWLEDGED', 'updating', 'No unacknowledged alarms are selected.', gbAlarms, notification) }
    function removeSelected( gbAlarms, notification) { updateSelected( filter.isSelectedAndRemovable, 'REMOVED', 'removing', 'No acknowledged alarms are selected.', 'Unacknowledged alarms were not removed.', gbAlarms, notification) }


    /**
     * Public API
     */
    return {
      silence: silence,
      acknowledge: acknowledge,
      remove: remove,
      silenceSelected: silenceSelected,
      acknowledgeSelected: acknowledgeSelected,
      removeSelected: removeSelected
    }
  }]).

  controller('gbAlarmsController', ['$scope', '$attrs', 'rest', 'subscription', '$timeout', function( $scope, $attrs, rest, subscription, $timeout) {
    $scope.loading = true
    $scope.limit = Number( $attrs.limit || 20);
    $scope.alarms = new GBAlarms( $scope.limit)
    $scope.selectAllState = 0
    $scope.searchText = ''
    $scope.notification = undefined // {type: 'danger', message: ''}  types: success, info, warning, danger
    $scope.notificationTask = undefined // $timeout task

    function setNotification( typ, message, timeout) {
      if( $scope.notificationTask) {
        $timeout.cancel( $scope.notificationTask)
        $scope.notificationTask = undefined
      }

      $scope.notification = {type: typ, message: message}

      if( timeout) {
        $scope.notificationTask = $timeout(function() {
          $scope.notification = undefined
          $scope.notificationTask = undefined
        }, timeout);
      }
    }


    $scope.silence = function( alarm) { alarmWorkflow.silence( alarm) }
    $scope.acknowledge = function( alarm) { alarmWorkflow.acknowledge( alarm) }
    $scope.remove = function( alarm) { alarmWorkflow.remove( alarm) }

    $scope.silenceSelected = function() { alarmWorkflow.silenceSelected( this.alarms, setNotification) }
    $scope.acknowledgeSelected = function() { alarmWorkflow.acknowledgeSelected( this.alarms, setNotification) }
    $scope.removeSelected = function() { alarmWorkflow.removeSelected( this.alarms, setNotification) }
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
      subscribeToEvents: {
        alarmsOnly: true,
        limit: $scope.limit
      }
    }

    function onMessage( subscriptionId, type, alarms) {
      var removedAlarms = $scope.alarms.onMessage( alarms)
      removedAlarms.forEach( function( a) {
        if( a.checked)
          $scope.selectItem( a, 0) // selection needs to decrement its select count.
      })

      $scope.loading = false
      $scope.$digest()
    }

    function onError( error, message) {

    }

    return subscription.subscribe( request, $scope, onMessage, onError)
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
      subscribeToEvents: {
        //eventTypes: [],
        limit: $scope.limit
      }
    }
    return subscription.subscribe( request, $scope, $scope.onEvent, $scope.onError)
  }]).

  controller('gbAlarmsAndEventsController', ['$scope', '$attrs', 'subscription', 'alarmWorkflow', function( $scope, $attrs, subscription, alarmWorkflow) {
    $scope.loading = true
    $scope.limit = Number( $attrs.limit || 20);
    $scope.alarms = new GBAlarms( $scope.limit)
    $scope.events = new GBEvents( $scope.limit)

    $scope.silence = function( alarm) { alarmWorkflow.silence( alarm) }
    $scope.acknowledge = function( alarm) { alarmWorkflow.acknowledge( alarm) }
    $scope.remove = function( alarm) { alarmWorkflow.remove( alarm) }


    function isAlarm( alarmOrEvent) {
      return alarmOrEvent.hasOwnProperty( 'state')
    }

    function getFirstObject( message) {
      if( angular.isArray( message)) {
        if( message.length > 0)
          return message[0]
        else
          return undefined
      } else
        return message
    }

    function onMessage( subscriptionId, type, eventsOrAlarms) {
      var firstObject = getFirstObject( eventsOrAlarms)
      if( firstObject === undefined)
        return

      if( isAlarm( firstObject)) {
        var removedAlarms = $scope.alarms.onMessage( eventsOrAlarms)
        removedAlarms.forEach( function( a) {
          if( a.checked)
            $scope.selectItem( a, 0) // selection needs to decrement its select count.
        })
      } else {
        $scope.events.onMessage( eventsOrAlarms)
      }

      $scope.loading = false
      $scope.$digest()
    }

    function onError( error, message) {

    }

    var request = {
      subscribeToEvents: {
        //eventTypes: [],
        limit: $scope.limit
      }
    }
    return subscription.subscribe( request, $scope, onMessage, onError)
  }]).

  directive( 'gbAlarms', function(){
    return {
      restrict: 'E', // Element name
      // This HTML will replace the alarmBanner directive.
      replace: true,
      transclude: true,
      scope: true,
      templateUrl: 'greenbus.views.template/event/alarms.html',
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
      templateUrl: 'greenbus.views.template/event/events.html',
      controller: 'gbEventsController'
    }
  }).
  directive( 'gbAlarmsAndEvents', function(){
    return {
      restrict: 'E', // Element name
      // This HTML will replace the alarmBanner directive.
      replace: true,
      transclude: true,
      scope: true,
      templateUrl: 'greenbus.views.template/event/alarmsAndEvents.html',
      controller: 'gbAlarmsAndEventsController'
    }
  }).

  filter('alarmAckClass', function() {
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
  filter('alarmRemoveClass', function() {
    return function(state, updateState) {
      var s
      switch( state) {
        case 'ACKNOWLEDGED': s = 'fa fa-trash gb-alarm-remove'; break;
        case 'REMOVED': s = 'fa fa-trash-o  gb-alarm-ack'; break;
        default: s = 'fa'; break;
      }

      if( updateState !== 'none')
        s += ' fa-spin'
      return s
    };
  }).
  filter('alarmRemoveButtonClass', function() {
    return function(state) {
      switch( state) {
        case 'ACKNOWLEDGED': return 'btn btn-default btn-xs'
        default: return '';
      }
    };
  }).
  filter('alarmAckButtonClass', function() {
    return function(state) {
      switch( state) {
        case 'UNACK_AUDIBLE': return 'btn btn-default btn-xs'
        case 'UNACK_SILENT': return 'btn btn-default btn-xs'
        default: return '';
      }
    };
  }).
  filter('alarmAckTitle', function() {
    return function(state) {
      switch( state) {
        case 'UNACK_AUDIBLE': return 'Acknowledge alarm'
        case 'UNACK_SILENT': return 'Acknowledge alarm'
        case 'ACKNOWLEDGED': return 'Acknowledged alarm'
        case 'REMOVED': return 'Removed'
        default: return 'Unknown state: ' + state
      }
    };
  }).
  filter('alarmRemoveTitle', function() {
    return function(state) {
      switch( state) {
        case 'ACKNOWLEDGED': return 'Remove alarm'
        case 'REMOVED': return 'Removed'
        default: return 'Unknown state: ' + state
      }
    };
  }).

  filter('alarmAudibleClass', function() {
    return function(state) {
      switch( state) {
        case 'UNACK_AUDIBLE': return 'fa fa-volume-up gb-alarm-unack'
        default: return 'fa'
      }
    };
  }).
  filter('alarmAudibleButtonClass', function() {
    return function(state) {
      switch( state) {
        case 'UNACK_AUDIBLE': return 'btn btn-default btn-xs'
        default: return ''
      }
    };
  }).
  filter('alarmAudibleTitle', function() {
    return function(state) {
      switch( state) {
        case 'UNACK_AUDIBLE': return 'Silence alarm'
        default: return ''
      }
    };
  })
;

