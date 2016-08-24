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

    var pointsCache = {
      url: undefined,
      data: undefined
    }

    function getEquipmentIdsQueryParams( navigationElement) {
      if( ! navigationElement)
        return ''

      var equipmentIds, equipmentIdsQueryParams

      if( navigationElement.equipmentChildren.length > 0 ) {
        equipmentIds = navigationElement.equipmentChildren.map( function( child) { return child.id })
        equipmentIdsQueryParams = rest.queryParameterFromArrayOrString('equipmentIds', equipmentIds)
      } else {
        equipmentIdsQueryParams = rest.queryParameterFromArrayOrString('equipmentIds', navigationElement.id)
      }
      return equipmentIdsQueryParams
    }

    /**
     *
     * @param collapsePointsToArray If true, points will always be returned as a list.
     * @returns {Promise}
     */
    function getPoints( collapsePointsToArray, limit, startAfterId, ascending) {
      var navigationElement = $stateParams.navigationElement

      // Initialized from URL or menu click or both
      //
      if( ! navigationElement)
        return $q.when( [])

      var equipmentIdsQueryParams = getEquipmentIdsQueryParams( navigationElement),
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
     * Public API
     */
    return {
      getPoints: getPoints
    }
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


