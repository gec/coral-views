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


/**
 * A piece of equipment may have multiple tabs including: Measurements, Properties (aka. key/value), Schematic, etc.
 */
angular.module('greenbus.views.equipment', [ 'ui.router', 'greenbus.views.rest']).

  factory('equipment', [ '$stateParams', '$q', 'rest', function( $stateParams, $q, rest) {

    var exports = {}

    // Common Types - common to Equipment and Points. Not exported.
    var CT = {
      AGGREGATE: 'Aggregate',
      UNKNOWN: 'Unknown'
    }
    // Equipment Types
    exports.ET = {
      AGGREGATE: CT.AGGREGATE,
      CHP: 'CHP',
      CUSTOMER_BREAKER: 'CustomerBreaker',
      ESS: 'ESS',
      GRID: 'Grid',
      LOAD: 'Load',
      PCC: 'PCC',
      POI: 'POI',
      PV: 'PV',
      UNKNOWN: CT.UNKNOWN
    }
    // Point Types
    exports.PT = {
      AGGREGATE: CT.AGGREGATE,
      BREAKER_STATUS: 'BreakerStatus', // Closed (true), Open (false)
      CHP_POWER_AGGREGATE: 'CHPAggregate',
      DEMAND_CHARGE_SOURCE: 'DemandChargeSource',
      ESS_MODE: 'ESSMode',
      ESS_POWER: 'OutputPower',
      ESS_POWER_AGGREGATE: 'ESSAggregate',
      FLOW_DIRECTION: 'FlowDirection',
      FREQUENCY_SOURCE: 'FreqSource',
      LOAD: 'LoadPower',
      LOAD_AGGREGATE: 'LoadAggregate',
      MODE_STATE: 'ModeState',
      POWER: 'DemandPower',           // Import (+), Export (-)
      POWER_AGGREGATE: 'DemandPowerAggregate',
      POWER_FACTOR: 'PowerFactor',
      DCM_TARGET_POWER: 'DCMTargetPower',
      PV_POWER_AGGREGATE: 'PVAggregate',
      UNKNOWN: CT.UNKNOWN
    }


    /**
     *
     * @param collapsePointsToArray If true, points will always be returned as a list.
     * @returns {Promise}
     */
    exports.getPointsForEquipmentIds = function(equipmentIds, collapsePointsToArray, limit, startAfterId, ascending) {
      var equipmentIdsQueryParams = rest.queryParameterFromArrayOrString('equipmentIds', equipmentIds),
          depth = rest.queryParameterFromArrayOrString('depth', '9999'),
          startAfter = rest.queryParameterFromArrayOrString('startAfterId', startAfterId)


      var delimeter = '?'
      var url = '/models/1/points'

      if( equipmentIdsQueryParams.length > 0 ) {
        url += delimeter + equipmentIdsQueryParams
        delimeter = '&'
      }
      if( depth.length > 0 ) {
        url += delimeter + depth
        delimeter = '&'
      }
      if( limit !== undefined && limit > 0)
        url += delimeter + 'limit=' + limit
      if( startAfter.length > 0 )
        url += delimeter + startAfter
      if( ascending === false) // don't add if undefined or null!
        url += delimeter + 'ascending=false'

      return rest.get(url).then(
          function( response) {
            var points = [],
                data = response.data

            // data is either a array of points or a map of equipmentId -> points[]
            // If it's an object, convert it to a list of points.
            if( collapsePointsToArray && angular.isObject(data) ) {
              for( var equipmentId in data ) {
                points = points.concat(data[equipmentId])
              }
            } else {
              points = data
            }
            return {data: points}
          },
          function( error) {
            return error
          }

      )
    }

    /**
     *
     * @param collapsePointsToArray If true, points will always be returned as a list.
     * @returns {Promise}
     */
    exports.getPoints = function( collapsePointsToArray, limit, startAfterId, ascending) {
      var navigationElement = $stateParams.navigationElement

      // Initialized from URL or menu click or both
      //
      if( ! navigationElement)
        return $q.when( [])

      var equipmentIds = navigationElement.equipmentIds

      return exports.getPointsForEquipmentIds(equipmentIds, collapsePointsToArray, limit, startAfterId, ascending)

    }

    /**
     * Get equipments for microgrid with ALL of the given types (i.e. types anded together).
     *
     * @param microgridId Search one microgrid for equipments.
     * @param equipmentTypes Array of resource types (or single resource type) found directly under uGrid.
     * @param callee Use callee for 'this' when calling success or failure
     * @param success Success callback
     * @param failure Failure callback
     */
    exports.getEquipmentsWithTypesAnd = function( microgridId, equipmentTypes, callee, success, failure) {
      if( ! microgridId || microgridId === '' || angular.isArray( microgridId)) {
        console.error('equipment.getEquipmentsWithTypesAnd ERROR invalid microgridId = "' + microgridId + '"')
        return false
      }

      function filterHasAllEquipmentTypes( equipment) {
        var hasAllTypes = true
        equipmentTypes.forEach( function( t) { if( equipment.types.indexOf( t) < 0) hasAllTypes = false})
        return hasAllTypes
      }

      var equipmentIdsQueryString = rest.queryParameterFromArrayOrString( 'childTypes', equipmentTypes),
          url = '/models/1/equipment/' + microgridId + '/descendants?depth=0&' + equipmentIdsQueryString
  
      rest.get( url, null, null,
          function( data) {
            var equipments = data.filter( filterHasAllEquipmentTypes)
            success.call(callee, equipments)
          },
          function( data, statusCode, headers, config){
            console.error( 'equipment.getEquipmentsWithTypesAnd ERROR getting equipments with type = ' + equipmentIdsQueryString + '". HTTP Status: ' + statusCode)
            if( failure)
              failure.call( callee, data, statusCode)
          }
      )

      return true
    }
  
  
    function findRequiredType( element, requiredTypes) {
      var index
      for( index = 0; index < element.types.length; index++) {
        var found = requiredTypes.indexOf( element.types[index])
        if( found >= 0)
          return requiredTypes[found]
      }
      return undefined
    }
  
    function filterEquipmentIdPointsMapToRemovePointsMissingRequiredTypes( equipmentIDPointsMap, requiredPointTypes) {
      if( requiredPointTypes.length === 0)
        return equipmentIDPointsMap
  
      var resourceId, point, index, points, pointByTypeMap, sortedPoints,
          resultPointsByResourceId = {}
  
      for( resourceId in equipmentIDPointsMap) {
        if( ! equipmentIDPointsMap.hasOwnProperty( resourceId))
          continue
  
        points = equipmentIDPointsMap[resourceId]
  
        pointByTypeMap = {}
        for( index = 0; index < points.length; index++) {
          point = points[index]
          var requiredType = findRequiredType( point, requiredPointTypes)
          if( requiredType) {
            if( pointByTypeMap[requiredType] !== undefined)
              console.error('equipment.filterEquipmentIdPointsMapToRemovePointsMissingRequiredTypes: ERROR: two points (' + pointByTypeMap[requiredType].name + ', ' + point.name + ') with type ' + requiredType)
            pointByTypeMap[requiredType] = point
          }
        }
  
        sortedPoints = []
        for( index = 0; index < requiredPointTypes.length; index++) {
          var typ = requiredPointTypes[index]
          point = pointByTypeMap[typ]
          if( point)
            sortedPoints[sortedPoints.length] = point
        }
  
        resultPointsByResourceId[resourceId] = sortedPoints
      }
  
      return resultPointsByResourceId
    }
  
    /**
     * Given a set of equipments, find points matching a list of point types for each resource. Return a map of
     * resourceID to list of points (ordered by the original pointTypes array).
     *
     * @param equipments  Array of resources (i.e. equipment model objects)
     * @param pointTypes  Array of point types. The order of this array is the order of the final points for each resource.
     * @param callee Use callee for 'this' when calling success or failure
     * @param success Success callback
     * @param failure Failure callback
     * @returns {boolean} return false if there was a problem with the arguments.
     */
    exports.getEquipmentPointsMapFromEquipmentsAndPointTypes = function( equipments, pointTypes, callee, success, failure) {
      if( ! equipments) {
        console.error('equipment.getEquipmentPointsMapFromEquipmentsAndPointTypes ERROR equipments array is undefined or null')
        return false
      } else if( ! angular.isArray( equipments)) {
        console.error('equipment.getEquipmentPointsMapFromEquipmentsAndPointTypes ERROR equipments is not an array')
        return false
      } else if( equipments.length === 0) {
        console.error('equipment.getEquipmentPointsMapFromEquipmentsAndPointTypes ERROR equipments array is empty')
        return false
      }
  
      if( ! pointTypes || ! angular.isArray( pointTypes)) {
        pointTypes = []
      }
  
      var pointsUrl, equipmentIdsQueryString,
          pointTypesQueryString = rest.queryParameterFromArrayOrString( 'pointTypes', pointTypes),
          equipmentIds = []
  
      equipments.forEach( function( eq) {
        equipmentIds.push( eq.id)
      })
  
      equipmentIdsQueryString = rest.queryParameterFromArrayOrString( 'equipmentIds', equipmentIds)
  
      pointsUrl = '/models/1/points?' + equipmentIdsQueryString
      if( pointTypesQueryString.length > 0)
        pointsUrl += '&' + pointTypesQueryString
  
      rest.get( pointsUrl, null, null,
          function( equipmentIdPointsMap) {
            success.call(callee, filterEquipmentIdPointsMapToRemovePointsMissingRequiredTypes( equipmentIdPointsMap, pointTypes))
          },
          function( data, statusCode, headers, config){
            console.error( 'equipment.getEquipmentPointsMapFromEquipmentsAndPointTypes ERROR getting points with type = ' + pointTypesQueryString + '". HTTP Status: ' + statusCode)
            if( failure)
              failure.call( callee, data, statusCode)
          }
      )
  
      return true
    }
  
    function objectValues( obj) {
      var ra = []
      Object.keys(obj).forEach( function (key) { ra[ra.length] = obj[key] })
      return ra
    }
  
  
    /**
     * Public API
     */
    return exports
  }]).

  controller('gbEquipmentController', ['$scope', '$state', '$stateParams', 'equipment',
    function($scope, $state, $stateParams, equipment) {
      var self = this,
          microgridId       = $stateParams.microgridId,
          navigationElement = $stateParams.navigationElement

      $scope.pageSize = Number( $scope.pageSize || 100)
      $scope.shortName = 'loading...'
      $scope.tabs = {
        measurements: false,
        properties: false
      }

      // Initialized from URL or menu click or both
      //
      if( ! navigationElement)
        return

      $scope.name = navigationElement.name || navigationElement.shortName

      var onePieceOfEquipment = navigationElement.equipmentChildren.length === 0
      $scope.tabs = {
        overview: $state.is( 'microgrids.dashboard'),
        measurements: true,
        properties: onePieceOfEquipment,
        points: true
      }

      $scope.pointsPromise = equipment.getPoints( true, $scope.pageSize)
    }
  ]).

  directive('gbEquipment', function() {
    return {
      restrict:    'E', // Element name
      scope: {
        pageSize: '=?'
      },
      templateUrl: 'greenbus.views.template/equipment/equipment.html',
      controller:  'gbEquipmentController'
    }
  })


