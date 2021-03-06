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

function GreenbusViewsEventSortByTime( a, b) { return b.time - a.time }

angular.module('greenbus.views.event', ['greenbus.views.rest', 'greenbus.views.subscription', 'greenbus.views.pager']).

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
          failure.call( callee, ids, newState, ex, statusCode)
        }
      )

      return true
    }

    /**
     * Get the next page after startAfterId. Since events are normally sorted in reverse time,
     * the next page is going backwards in time.
     *
     * @param ids Array of alarm IDs
     * @param newState Examples; 'UNACK_SILENT','ACKNOWLEDGED'
     */
    function pageNext( startAfterId, limit, success, failure) {
      return pageDo( startAfterId, limit, success, failure, true)
    }

    /**
     * Get the next page after startAfterId. Since events are normally sorted in reverse time,
     * the previous page is going forwards in time.
     *
     * @param startAfterId
     * @param limit Number of items to get
     * @param success Success callback
     * @param failure Failure callback
     */
    function pagePrevious( startAfterId, limit, success, failure) {
      return pageDo( startAfterId, limit, success, failure, false)
    }

    /**
     *
     * @param startAfterId
     * @param limit Number of items to get
     * @param success Success callback
     * @param failure Failure callback
     * @param latest boolean T: paging backwards in time, F: paging forwards in time.
     */
    function pageDo( startAfterId, limit, success, failure, latest) {

      var url = '/models/1/alarms?startAfterId=' + startAfterId + '&limit=' + limit
      if( latest === false)
        url +=  '&latest=false'

      rest.get( url, null, null,
        function( data) {
          success( data)
        },
        function( ex, statusCode, headers, config){
          console.log( 'alarmRest ERROR pageNext with URL: "' + url + '". Status: ' + statusCode + 'Exception: ' + ex.exception + ' - ' + ex.message)
          failure( startAfterId, limit, ex, statusCode)
        }
      )

      return true
    }

    /**
     * Public API
     */
    return {
      update: update,
      pageNext: pageNext,
      pagePrevious: pagePrevious
    }
  }]).

  factory('eventRest', ['rest', function( rest) {

    /**
     * Get the next page after startAfterId. Since events are normally sorted in reverse time,
     * the next page is going backwards in time. 
     *  
     * @param ids Array of alarm IDs
     * @param newState Examples; 'UNACK_SILENT','ACKNOWLEDGED'
     */
    function pageNext( startAfterId, limit, success, failure) {
      return pageDo( startAfterId, limit, success, failure, true)
    }

    /**
     * Get the next page after startAfterId. Since events are normally sorted in reverse time,
     * the previous page is going forwards in time.
     *
     * @param startAfterId
     * @param limit Number of items to get
     * @param success Success callback
     * @param failure Failure callback
     */
    function pagePrevious( startAfterId, limit, success, failure) {
      return pageDo( startAfterId, limit, success, failure, false)
    }
    
    /**
     *
     * @param startAfterId 
     * @param limit Number of items to get
     * @param success Success callback
     * @param failure Failure callback
     * @param latest boolean T: paging backwards in time, F: paging forwards in time.
     */
    function pageDo( startAfterId, limit, success, failure, latest) {

      var url = '/models/1/events?startAfterId=' + startAfterId + '&limit=' + limit
      if( latest === false)
        url +=  '&latest=false'
      
      rest.get( url, null, null,
        function( data) {
          success( data)
        },
        function( ex, statusCode, headers, config){
          console.log( 'eventRest ERROR pageNext with URL: "' + url + '". Status: ' + statusCode + 'Exception: ' + ex.exception + ' - ' + ex.message)
          failure( startAfterId, limit, ex, statusCode)
        }
      )

      return true
    }


    /**
     * Public API
     */
    return {
      pageNext: pageNext,
      pagePrevious: pagePrevious
    }
  }]).

  /**
   * Adds _updateState to events
   *   'updating' - Waiting on reply from POST request.
   *   'removing' - Waiting on reply from POST REMOVED request.
   *   'none' - Not waiting on anything
   */
  factory('alarmWorkflow', ['alarmRest', function( alarmRest) {
    var serviceName = 'alarmWorkflow.updateRequest'

    /**
     * Operator is updating one or more alarm states
     * @param ids Alarm IDs
     * @param newState
     * @param subscriptionView
     */
    function updateRequest( subscriptionView, ids, newState) {
      if( ! ids || ids.length === 0)
        return false

      return alarmRest.update( ids, newState, subscriptionView, subscriptionView.onMessage, subscriptionView.onUpdateFailure)
    }

    function silence( subscriptionView, alarm) {
      var requestSucceeded = false
      if( alarm.state === 'UNACK_AUDIBLE') {
        if( updateRequest( subscriptionView, [alarm.id], 'UNACK_SILENT')) {
          alarm._updateState = 'updating' // TODO: what if already updating?
          requestSucceeded = true
        }
      }
      return requestSucceeded
    }

    function acknowledge( subscriptionView, alarm) {
      var requestSucceeded = false
      if( alarm.state === 'UNACK_AUDIBLE' || alarm.state === 'UNACK_SILENT') {
        if( updateRequest( subscriptionView, [alarm.id], 'ACKNOWLEDGED')) {
          alarm._updateState = 'updating' // TODO: what if already updating?
          requestSucceeded = true
        }
      }
      return requestSucceeded
    }

    function remove( subscriptionView, alarm) {
      var requestSucceeded = false
      if( alarm.state === 'ACKNOWLEDGED' && alarm._updateState !== 'removing') {
        if( updateRequest( subscriptionView, [alarm.id], 'REMOVED')) {
          alarm._updateState = 'removing' // TODO: what if already updating?
          requestSucceeded = true
        }
      }
      return requestSucceeded
    }



    var filters = {
      isSelected: function( alarm) {
        return alarm._checked === 1
      },
      isSelectedAndUnackAudible: function( alarm) {
        return alarm._checked === 1 && alarm.state === 'UNACK_AUDIBLE' && alarm._updateState !== 'updating'
      },
      isSelectedAndUnack: function( alarm) {
        return alarm._checked === 1 && ( alarm.state === 'UNACK_AUDIBLE' || alarm.state === 'UNACK_SILENT') && alarm._updateState !== 'updating'
      },
      isSelectedAndRemovable: function( alarm) {
        return alarm._checked === 1 && alarm.state === 'ACKNOWLEDGED' && alarm._updateState !== 'removing'
      }
    }
    function getId( alarm) { return alarm.id }


    function updateSelected( subscriptionView, notification, filter, newState, newUpdateState, allSelectedAreNotValidMessage, someSelectedAreNotValidMessage) {
      var requestSucceeded = false,
          selectedAndValid = subscriptionView.filter( filter)

      if( selectedAndValid.length > 0) {
        var ids = selectedAndValid.map( getId)
        selectedAndValid.forEach( function( a) { a._updateState = newUpdateState})
        if( someSelectedAreNotValidMessage) {
          var selected = subscriptionView.filter( filters.isSelected)
          if( selected.length > selectedAndValid.length)
            notification( 'info', someSelectedAreNotValidMessage, 5000)
        }
        requestSucceeded = updateRequest( subscriptionView, ids, newState)
      } else {
        notification( 'info', allSelectedAreNotValidMessage, 5000)
      }
      return requestSucceeded
    }

    function silenceSelected( subscriptionView, notification) { return updateSelected( subscriptionView, notification, filters.isSelectedAndUnackAudible, 'UNACK_SILENT', 'updating', 'No audible alarms are selected.') }
    function acknowledgeSelected( subscriptionView, notification) { return updateSelected( subscriptionView, notification, filters.isSelectedAndUnack, 'ACKNOWLEDGED', 'updating', 'No unacknowledged alarms are selected.') }
    function removeSelected( subscriptionView, notification) { return updateSelected( subscriptionView, notification, filters.isSelectedAndRemovable, 'REMOVED', 'removing', 'No acknowledged alarms are selected.', 'Unacknowledged alarms were not removed.') }


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

  controller('gbAlarmsController', ['$scope', '$attrs', 'rest', 'subscription', 'alarmWorkflow', 'alarmRest', '$timeout', function( $scope, $attrs, rest, subscription, alarmWorkflow, alarmRest, $timeout) {
    $scope.loading = true
    $scope.limit = Number( $attrs.limit || 20);
    var subscriptionView = new GBAlarmSubscriptionView( $scope.limit, $scope.limit * 4, undefined, GreenbusViewsEventSortByTime)
    $scope.alarms = subscriptionView.items
    // Paging
    $scope.pageState = GBSubscriptionViewState.FIRST_PAGE
    $scope.newItems = undefined
    // Alarm workflow
    $scope.selectAllState = 0
    $scope.searchText = ''
    $scope.notification = undefined // {type: 'danger', message: ''}  types: success, info, warning, danger
    $scope.notificationTask = undefined // $timeout task

    // Paging functions
    //
    function updatePageState( state) {
      $scope.pageState = state
      if( state === GBSubscriptionViewState.FIRST_PAGE)
        $scope.newItems = undefined
    }
    function pageNotify( state, oldItems) {
      updatePageState( state)
      oldItems.forEach( function( i) {
        if( i._checked)
          $scope.selectItem( i, 0) // 0: unchecked. Selection needs to decrement its select count.
      })
    }
    $scope.pageFirst = function() {
      var state = subscriptionView.pageFirst()
      updatePageState( state)
    }
    $scope.pageNext = function() {
      var state = subscriptionView.pageNext( alarmRest, pageNotify)
      updatePageState( state)
    }
    $scope.pagePrevious = function() {
      var state = subscriptionView.pagePrevious( alarmRest, pageNotify)
      updatePageState( state)
    }


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


    $scope.silence = function( alarm) { alarmWorkflow.silence( subscriptionView, alarm) }
    $scope.acknowledge = function( alarm) { alarmWorkflow.acknowledge( subscriptionView, alarm) }
    $scope.remove = function( alarm) { alarmWorkflow.remove( subscriptionView, alarm) }

    $scope.silenceSelected = function() { alarmWorkflow.silenceSelected( subscriptionView, setNotification) }
    $scope.acknowledgeSelected = function() { alarmWorkflow.acknowledgeSelected( subscriptionView, setNotification) }
    $scope.removeSelected = function() { alarmWorkflow.removeSelected( subscriptionView, setNotification) }

    // Called by selection
    $scope.selectAllChanged = function( state) {
      $scope.selectAllState = state
      return state
    }

    function onMessage( subscriptionId, type, alarms) {
      var removedAlarms = subscriptionView.onMessage( alarms)
      removedAlarms.forEach( function( a) {
        if( a._checked)
          $scope.selectItem( a, 0) // 0: unchecked. Selection needs to decrement its select count.
      })

      if( $scope.pageState !== GBSubscriptionViewState.FIRST_PAGE)
        $scope.newItems = 'New alarms'

      $scope.loading = false
      $scope.$digest()
    }

    function onError( error, message) {

    }

    var subscribeToAlarms = {
      name: 'SubscribeToAlarms',
      limit: $scope.limit
    }

    // Id is accessed by demo script to push alarms.
    $scope._subscribeToAlarmsId = subscription.subscribe( subscribeToAlarms, $scope, onMessage, onError)
  }]).

  controller('gbEventsController', ['$scope', '$attrs', 'subscription', 'eventRest', function( $scope, $attrs, subscription, eventRest) {
    $scope.loading = true
    $scope.limit = Number( $attrs.limit || 20);
    var subscriptionView = new GBSubscriptionView( $scope.limit, $scope.limit * 4, undefined, GreenbusViewsEventSortByTime)
    $scope.events = subscriptionView.items
    $scope.pageState = GBSubscriptionViewState.FIRST_PAGE
    $scope.newItems = undefined

    // Paging functions
    //
    function updatePageState( state) {
      $scope.pageState = state
      if( state === GBSubscriptionViewState.FIRST_PAGE)
        $scope.newItems = undefined
    }
    function pageNotify( state, oldItems) {
      updatePageState( state)
    }
    $scope.pageFirst = function() {
      var state = subscriptionView.pageFirst()
      updatePageState( state)
    }
    $scope.pageNext = function() {
      var state = subscriptionView.pageNext( eventRest, pageNotify)
      updatePageState( state)
    }
    $scope.pagePrevious = function() {
      var state = subscriptionView.pagePrevious( eventRest, pageNotify)
      updatePageState( state)
    }


    $scope.onEvent = function( subscriptionId, type, event) {
      subscriptionView.onMessage( event)
      if( $scope.pageState !== GBSubscriptionViewState.FIRST_PAGE)
        $scope.newItems = 'New events'
      $scope.loading = false
      $scope.$digest()
    }

    $scope.onError = function( error, message) {

    }

    var subscribeToEvents = {
      name: 'SubscribeToEvents',
      //eventTypes: [],
      limit: $scope.limit
    }
    // Id is accessed by demo script to push events.
    $scope._subscribeToEventsId = subscription.subscribe( subscribeToEvents, $scope, $scope.onEvent, $scope.onError)

  }]).

  controller('gbAlarmsAndEventsController', ['$scope', '$attrs', 'subscription', 'alarmWorkflow', function( $scope, $attrs, subscription, alarmWorkflow) {
    $scope.loading = true
    $scope.limit = Number( $attrs.limit || 20);
    $scope.alarms = []
    $scope.events = []
    var gbAlarms = new GBAlarms( $scope.limit, $scope.alarms),
        gbEvents = new GBEvents( $scope.limit, $scope.events),
        tab = 'alarms',
        newCounts = {
          alarms: -1,
          events: 0
        }


    $scope.newCounts = {
      alarms: '',
      events: ''
    }
    $scope.tabAlarms = function() {
      if( tab !== 'alarms') {
        tab = 'alarms'
        newCounts.alarms = -1
        newCounts.events = 0
        $scope.newCounts.alarms = ''
        $scope.newCounts.events = ''
      }
    }
    $scope.tabEvents = function() {
      if( tab !== 'events') {
        tab = 'events'
        newCounts.events = -1
        newCounts.alarms = 0
        $scope.newCounts.alarms = ''
        $scope.newCounts.events = ''
      }
    }

    $scope.silence = function( alarm) { alarmWorkflow.silence( gbAlarms, alarm) }
    $scope.acknowledge = function( alarm) { alarmWorkflow.acknowledge( gbAlarms, alarm) }
    $scope.remove = function( alarm) { alarmWorkflow.remove( gbAlarms, alarm) }

    function countUpdates( objOrArray) {
      if( angular.isArray( objOrArray))
        return objOrArray.length
      else
        return 1
    }
    function onAlarm( subscriptionId, type, alarms) {
      var updateCount = countUpdates( alarms)

      gbAlarms.onMessage( alarms)
      $scope.loading = false

      if( tab === 'events') {
        newCounts.alarms += updateCount
        $scope.newCounts.alarms = newCounts.alarms.toString()
      }

      $scope.$digest()
    }
    function onAlarmError( error, message) {
      console.error( 'gbAlarmsAndEventsController onAlarmError ' + error + ', ' + message)
    }

    function onEvent( subscriptionId, type, events) {
      var updateCount = countUpdates( events)

      gbEvents.onMessage( events)
      $scope.loading = false

      if( tab === 'alarms') {
        newCounts.events += updateCount
        $scope.newCounts.events = newCounts.events.toString()
      }

      $scope.$digest()
    }
    function onEventError( error, message) {
      console.error( 'gbAlarmsAndEventsController onEventError ' + error + ', ' + message)
    }

    var subscribeToAlarms = {
      name: 'SubscribeToAlarms',
      //eventTypes: [],
      limit: $scope.limit
    }
    // Id is accessed by demo script to push alarms.
    $scope._subscribeToAlarmsId = subscription.subscribe( subscribeToAlarms, $scope, onAlarm, onAlarmError)

    var subscribeToEvents = {
      name: 'SubscribeToEvents',
      //eventTypes: [],
      limit: $scope.limit
    }
    // Id is accessed by demo script to push events.
    $scope._subscribeToEventsId = subscription.subscribe( subscribeToEvents, $scope, onEvent, onEventError)

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

      if( updateState === 'updating')
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

      if( updateState === 'removing')
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

