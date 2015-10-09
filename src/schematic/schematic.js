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
   *   controller: schematic.subscribe( notify)
   *   link: scope.$watch('svgSource', )
   *     insert
   *     use jQuery to get points
   *     store points on scope for controller.
   *     use jQuery to transform to Angular directives
   *     $compile
   *   controller: watch points list and subscribe to points
   */
  factory('schematic', [ 'rest', 'subscription', 'assert', '$q', function( rest, subscription, assert, $q) {

    // public API
    var exports = {
      KEY_SCHEMATIC: 'schematic'
    }


    Array.prototype.unique = [].unique || function(){
      var u = {}, a = [];
      for(var i = 0, l = this.length; i < l; ++i){
        if(u.hasOwnProperty(this[i])) {
          continue;
        }
        a.push(this[i]);
        u[this[i]] = 1;
      }
      return a;
    }

    exports.subscribe = function( equipmentId, scope, notify) {

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
              assert.equals( data.value.key, exports.KEY_SCHEMATIC, 'schematic.subscribe notification.property: ')
              notify( subscriptionId, data.value.value, data.operation)
              break
            case 'properties':
              if( data.length > 0) {
                assert.equals( data[0].key, exports.KEY_SCHEMATIC, 'schematic.subscribe properties: ')
                notify( subscriptionId, data[0].value, 'CURRENT')
              } else {
                console.log( 'schematic.subscribe to schematic - no schematic property')
              }
              break
            default:
              console.error( 'schematic.subscribe: unknown type "' + type + '" from subscription notification')
          }
          scope.$digest()
        },
        function(error, message) {
          console.error('gbPropertiesTableController.subscribe ' + error + ', ' + message)
        }
      )

      return subscriptionId
    }


    exports.getPointsByName = function( pointNames) {
      if( ! pointNames || pointNames.length === 0)
        return $q.when( [])

      var pnamesQueryParams = rest.queryParameterFromArrayOrString('pnames', pointNames),
          url = '/models/1/points?' + pnamesQueryParams

      return rest.get(url)

    }


    /**
     *
     *  <g schematic-type="point" name="LV.Line.kW_tot" tgs:point-name="LV.Line.kW_tot" id="LV.Line.kW_tot">
     *    <use class="quality-display" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#quality_invalid" y="78" x="257" id="svg_550"></use>
     *    <text class="data-label" x="277" y="92" id="svg_551">48 kW</text>
     *  </g>
     *
     *  <svg schematic-type="equipment-symbol"  symbol-type=“circuitbreaker" tgs:point-name="LV.CB_Main.Status"  class="symbol"  preserveAspectRatio=“xMaxYMax" id="svg_462" x="364" y="104">
     *    <g state="open" display="none" id="svg_465">
     *      <rect x="2" y="2" width="30" height="30" fill="#00FF00" id="svg_466"></rect>
     *    </g>
     *    <g state="closed" id="svg_463" style="display:inherit;">
     *      <rect x="2" y="2" width="30" height="30" fill="#A40000" id="svg_464"></rect>
     *    </g>
     *  </svg>
     *
     *  <rect schematic-type="navigation-area" class="navigation-area clickable" uri="ModelNodeDetailPlace:?model_node_name=LV;tab=schematic" fill="#FFFFFF" stroke-width="0" stroke-dasharray="null" stroke-linejoin="null" stroke-linecap="null" x="210" y="10" width="460" height="480" id="svg_349"></rect>
     *
     *  @param rootElement
     */
    exports.parseElements = function( rootElement) {
      var symbols = {},
          elements = rootElement.find( '[tgs\\:schematic-type]')

      symbols.measurements = elements.filter( '[tgs\\:schematic-type=point]')
      symbols.equipment = elements.filter( '[tgs\\:schematic-type=equipment-symbol]')
      symbols.navigationAreas = elements.filter( '[tgs\\:schematic-type=navigation-area]')
      symbols.navigationLabels = elements.filter( '[tgs\\:schematic-type=navigation-label]')

      return symbols
    }

    exports.transformSymbols = function( symbols) {
      var measurementPointNames, equipmentPointNames, pointNames, t
      // Convert jQuery object to array of strings.
      measurementPointNames  = symbols.measurements.map( exports.transformMeasurementAndReturnPointName).get()
      equipmentPointNames  = symbols.equipment.map( exports.transformEquipmentAndReturnPointName).get()

      pointNames = measurementPointNames.concat( equipmentPointNames).unique()

      return pointNames
    }

    /**
     *
     *  <g tgs:schematic-type="point" name="LV.Line.kW_tot" tgs:point-name="LV.Line.kW_tot" id="LV.Line.kW_tot">
     *    <use class="quality-display" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#quality_invalid" y="78" x="257" id="svg_550"></use>
     *    <text class="data-label" x="277" y="92" id="svg_551">48 kW</text>
     *  </g>
     *
     *  @param rootElement
     */
    exports.transformMeasurementAndReturnPointName = function( ) {
      var element = $(this),
          pointName = element.attr( 'tgs:point-name'),
          useQuality = element.find( 'use'),
          text = element.find( 'text')

      text.html( '{{ pointNameMap[\'' + pointName + '\'].currentMeasurement.value }} {{ pointNameMap[\'' + pointName + '\'].unit }}')
      useQuality.attr( 'xlink:href', '{{ pointNameMap[\'' + pointName + '\'].currentMeasurement.validity | schematicValidityDef }} ')

      element.attr( 'ng-click', 'equipmentClicked( pointNameMap[\'' + pointName + '\'])')

      return pointName
    }

    /**
     *
     *  <svg preserveAspectRatio="xMaxYMax" class="symbol" tgs:schematic-type="equipment-symbol" id="svg_619" x="484" y="404" tgs:point-name="Zone1.PCC_cbr_cust.Status" tgs:symbol-type="circuitbreaker">
     *    <g tgs:state="open" display="none" id="svg_622">
     *      <rect x="2" y="2" width="30" height="30" fill="#00FF00" id="svg_623"/>
     *    </g>
     *    <g tgs:state="closed" id="svg_620">
     *     <rect x="2" y="2" width="30" height="30" fill="#A40000" id="svg_621"/>
     *    </g>
     *  </svg>
     *
     *  @param rootElement
     */
    exports.transformEquipmentAndReturnPointName = function( ) {
      var element = $(this),
          states = element.find( '[tgs\\:state]'),
          pointName = element.attr( 'tgs:point-name')

      states.map( function() {
        var stateElement = $(this),
            stateName = stateElement.attr( 'tgs:state')
        stateElement.attr( 'ng-show', 'pointNameMap[\'' + pointName + '\'].currentMeasurement.value === \'' + stateName + '\'')
        stateElement.removeAttr( 'display')
        return stateName
      })

      return pointName
    }


    function filterPoints( elem) {
      return elem.attr('tgs\\:schematic-type') === 'point'
    }
    function filterEquipment( elem) { return elem.attr('tgs\\:schematic-type') === 'equipment-symbol'}
    function filterNavigationAreas( elem) { return elem.attr('tgs\\:schematic-type') === 'navigation-area'}
    function filterNavigationLabels( elem) { return elem.attr('tgs\\:schematic-type') === 'navigation-label'}

    return exports

  }]).




  /**
   * Controller for a single schematic (like inside the pop-out window).
   */
  controller( 'gbSchematicController', ['$scope', '$window', '$state', '$stateParams', 'measurement', 'rest', 'schematic', function( $scope, $window, $state, $stateParams, measurement, rest, schematic) {

    var  self = this,
         microgridId       = $stateParams.microgridId,
         equipmentId       = $stateParams.id,// id string if equipment navigation element, else undefined
         navigationElement = $stateParams.navigationElement,  // {id:, name:, shortName:, types:, equipmentChildren:, class:}
         pointIdMap = {} // points by point id. {id, name:, currentMeasurement:}

    if( !equipmentId && $state.is( 'microgrids.dashboard') )
      equipmentId = microgridId

    $scope.loading = true
    $scope.svgSource = undefined
    $scope.symbols = undefined
    $scope.pointNames = []
    $scope.pointNameMap = {} // points by point name. {id, name:, currentMeasurement:}


    //if( pointIds.length > 0) {
    //  var url = '/models/1/points?' + rest.queryParameterFromArrayOrString( 'pids', pointIds)
    //  rest.get( url, 'points', $scope, function( data) {
    //    data.forEach( function( point) {
    //      $scope.schematic.addPoint( point)
    //      subscribeToMeasurementHistory( $scope.schematic, point )
    //    })
    //    $scope.invalidateWindow()
    //  })
    //}

    $scope.equipmentClicked = function( point) {

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

    $scope.$watch('symbols', function(newValue) {
      if( newValue !== undefined) {
        console.log( 'gbSchematicController: got symbols pointNames.length: ' + $scope.symbols.pointNames.length)
      }
    })

    // Directive sets pointNames after getting SVG content.
    //
    $scope.$watch('pointNames', function(newValue) {
      if( newValue !== undefined) {
        console.log( 'gbSchematicController: got pointNames.length: ' + $scope.pointNames.length)
        // TODO: unsubscribe from previous schematic's points. Could optimize for large overlaps in points when schematic changes.
        if( $scope.pointNames.length > 0)
          schematic.getPointsByName( $scope.pointNames).then(
            function( response) {
              $scope.points = response.data
              pointIdMap = processPointsAndReturnPointIdMap($scope.points)
              // TODO: what about the old names in the map?
              $scope.points.forEach( function( p) { $scope.pointNameMap[p.name] = p})
              var pointIds = Object.keys(pointIdMap)

              measurement.subscribe( $scope, pointIds, {}, self, onMeasurements)
              getCommandsForPoints( pointIds)

              return response // for the then() chain
            },
            function( error) {
              return error
            }
          )
      }
    })

    function onMeasurements(measurements) {
      measurements.forEach(function(pm) {
        var point = pointIdMap[pm.point.id]
        if( point ) {
          //pm.measurement.value = formatMeasurementValue( pm.measurement.value )
          point.currentMeasurement = pm.measurement
        } else {
          console.error('gbSchematicController.onMeasurements could not find point.id = ' + pm.point.id)
        }
      })
      $scope.$digest()
    }

    function processPointsAndReturnPointIdMap(points) {
      var idMap           = {},
          currentMeasurement = {
            value:        '-',
            time:         null,
            shortQuality: '',
            longQuality:  '',
            validity:     'NOTLOADED',
            expandRow:    false,
            commandSet:   undefined
          }
      points.forEach(function(point) {
        point.currentMeasurement = angular.extend({}, currentMeasurement)
        idMap[point.id] = point
        if( typeof point.pointType !== 'string' )
          console.error('------------- point: ' + point.name + ' point.pointType "' + point.pointType + '" is empty or null.')
        if( typeof point.unit !== 'string' )
          point.unit = ''

      })
      return idMap
    }

    function getCommandsForPoints(pointIds) {
      measurement.getCommandsForPoints( pointIds).then(
        function( response) {
          var point,
              data = response.data
          // data is map of pointId -> commands[]
          for( var pointId in data ) {
            point = pointIdMap[pointId]
            if( point )
              point.commandSet =  measurement.getCommandSet(point, data[pointId])
            else
              console.error( 'Unknown point ID ' + pointId)
          }

        }
      )
    }


    function subscribe() {
      if( !equipmentId)
        return

      return schematic.subscribe( equipmentId, $scope, onSchematic)
    }
    function onSchematic( subscriptionId, content, eventType) {
      $scope.svgSource = content  // directive is watching this and will parse SVG and set $scope.pointNames.
      $scope.$digest()
    }

    subscribe()


  }]).

  directive('gbEquipmentSchematic', [ '$compile', 'schematic', function( $compile, schematic) {
    return {
      restrict: 'E',
      scope: {
        //equipmentId: '='
      },
      controller: 'gbSchematicController',
      link: function (scope, elem, attrs) {
        var symbols
        //var chartEl = d3.select(elem[0])

        scope.$watch('svgSource', function(newValue) {
          if( newValue !== undefined) {

            elem.html(newValue);
            symbols = schematic.parseElements( elem)
            symbols.pointNames = schematic.transformSymbols( symbols)

            $compile(elem.contents())(scope);
            scope.symbols = symbols
            scope.pointNames = symbols.pointNames
          }
        })

      }
    };
  }]).

  filter('schematicValidityDef', function() {
    return function(validity) {
      switch( validity ) {
        case 'GOOD':         return '#quality_good';
        case 'QUESTIONABLE': return '#quality_questionable';
        case 'NOTLOADED':    return '#quality_questionable'
        case 'INVALID':      return '#quality-invalid';
        default:
          return '#quality_questionable';
      }
    };
  })


