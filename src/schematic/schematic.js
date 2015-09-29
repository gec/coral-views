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
  factory('schematic', [ 'subscription', 'measurement', 'assert', function( subscription, measurement, assert) {

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
              assert.equals( data[0].key, exports.KEY_SCHEMATIC, 'schematic.subscribe properties: ')
              notify( subscriptionId, data[0].value, 'CURRENT')
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


    //function toJQuery( elem) { return $(elem)}
    //function jQueryToArrayOfJqueryElements( jqElem) {
    //  return jqElem.get().map( toJQuery)
    //}

    /**
     *
     *  <g schematic-type="point" name="LV.Line.kW_tot" point-name="LV.Line.kW_tot" id="LV.Line.kW_tot">
     *    <use class="quality-display" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#quality_invalid" y="78" x="257" id="svg_550"></use>
     *    <text class="data-label" x="277" y="92" id="svg_551">48 kW</text>
     *  </g>
     *
     *  <svg schematic-type="equipment-symbol"  symbol-type=“circuitbreaker" point-name="LV.CB_Main.Status"  class="symbol"  preserveAspectRatio=“xMaxYMax" id="svg_462" x="364" y="104">
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
          elements = rootElement.find( '[schematic-type]')

      symbols.measurements = elements.filter( '[schematic-type=point]')
      symbols.equipment = elements.filter( '[schematic-type=equipment-symbol]')
      symbols.navigationAreas = elements.filter( '[schematic-type=navigation-area]')
      symbols.navigationLabels = elements.filter( '[schematic-type=navigation-label]')

      return symbols
    }

    exports.transformSymbols = function( symbols) {
      var measurementPointNames, equipmentPointNames, pointNames, t
      // Convert jQuery object to array of strings.
      measurementPointNames  = symbols.measurements.map( exports.transformMeasurementAndReturnPointName).get()
      equipmentPointNames  = symbols.equipment.map( exports.transformEquipmentAndReturnName).get()

      pointNames = measurementPointNames.concat( equipmentPointNames).unique()

      return pointNames
    }

    /**
     *
     *  <g schematic-type="point" name="LV.Line.kW_tot" point-name="LV.Line.kW_tot" id="LV.Line.kW_tot">
     *    <use class="quality-display" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#quality_invalid" y="78" x="257" id="svg_550"></use>
     *    <text class="data-label" x="277" y="92" id="svg_551">48 kW</text>
     *  </g>
     *
     *  @param rootElement
     */
    exports.transformMeasurementAndReturnPointName = function( ) {
      var element = $(this),
          pointName = element.attr( 'point-name'),
          useQuality = element.find( 'use'),
          text = element.find( 'text')

      text.html( '{{ pointMap[\'' + pointName + '\'].currentMeasurement.value }} {{ pointMap[\'' + pointName + '\'].unit }}')
      useQuality.attr( 'xlink:href', '{{ pointMap[\'' + pointName + '\'].currentMeasurement.validity | schematicValidityDef }} ')

      return pointName
    }

    /**
     *
     *  <svg schematic-type="equipment-symbol"  symbol-type=“circuitbreaker" point-name="LV.CB_Main.Status"  class="symbol"  preserveAspectRatio=“xMaxYMax" id="svg_462" x="364" y="104">
     *    <g state="open" display="none" id="svg_465">
     *      <rect x="2" y="2" width="30" height="30" fill="#00FF00" id="svg_466"></rect>
     *    </g>
     *    <g state="closed" id="svg_463" style="display:inherit;">
     *      <rect x="2" y="2" width="30" height="30" fill="#A40000" id="svg_464"></rect>
     *    </g>
     *  </svg>
     *
     *  @param rootElement
     */
    exports.transformEquipmentAndReturnName = function( element) {
    }


    function filterPoints( elem) {
      return elem.attr('schematic-type') === 'point'
    }
    function filterEquipment( elem) { return elem.attr('schematic-type') === 'equipment-symbol'}
    function filterNavigationAreas( elem) { return elem.attr('schematic-type') === 'navigation-area'}
    function filterNavigationLabels( elem) { return elem.attr('schematic-type') === 'navigation-label'}

    return exports

  }]).


  /**
   * Controller for a single schematic (like inside the pop-out window).
   */
  controller( 'gbSchematicController', ['$scope', '$window', '$stateParams', 'measurement', 'rest', 'schematic', function( $scope, $window, $stateParams, measurement, rest, schematic) {

    var  microgridId       = $stateParams.microgridId,
         equipmentId       = $stateParams.id,// id string if equipment navigation element, else undefined
         navigationElement = $stateParams.navigationElement  // {id:, name:, shortName:, types:, equipmentChildren:, class:}


    $scope.loading = true
    $scope.svgSource = undefined
    $scope.symbols = undefined
    $scope.pointNames = []
    $scope.pointMap = {}

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

    function onSchematic( subscriptionId, content, eventType) {
      $scope.svgSource = content
      $scope.$digest()
    }

    function subscribe() {
      if( !equipmentId)
        return
      
      return schematic.subscribe( equipmentId, $scope, onSchematic)
    }

    subscribe()

    $scope.$watch('symbols', function(newValue) {
      if( newValue !== undefined) {
        console.log( 'gbSchematicController: got symbols pointNames.length: ' + $scope.symbols.pointNames.length)
      }
    })

    $scope.$watch('pointNames', function(newValue) {
      if( newValue !== undefined) {
        console.log( 'gbSchematicController: got pointNames.length: ' + $scope.pointNames.length)
      }
    })


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


