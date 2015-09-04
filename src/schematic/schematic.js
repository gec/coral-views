/**
 * Copyright 2014-2015 Green Energy Corp.
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
 * distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 * Author: Flint O'Brien
 */

angular.module('greenbus.views.schematic', ['greenbus.views.measurement', 'greenbus.views.rest', 'greenbus.views.request']).

  /**
   * Schematic services.
   *
   *   controller: schematic.subscribeToSchematic( notify)
   *   link: scope.$watch('svgContent', )
   *     insert
   *     use jQuery to get points
   *     store points on scope for controller.
   *     use jQuery to transform to Angular directives
   *     $compile
   *   controller: watch points list and subscribe to points
   */
  factory('schematic', [ '$stateParams', '$q', 'rest', 'subscription', 'measurement', 'assert', function( $stateParams, $q, rest, subscription, measurement, assert) {

    // public API
    var exports = {
      KEY_SCHEMATIC: 'schematic'
    }


    exports.subscribeToSchematic = function( equipmentId, scope, notify) {

      var subscriptionId,
          json = {
            name: 'SubscribeToProperties',
            entityId:  equipmentId,
            keys: [exports.KEY_SCHEMATIC]
          }

      subscriptionId = subscription.subscribe( json, scope,
        function( subscriptionId, type, data) {

          switch( type) {
            case 'notification.property':
              assert.equals( data.value.key, exports.KEY_SCHEMATIC, 'schematic.subscribeToSchematic notification.property: ')
              notify( data.value.value, data.operation)
              break
            case 'properties':
              assert.equals( data[0].key, exports.KEY_SCHEMATIC, 'schematic.subscribeToSchematic properties: ')
              notify( data[0].value, 'CURRENT')
              break
            default:
              console.error( 'schematic.subscribeToSchematic: unknown type "' + type + '" from subscription notification')
          }
          $scope.$digest()
        },
        function(error, message) {
          console.error('gbPropertiesTableController.subscribe ' + error + ', ' + message)
        }
      )

      return subscriptionId
    }

    /**
     *
     * @param collapsePointsToArray If true, poinrs will always be returned as a list.
     * @returns {Promise}
     */
    exports.getCurrentPoints = function( collapsePointsToArray) {
      var navigationElement = $stateParams.navigationElement

      // Initialized from URL or menu click or both
      //
      if( ! navigationElement)
        return $q.when( [])

      var equipmentIdsQueryParams = getEquipmentIdsQueryParams( navigationElement),
          depth = rest.queryParameterFromArrayOrString('depth', '9999')


      var delimeter = '?'
      var url = '/models/1/points'

      if( equipmentIdsQueryParams.length > 0 ) {
        url += delimeter + equipmentIdsQueryParams
        delimeter = '&'
      }
      if( depth.length > 0 )
        url += delimeter + depth

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


    return exports

  }]).

  /**
   * Controller for a single schematic (like inside the pop-out window).
   */
  controller( 'gbSchematicController', ['$scope', '$window', 'measurement', 'rest', 'schematic', function( $scope, $window, measurement, rest, schematic) {

    var  microgridId       = $stateParams.microgridId,
         navigationElement = $stateParams.navigationElement


    $scope.loading = true
    $scope.schematic = new GBChart( [], trend, true)  // t: zoomSlider
    console.log( 'gbChartController query params: ' + pointIds)

    if( pointIds.length > 0) {
      var url = '/models/1/points?' + rest.queryParameterFromArrayOrString( 'pids', pointIds)
      rest.get( url, 'points', $scope, function( data) {
        data.forEach( function( point) {
          $scope.schematic.addPoint( point)
          subscribeToMeasurementHistory( $scope.schematic, point )
        })
        $scope.invalidateWindow()
      })
    }

    /**
     * One of our points was dragged away from us.
     * @param uuid
     * @param schematic
     */
    $scope.onDragSuccess = function( uuid, schematic) {
      console.log( 'onDragSuccess schematic=' + schematic.name + ' uuid=' + uuid)
    }

    $window.addEventListener( 'unload', function( event) {
    })

    function onMeasurements(measurements) {
      measurements.forEach(function(pm) {
        var point = findPoint(pm.point.id)
        if( point ) {
          //pm.measurement.value = formatMeasurementValue( pm.measurement.value )
          point.currentMeasurement = pm.measurement
        } else {
          console.error('MeasurementsController.onPointMeasurement could not find point.id = ' + pm.point.id)
        }
      })
      $scope.$digest()
    }

    function subscribeToMeasurements(pointIds) {
      measurement.subscribe($scope, pointIds, {}, self, onMeasurements)
    }

    function getPointsAndSubscribeToMeasurements() {

      var promise = $scope.pointsPromise || equipment.getCurrentPoints( true)
      promise.then(
        function( response) {
          $scope.points = response.data
          var pointIds = processPointsAndReturnPointIds($scope.points)
          subscribeToMeasurements(pointIds)
          getPointsCommands(pointIds)
          return response // for the then() chain
        },
        function( error) {
          return error
        }
      )
    }



    subscribeToSchematic()

    //getPointsAndSubscribeToMeasurements()


  }]).

  directive('gbEquipmentSchematic', function() {
    return {
      restrict: 'E',
      scope: {
        equipmentId: '='
      },
      link: function (scope, elem, attrs) {
        //var chartEl = d3.select(elem[0])

        scope.$watch('svgContent', function(neValue) {
          elem.html(newValue);
          $compile(elem.contents())(scope);
        })

      }
    };
  })


