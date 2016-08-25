/**
 * Copyright 2014-2015 Green Energy Corp.
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


angular.module( 'greenbus.views.measurement',
  [
    'ui.router',
    'greenbus.views.subscription',
    'greenbus.views.navigation',
    'greenbus.views.equipment',
    'greenbus.views.rest',
    'greenbus.views.request',
    'greenbus.views.selection',
    'greenbus.views.point'
  ]).

  factory('pointIdToMeasurementHistoryMap', function() {
    return {};
  }).


/**
 * Multiple clients can subscribe to measurements for the same point using one server subscription.
 *
 * Give a point UUID, get the name and a subscription.
 * Each point may have multiple subscriptions
 *
 * @param subscription
 * @param pointIdToMeasurementHistoryMap - Map of point.id to MeasurementHistory
 * @constructor
 */
  factory('measurement', [ 'rest', 'subscription', 'pointIdToMeasurementHistoryMap', '$filter', '$timeout', function( rest, subscription, pointIdToMeasurementHistoryMap, $filter, $timeout) {
    var number = $filter('number'),
        lastSubscribeSuccessDigestTime = 0

    function formatMeasurementValue(value) {
      if( typeof value === 'boolean' || isNaN(value) || !isFinite(value) ) {
        return value
      } else {
        return number(value)
      }
    }

    /**
     *
     * @param scope The scope of the controller requesting the subscription.
     * @param point The Point with id and name
     * @param constraints time: Most recent milliseconds
     *                    size: Maximum number of measurements to query from the server
     *                          Maximum measurements to keep in Murts.dataStore
     * @param subscriber The subscriber object is used to unsubscribe. It is also the 'this' used
     *                   for calls to notify.
     * @param onMessage Optional function to be called each time measurements are added to array.
     *               The function is called with subscriber as 'this'.
     * @returns An array with measurements. New measurements will be appended as they come in.
     */
    function subscribeWithHistory(scope, point, constraints, subscriber, onMessage, onError) {
      console.log('measurement.subscribeWithHistory ')

      var measurementHistory = pointIdToMeasurementHistoryMap[point.id]
      if( !measurementHistory ) {
        measurementHistory = new MeasurementHistory(subscription, point)
        pointIdToMeasurementHistoryMap[point.id] = measurementHistory
      }

      return measurementHistory.subscribe(scope, constraints, subscriber, onMessage, onError)
    }

    /**
     *
     * @param point
     * @param subscriber
     */
    function unsubscribeWithHistory(point, subscriber) {
      console.log('measurement.unsubscribeWithHistory ')

      var measurementHistory = pointIdToMeasurementHistoryMap[point.id]
      if( measurementHistory )
        measurementHistory.unsubscribe(subscriber)
      else
        console.error('ERROR: meas.unsubscribe point.id: ' + point.id + ' was never subscribed.')
    }

    function onMeasurements(measurements, subscriber, onMessage) {
      measurements.forEach(function(pm) {
        pm.measurement.value = formatMeasurementValue(pm.measurement.value)
      })
      if( onMessage )
        onMessage.call(subscriber, measurements)
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
     * @param {Object} message.error - Same as error
     * @param {Object} message.jsError - Optional JSON error if there was a JSON parsing problem in the request.
     * @param {(object|array)} data - Data is usually undefined or null.
     */

    /**
     * Subscribe to measurements.
     *
     * @param {scope}     scope The scope of the controller requesting the subscription.
     * @param {array}     pointIds Array of point IDs
     * @param {number}    constraints size: Maximum number of measurements to query from the server
     *                                      Maximum measurements to keep in Murts.dataStore
     * @param {Object}    subscriber The subscriber object is used as 'this' for calls to notify.
     * @param {onMessage} onMessage Optional function to be called each time one measurement is received.
     *                              The function is called with subscriber as 'this'.
     * @param {onError}   onError Optional function called on errors.
     * @returns A subscriptionId used when calling unsubscribe
     */
    function subscribe(scope, pointIds, constraints, subscriber, onMessage, onError) {
      var digestThrottleTimer

      function throttleDigest() {
        var now = Date.now(),
            delta = now - lastSubscribeSuccessDigestTime

        if( delta >= 500) {
          if( digestThrottleTimer) {
            $timeout.cancel( digestThrottleTimer)
            digestThrottleTimer = undefined
          }
          lastSubscribeSuccessDigestTime = now
          scope.$digest()
        } else if( digestThrottleTimer === undefined ) {
          digestThrottleTimer = $timeout( function( ) {
            digestThrottleTimer = undefined
            lastSubscribeSuccessDigestTime = Date.now()
            scope.$digest()
          }, 500 - delta )
        }
      }

      //console.log('measurement.subscribe')
      return subscription.subscribe(
        {
          name: 'SubscribeToMeasurements',
          pointIds: pointIds,
        },
        scope,
        function(subscriptionId, type, measurements) {
          if( type === 'measurements' ) {
            onMeasurements(measurements, subscriber, onMessage)
            throttleDigest()
          } else {
            console.error('measurement.subscribe message of unknown type: "' + type + '"')
          }
        },
        function(error, message) {
          console.error('measurement.subscribe ERROR: ' + error + ', message: ' + message)
          if( onError) {
            onError.call( subscriber, error, message)
          }
        }
      )
    }

    function unsubscribe(subscriptionId) {
      subscription.unsubscribe(subscriptionId)
    }

    function getCommandsForPoints(pointIds) {
      return rest.post('/models/1/points/commands', pointIds)
    }


    /**
     * Public API
     */
    return {
      subscribeWithHistory:   subscribeWithHistory,
      unsubscribeWithHistory: unsubscribeWithHistory,
      subscribe:              subscribe,
      unsubscribe:            unsubscribe,
      getCommandsForPoints:   getCommandsForPoints
    }
  }]).

  controller('gbMeasurementsController', ['$scope', '$stateParams', 'rest', 'navigation', 'measurement', 'equipment', 'pointPageRest', 'request', '$timeout',
    function($scope, $stateParams, rest, navigation, measurement, equipment, pointPageRest, request, $timeout) {
      var currentSubscriptionId,
          self = this,
          microgridId       = $stateParams.microgridId,
          navigationElement = $stateParams.navigationElement,
          pageSize = Number( $scope.pageSize || 100),
          subscriptionView = new GBSubscriptionView( pageSize, pageSize * 4, undefined, GBNameSortAscending)

      $scope.points = subscriptionView.items
      $scope.pointsFiltered = []
      $scope.selectAllState = 0
      $scope.pageState = GBSubscriptionViewState.FIRST_PAGE
      $scope.alerts = []

      // Search
      $scope.searchText = ''
      $scope.sortColumn = 'name'
      $scope.reverse = false



      // Initialized from URL or menu click or both
      //
      if( ! navigationElement)
        return

      function findPoint(id) {
        var index = findPointIndex(id)
        return index >= 0 ? $scope.points[index] : null
      }

      function findPointIndex(id) {
        var i, point,
            length = $scope.points.length

        for( i = 0; i < length; i++ ) {
          point = $scope.points[i]
          if( point.id === id )
            return i
        }
        return -1
      }

      function findPointBy(testTrue) {
        var i, point,
            length = $scope.points.length

        for( i = 0; i < length; i++ ) {
          point = $scope.points[i]
          if( testTrue(point) )
            return point
        }
        return null
      }

      $scope.closeAlert = function(index) {
        if( index < $scope.alerts.length)
          $scope.alerts.splice(index, 1)
      }

      $scope.selectAllChanged = function(state) {
        $scope.selectAllState = state
      }

      $scope.chartAddPointById = function(id) {
        var point = findPoint(id)

        if( point )
          request.push('gb-chart.addChart', [point])
        else
          console.error('Can\'t find point by id: ' + id)
      }

      $scope.chartAddSelectedPoints = function() {
        // Add all measurements that are checked and visible.
        var points = $scope.pointsFiltered.filter(function(m) {
          return m._checked === 1
        })

        if( points.length > 0 ) {
          request.push('gb-chart.addChart', points)
        }
      }


      $scope.rowClasses = function(point) {
        return point.rowDetail ? 'gb-row-selected-detail animate-repeat'
          : point.rowSelected ? 'gb-point gb-row-selected animate-repeat'
          : point.commands ? 'gb-point gb-row-selectable animate-repeat'
          : 'gb-point animate-repeat'
      }
      $scope.togglePointRowById = function(id) {
        if( !id )
          return  // detail row doesn't have an id.

        var point, pointDetails,
            index = findPointIndex(id)
        if( index < 0 )
          return

        point = $scope.points[index]
        if( !point.commands )
          return

        if( point.rowSelected ) {
          $scope.points.splice(index + 1, 1)
          point.rowSelected = false
        } else {

          pointDetails = {
            point:      point,
            name:       point.name + ' ',
            rowDetail:  true,
            commands: point.commands
          }
          $scope.points.splice(index + 1, 0, pointDetails)
          point.rowSelected = true
        }

      }

      // Paging functions
      //
      function pageNotify( state, oldItems) {
        $scope.pageState = state
        subscribeToMeasurementsAndCommands()
      }
      $scope.pageFirst = function() {
        $scope.pageState = subscriptionView.pageFirst()
        // Always updates from cache, so no pageNotify. Update subscriptions now!
        subscribeToMeasurementsAndCommands()
      }
      $scope.pageNext = function() {
        $scope.pageState = subscriptionView.pageNext( pointPageRest, pageNotify)
        // If paged from cache, we don't see a pageNotify. Update subscriptions now!
        if( $scope.pageState !== GBSubscriptionViewState.PAGING_NEXT)
          subscribeToMeasurementsAndCommands()
      }
      $scope.pagePrevious = function() {
        $scope.pageState = subscriptionView.pagePrevious( pointPageRest, pageNotify)
        // If paged from cache, we don't see a pageNotify. Update subscriptions now!
        if( $scope.pageState !== GBSubscriptionViewState.PAGING_PREVIOUS)
          subscribeToMeasurementsAndCommands()
      }


      $scope.search = function(point) {
        var s = $scope.searchText.trim()
        if( s === undefined || s === null || s.length === 0 )
          return true
        s = s.toLowerCase()

        // If it's a rowDetail, we return true if the original row is show. Use the original row as the search filter.
        if( point.rowDetail )
          point = point.point

        var measValue         = '' + (point.currentMeasurement ? point.currentMeasurement.value : ''),
            foundCommandTypes = point.commandTypes && point.commandTypes.indexOf(s) !== -1,
            foundName         = point.name.toLowerCase().indexOf(s) !== -1

        return foundName || measValue.toLowerCase().indexOf(s) !== -1 || point.unit.toLowerCase().indexOf(s) !== -1 || point.pointType.toLowerCase().indexOf(s) !== -1 || foundCommandTypes
      }


      function subscribeToMeasurements(pointIds) {
        if( currentSubscriptionId) {
          measurement.unsubscribe( currentSubscriptionId)
          currentSubscriptionId = undefined
        }
        return measurement.subscribe($scope, pointIds, {}, self,
          function( measurements) {
            //console.log( 'onMeasurements ' + Date.now() + ' ' + measurements.map( function(pm) { return pm.point.id}).join())
            measurements.forEach(function(pm) {
              var point = findPoint(pm.point.id)
              if( point ) {
                //pm.measurement.value = formatMeasurementValue( pm.measurement.value )
                point.currentMeasurement = pm.measurement
              } else {
                console.error('MeasurementsController.onMeasurements could not find point.id = ' + pm.point.id)
              }
            })
          },
          function( error, message){
            console.error('gbMeasurementsController.subscribe ' + error + ', ' + JSON.stringify( message))
            $scope.alerts = [{ type: 'danger', message: error}]
          }
        )
      }


      function processPointsAndReturnPointIds(points) {
        var pointIds           = [],
            currentMeasurement = {
              value:        '-',
              time:         null,
              shortQuality: '',
              longQuality:  '',
              validity:     'NOTLOADED',
              expandRow:    false,
              commands:   undefined
            }
        points.forEach(function(point) {
          point.currentMeasurement = angular.extend({}, currentMeasurement)
          pointIds.push(point.id)
          if( typeof point.pointType !== 'string' )
            console.error('------------- point: ' + point.name + ' point.pointType "' + point.pointType + '" is empty or null.')
          if( typeof point.unit !== 'string' )
            point.unit = ''

        })
        return pointIds
      }

      // commandType: CONTROL, SETPOINT_INT, SETPOINT_DOUBLE, SETPOINT_STRING
      var exampleControls = [
        {
          commandType: 'CONTROL',
          displayName: 'NE_City.PCC_CB.Close',
          endpoint:    'ba01993f-d32c-43d4-9afc-8e5302ae5de8',
          id:          '65840820-aa1c-4215-b063-32affaddd465',
          name:        'NE_City.PCC_CB.Close'
        },
        {
          commandType: 'CONTROL',
          displayName: 'NE_City.PCC_CB.Open',
          endpoint:    'ba01993f-d32c-43d4-9afc-8e5302ae5de8',
          id:          '45673166-b55f-47e5-8f97-d495b7392a7a',
          name:        'NE_City.PCC_CB.Open'
        }
      ]

      /**
       * UUIDs are 36 characters long. The URL max is 2048
       * @param pointIds
       */
      function getCommandsForPoints(pointIds) {
        measurement.getCommandsForPoints( pointIds).then(
          function( response) {
            var point,
                data = response.data
            // data is map of pointId -> commands[]
            for( var pointId in data ) {
              point = findPoint(pointId)
              if( point ) {
                point.commands = data[pointId]
                point.commandTypes = getCommandTypes( point.commands).toLowerCase()
                console.log('commandTypes: ' + point.commandTypes)
              }
            }

          }
        )

      }

      function getCommandTypes( commands) {
        var control = '',
            setpoint = ''

        commands.forEach( function( c) {
          if( c.commandType.indexOf('SETPOINT') === 0) {
            if (setpoint.length === 0)
              setpoint = 'setpoint'
          } else {
            if( control.length === 0)
              control = 'control'
          }
        })

        return control && setpoint ? control + ',' + setpoint : control + setpoint
      }

      function subscribeToMeasurementsAndCommands() {
        if( $scope.points.length > 0) {
          var pointIds = processPointsAndReturnPointIds($scope.points)
          currentSubscriptionId = subscribeToMeasurements(pointIds)
          getCommandsForPoints(pointIds)
        } else {
          $scope.alerts = [{ type: 'info', message: 'No points found.'}]
        }
      }

      function getPointsAndSubscribeToMeasurements() {

        var promise = $scope.pointsPromise || equipment.getPoints( true, pageSize)
        promise.then(
          function( response) {
            subscriptionView.onMessage( response.data)
            //$scope.points = response.data
            subscribeToMeasurementsAndCommands()
            return response // for the then() chain
          },
          function( error) {
            console.error( 'gbMeasurementsController. Error ' + error.statusText)
            $scope.alerts = [{ type: 'danger', message: error.statusText}]
            return error
          }
        )
      }

      getPointsAndSubscribeToMeasurements()
    }
  ]).

  directive('gbMeasurements', function() {
    return {
      restrict:    'E', // Element name
      // The template HTML will replace the directive.
      replace:     true,
      scope:       {
        pointsPromise: '=?',
        pageSize: '=?'
      },
      templateUrl: 'greenbus.views.template/measurement/measurements.html',
      controller:  'gbMeasurementsController'
    }
  }).

  filter('validityIcon', function() {
    return function(validity) {
      switch( validity ) {
        case 'GOOD':
          return 'glyphicon glyphicon-ok validity-good';
        case 'QUESTIONABLE':
          return 'glyphicon glyphicon-question-sign validity-questionable';
        case 'NOTLOADED':
          return 'validity-notloaded'
        case 'INVALID':
          return 'glyphicon glyphicon-exclamation-sign validity-invalid';
        default:
          return 'glyphicon glyphicon-exclamation-sign validity-invalid';
      }
    };
  }).
  filter('pointTypeImage', function() {
    return function(type, unit) {
      var image

      if( unit === 'raw' ) {
        image = '../../images/pointRaw.png'
      } else {
        switch( type ) {
          case 'ANALOG':
            image = '/images/pointAnalog.png';
            break;
          case 'STATUS':
            image = '/images/pointStatus.png';
            break;
          default:
            image = '/images/pointRaw.png';
        }
      }

      return image
    };
  }).
  filter('pointTypeText', function() {
    return function(type, unit) {
      var text

      if( unit === 'raw' ) {
        text = 'raw point'
      } else {
        switch( type ) {
          case 'ANALOG':
            text = 'analog point';
            break;
          case 'STATUS':
            text = 'status point';
            break;
          default:
            text = 'point with unknown type';
        }
      }

      return text
    };
  })


