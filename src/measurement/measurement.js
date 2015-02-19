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


angular.module('greenbus.views.measurement', ['greenbus.views.subscription', 'greenbus.views.navigation', 'greenbus.views.rest', 'greenbus.views.request', 'greenbus.views.selection']).
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
  factory('measurement', ['subscription', 'pointIdToMeasurementHistoryMap', '$filter', function( subscription, pointIdToMeasurementHistoryMap, $filter) {
    var number = $filter( 'number' )

    function formatMeasurementValue( value ) {
      if( typeof value === 'boolean' || isNaN( value ) || !isFinite( value ) ) {
        return value
      } else {
        return number( value )
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
     * @param notify Optional function to be called each time measurements are added to array.
     *               The function is called with subscriber as 'this'.
     * @returns An array with measurements. New measurements will be updated as they come in.
     */
    function subscribeWithHistory(scope, point, constraints, subscriber, notify) {
      console.log('measurement.subscribeWithHistory ')

      var measurementHistory = pointIdToMeasurementHistoryMap[ point.id]
      if( !measurementHistory ) {
        measurementHistory = new MeasurementHistory(subscription, point)
        pointIdToMeasurementHistoryMap[ point.id] = measurementHistory
      }

      return measurementHistory.subscribe(scope, constraints, subscriber, notify)
    }

    /**
     *
     * @param point
     * @param subscriber
     */
    function unsubscribeWithHistory(point, subscriber) {
      console.log('measurement.unsubscribeWithHistory ')

      var measurementHistory = pointIdToMeasurementHistoryMap[ point.id]
      if( measurementHistory )
        measurementHistory.unsubscribe(subscriber)
      else
        console.error('ERROR: meas.unsubscribe point.id: ' + point.id + ' was never subscribed.')
    }

    function onMeasurements( measurements, subscriber, notify) {
      measurements.forEach( function( pm) {
        pm.measurement.value = formatMeasurementValue( pm.measurement.value )
      })
      if( notify)
        notify.call( subscriber, measurements)
    }

    /**
     * Subscribe to measurements.
     *
     * @param scope The scope of the controller requesting the subscription.
     * @param pointIds Array of point IDs
     * @param constraints size: Maximum number of measurements to query from the server
     *                          Maximum measurements to keep in Murts.dataStore
     * @param subscriber The subscriber object is used as 'this' for calls to notify.
     * @param notify Optional function to be called each time one measurement is received.
     *               The function is called with subscriber as 'this'.
     * @returns A subscription ID which can be used to unsubscribe.
     */
    function subscribe(scope, pointIds, constraints, subscriber, notify) {
      //console.log('measurement.subscribe')
      return subscription.subscribe(
        {
          subscribeToMeasurements: { 'pointIds': pointIds }
        },
        scope,
        function ( subscriptionId, type, measurements ) {
          if( type === 'measurements')
            onMeasurements( measurements, subscriber, notify)
          else
            console.error( 'measurement.subscribe message of unknown type: "' + type + '"' )
          scope.$digest()
        },
        function ( error, message ) {
          console.error( 'measurement.subscribe ERROR: ' + error + ', message: ' + message)
        }
      )
    }

    function unsubscribe( subscriptionId) {
      subscription.unsubscribe( subscriptionId)
    }



    /**
     * Public API
     */
    return {
      subscribeWithHistory:   subscribeWithHistory,
      unsubscribeWithHistory: unsubscribeWithHistory,
      subscribe: subscribe,
      unsubscribe: unsubscribe
    }
  }]).

  controller( 'gbMeasurementsController', ['$scope', '$window', '$routeParams', 'rest', 'navigation', 'subscription', 'measurement', 'request', '$timeout',
    function( $scope, $window, $routeParams, rest, navigation, subscription, measurement, request, $timeout) {
      var self = this
      $scope.points = []
      $scope.pointsFiltered = []
      $scope.selectAllState = 0

      // Search
      $scope.searchText = ''
      $scope.sortColumn = 'name'
      $scope.reverse = false

      var navId = $routeParams.navId,
          depth = rest.queryParameterFromArrayOrString( 'depth', $routeParams.depth ),
          equipmentIdsQueryParams = rest.queryParameterFromArrayOrString( 'equipmentIds', $routeParams.equipmentIds)

      function findPoint( id ) {
        var index = findPointIndex( id)
        return index >= 0 ? $scope.points[index] : null
      }

      function findPointIndex( id ) {
        var i, point,
            length = $scope.points.length

        for( i = 0; i < length; i++ ) {
          point = $scope.points[i]
          if( point.id === id )
            return i
        }
        return -1
      }

      function findPointBy( testTrue ) {
        var i, point,
            length = $scope.points.length

        for( i = 0; i < length; i++ ) {
          point = $scope.points[i]
          if( testTrue( point ) )
            return point
        }
        return null
      }

      $scope.selectAllChanged = function( state) {
        $scope.selectAllState = state
      }

      $scope.chartAddPointById = function( id) {
        var point = findPoint( id)

        if( point )
          request.push( 'gb-chart.addChart', [point])
        else
          console.error( 'Can\'t find point by id: ' + id)
      }

      $scope.chartAddSelectedPoints = function() {
        // Add all measurements that are checked and visible.
        var points = $scope.pointsFiltered.filter( function ( m ) {
          return m._checked === 1
        } )

        if( points.length > 0 ) {
          request.push( 'gb-chart.addChart', points)
        }
      }



      $scope.rowClasses = function( point) {
        return point.rowDetail ? 'gb-row-selected-detail animate-repeat'
          : point.rowSelected ? 'gb-point gb-row-selected animate-repeat'
          : point.commandSet ? 'gb-point gb-row-selectable animate-repeat'
          : 'gb-point animate-repeat'
      }
      $scope.togglePointRowById = function( id) {
        if( !id)
          return  // detail row doesn't have an id.

        var point, pointDetails,
            index = findPointIndex( id)
        if( index < 0)
          return

        point = $scope.points[index]
        if( ! point.commandSet)
          return

        if( point.rowSelected ) {
          $scope.points.splice( index + 1, 1)
          point.rowSelected = false
        } else {

          pointDetails = {
            point: point,
            name: point.name + ' ',
            rowDetail: true,
            commandSet: point.commandSet
          }
          $scope.points.splice( index + 1, 0, pointDetails)
          point.rowSelected = true
        }

      }


      $scope.search = function( point) {
        var s = $scope.searchText
        if( s === undefined || s === null || s.length === 0)
          return true
        s = s.toLowerCase()

        // If it's a rowDetail, we return true if the original row is show. Use the original row as the search filter.
        if( point.rowDetail)
          point = point.point

        var measValue = '' + (point.currentMeasurement ? point.currentMeasurement.value : ''),
            foundCommandTypes = point.commandTypes && point.commandTypes.indexOf(s)!==-1,
            foundName = point.name.toLowerCase().indexOf( s)!==-1

        return foundName || measValue.toLowerCase().indexOf(s)!==-1 || point.unit.toLowerCase().indexOf( s)!==-1 || point.pointType.toLowerCase().indexOf( s)!==-1 || foundCommandTypes
      }


      function onMeasurements( measurements ) {
        measurements.forEach( function( pm){
          var point = findPoint( pm.point.id )
          if( point ) {
            //pm.measurement.value = formatMeasurementValue( pm.measurement.value )
            point.currentMeasurement = pm.measurement
          } else {
            console.error( 'MeasurementsController.onPointMeasurement could not find point.id = ' + pm.point.id )
          }
        })
        $scope.$digest()
      }

      function subscribeToMeasurements( pointIds) {
        measurement.subscribe( $scope, pointIds, {}, self, onMeasurements)
      }


      function nameFromTreeNode( treeNode) {
        if( treeNode)
          return treeNode.label
        else
          return '...'
      }

      function getEquipmentIds( treeNode) {
        var result = []
        treeNode.children.forEach( function( node){
          if( node.containerType && node.containerType !== 'Sourced')
            result.push( node.id)
        })
        return result
      }
      function navIdListener( id, treeNode) {
        $scope.equipmentName = nameFromTreeNode( treeNode) + ' '
        var equipmentIds = getEquipmentIds( treeNode)
        var equipmentIdsQueryParams = rest.queryParameterFromArrayOrString( 'equipmentIds', equipmentIds )

        var delimeter = '?'
        var url = '/models/1/points'
        if( equipmentIdsQueryParams.length > 0) {
          url += delimeter + equipmentIdsQueryParams
          delimeter = '&'
          $scope.equipmentName = nameFromTreeNode( treeNode) + ' '
        }
        if( depth.length > 0)
          url += delimeter + depth

        rest.get( url, 'points', $scope, function(data) {
          // data is either a array of points or a map of equipmentId -> points[]
          // If it's an object, convert it to a list of points.
          if( angular.isObject( data)) {
            $scope.points = []
            for( var equipmentId in data) {
              $scope.points = $scope.points.concat( data[equipmentId])
            }
          }
          var pointIds = processPointsAndReturnPointIds( $scope.points)
          subscribeToMeasurements( pointIds)
          getPointsCommands( pointIds)
        })
      }

      function processPointsAndReturnPointIds( points) {
        var pointIds = [],
            currentMeasurement = {
              value: '-',
              time: null,
              shortQuality: '-',
              longQuality: '-',
              validity: 'NOTLOADED',
              expandRow: false,
              commandSet: undefined
            }
        points.forEach( function ( point ) {
          point.currentMeasurement = angular.extend( {}, currentMeasurement)
          pointIds.push( point.id )
          if( typeof point.pointType !== 'string')
            console.error( '------------- point: ' + point.name + ' point.pointType "' + point.pointType + '" is empty or null.' )
          if( typeof point.unit !== 'string')
            point.unit = ''

        })
        return pointIds
      }



      function notifyWhenEquipmentNamesAreAvailable( equipmentId) {
        $scope.equipmentName = nameFromEquipmentIds( $routeParams.equipmentIds) + ' '
      }

      function nameFromEquipmentIds( equipmentIds) {
        var result = ''
        if( equipmentIds) {

          if( angular.isArray( equipmentIds)) {
            equipmentIds.forEach( function( equipmentId, index) {
              var treeNode = navigation.getTreeNodeByEquipmentId( equipmentId, notifyWhenEquipmentNamesAreAvailable)
              if( index === 0)
                result += nameFromTreeNode( treeNode)
              else
                result += ', ' +nameFromTreeNode( treeNode)
            })
          } else {
            var treeNode = navigation.getTreeNodeByEquipmentId( equipmentIds, notifyWhenEquipmentNamesAreAvailable)
            result = nameFromTreeNode( treeNode)
          }
        }
        return result
      }

      // commandType: CONTROL, SETPOINT_INT, SETPOINT_DOUBLE, SETPOINT_STRING
      var exampleControls = [
        {commandType:  'CONTROL',
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

      var CommandRest = {
        select: function ( accessMode, commandIds, success, failure) {
          var arg = {
            accessMode: accessMode,
            commandIds: commandIds
          }
          rest.post( '/models/1/commandlock', arg, null, $scope, success, failure)
        },
        deselect: function( lockId, success, failure) {
          rest.delete( '/models/1/commandlock/' + lockId, null, $scope, success, failure)
        },
        execute: function( commandId, success, failure) {
          rest.post( '/models/1/commands/' + commandId, success, failure)
        }
      }

      /**
       * UUIDs are 36 characters long. The URL max is 2048
       * @param pointIds
       */
      function getPointsCommands( pointIds ) {
        var url = '/models/1/points/commands'

        rest.post( url, pointIds, null, $scope, function( data) {
          var point
          // data is map of pointId -> commands[]
          for( var pointId in data) {
            point = findPoint( pointId)
            if( point) {
              point.commandSet = new CommandSet( point, data[pointId], CommandRest, $timeout)
              point.commandTypes = point.commandSet.getCommandTypes().toLowerCase()
              console.log( 'commandTypes: ' + point.commandTypes)
            }
          }
        })

      }

      // 'NE_City.Big_Hotel.DR2_cntl'
      // 'NE_City.Big_Hotel.DR3_cntl'

      if( navId) {
        // If treeNode exists, it's returned immediately. If it's still being loaded,
        // navIdListener will be called when it's finally available.
        //
        var treeNode = navigation.getTreeNodeByMenuId( navId, navIdListener)
        if( treeNode)
          navIdListener( navId, treeNode)

      } else {

        var delimeter = '?'
        var url = '/models/1/points'
        if( equipmentIdsQueryParams.length > 0) {
          url += delimeter + equipmentIdsQueryParams
          delimeter = '&'
          $scope.equipmentName = nameFromEquipmentIds( $routeParams.equipmentIds) + ' '
        }
        if( depth.length > 0)
          url += delimeter + depth

        rest.get( url, 'points', $scope, function( data) {
          // data is either a array of points or a map of equipmentId -> points[]
          // If it's an object, convert it to a list of points.
          if( angular.isObject( data)) {
            $scope.points = []
            for( var equipmentId in data) {
              $scope.points = $scope.points.concat( data[equipmentId])
            }
          }

          var pointIds = processPointsAndReturnPointIds( $scope.points)
          subscribeToMeasurements( pointIds)
          getPointsCommands( pointIds)
        })
      }

    }
  ]).

  directive( 'gbMeasurements', function(){
    return {
      restrict: 'E', // Element name
      // The template HTML will replace the directive.
      replace: true,
      transclude: true,
      scope: true,
      templateUrl: 'greenbus.views.template/measurement/measurements.html',
      controller: 'gbMeasurementsController'
    }
  }).

  filter('validityIcon', function() {
    return function(validity) {
      switch( validity) {
        case 'GOOD': return 'glyphicon glyphicon-ok validity-good';
        case 'QUESTIONABLE': return 'glyphicon glyphicon-question-sign validity-questionable';
        case 'NOTLOADED': return 'validity-notloaded'
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

      if( unit === 'raw') {
        image = '../../images/pointRaw.png'
      } else {
        switch( type) {
          case 'ANALOG': image = '/images/pointAnalog.png'; break;
          case 'STATUS': image = '/images/pointStatus.png'; break;
          default: image = '/images/pointRaw.png';
        }
      }

      return image
    };
  }).
  filter('pointTypeText', function() {
    return function(type, unit) {
      var text

      if( unit === 'raw') {
        text = 'raw point'
      } else {
        switch( type) {
          case 'ANALOG': text = 'analog point'; break;
          case 'STATUS': text = 'status point'; break;
          default: text = 'point with unknown type';
        }
      }

      return text
    };
  })


