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
        },
        SVG_QUALITY = {
          GOOD: '<symbol id="quality_good"><title>Quality Good</title></symbol>',
          INVALID: '<symbol id="quality_invalid"><title>Quality Invalid</title><g>' +
                      '<path d="m7.5,5c0,0 2.5,0 5,0c2.5,0 2.5,0 2.5,2.5c0,2.5 0,2.5 0,5c0,2.5 0,2.5 -2.5,2.5c-2.5,0 -2.5,0 -5,0c-2.5,0 -2.5,0 -2.5,-2.5c0,-2.5 0,-2.5 0,-5c0,-2.5 0,-2.5 2.5,-2.5z" stroke="#999999" fill="#FF0000"/>' +
                      '<text fill="#FFFFFF" stroke="#999999" stroke-width="0" stroke-dasharray="null" stroke-linejoin="null" stroke-linecap="null" x="10" y="14" font-size="10" font-family="serif" text-anchor="middle" space="preserve" fill-opacity="1" stroke-opacity="1" transform="" font-weight="bold">X</text>' +
                    '</g></symbol>',
          QUESTIONABLE: '<symbol id="quality_questionable"><title>Quality Questionable</title><g>' +
                            '<path fill="#FFFF00" stroke="#999999" d="m7.5,5c0,0 2.5,0 5,0c2.5,0 2.5,0 2.5,2.5c0,2.5 0,2.5 0,5c0,2.5 0,2.5 -2.5,2.5c-2.5,0 -2.5,0 -5,0c-2.5,0 -2.5,0 -2.5,-2.5c0,-2.5 0,-2.5 0,-5c0,-2.5 0,-2.5 2.5,-2.5z"/>' +
                            '<text font-weight="bold" text-anchor="middle" font-family="serif" font-size="10" y="14" x="10" stroke-linecap="null" stroke-linejoin="null" stroke-dasharray="null" stroke-width="0" stroke="#999999" fill="#000000">?</text>' +
                        '</g></symbol>'
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

    exports.subscribe = function( equipmentId, scope, onMessage, onError) {

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
              onMessage( subscriptionId, data.value.value, data.operation)
              break
            case 'properties':
              if( data.length > 0) {
                assert.equals( data[0].key, exports.KEY_SCHEMATIC, 'schematic.subscribe properties: ')
                onMessage( subscriptionId, data[0].value, 'CURRENT')
              } else {
                console.log( 'schematic.subscribe to schematic - no schematic property')
                var error = 'No "schematic" property found.'
                onError( error, {error: error})
              }
              break
            default:
              console.error( 'schematic.subscribe: unknown type "' + type + '" from subscription notification')
          }
          scope.$digest()
        },
        function(error, message) {
          console.error('gbPropertiesTableController.subscribe ' + error + ', ' + message)
          onError( error, message)
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

      var measurementDecimals = parseInt( rootElement.children('svg').attr('tgs:measurement-decimals'))
      if( isNaN( measurementDecimals))
        measurementDecimals = 1

      symbols.options = {
        measurementDecimals: measurementDecimals
      }
      return symbols
    }

    /**
     *
     * <?xml version="1.0"?>
     *   <svg ...>
     *     <title>...</title>
     *     <defs>
     *       <symbol id="quality_questionable"> ...</symbol>
     *       <symbol id="quality_invalid"> ...</symbol>
     *       <symbol id="quality_good"> ...</symbol>
     *     </defs>
     *     ...
     *   </svg>
     *
     * @param rootElement
     */
    exports.ensureQualitySymbolsInDefs = function( rootElement) {
      var defs, good, invalid, questionable,
          svg = rootElement.children( 'svg').eq(0)

      if( svg.length === 0)
        return  // TODO: handle no SVG error case

      defs = svg.children( 'defs').eq(0)
      if( defs.length === 0) {
        svg.prepend( '<defs></defs>')
        defs = svg.children( 'defs')
      }

      good = defs.children( '#quality_good')
      invalid = defs.children( '#quality_invalid')
      questionable = defs.children( '#quality_questionable')

      if( good.length === 0)
        defs.append( SVG_QUALITY.GOOD)
      if( invalid.length === 0)
        defs.append( SVG_QUALITY.INVALID)
      if( questionable.length === 0)
        defs.append( SVG_QUALITY.QUESTIONABLE)

    }

    exports.transformSymbols = function( symbols) {
      var measurementPointNames, equipmentPointNames, pointNames
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

      // point: {
      //    currentMeasurement: {
      //      longQuality: "Good"
      //      shortQuality: ""
      //      time: 1450763927002
      //      type: "DOUBLE"
      //      validity: "GOOD"
      //      value: "277.128"
      //    }
      //    endpoint: "cebd7d00-00fa-4e36-ad37-acf2a7508aba"
      //    id: "c06f795c-2a7e-4a98-a395-1b410cbebfca"
      //    name: "Zone1.Load1.Voltage"
      //    pointType: "ANALOG"
      //    types: Array[3]
      //    unit: "V"
      // }
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

      if( pointName && pointName.length > 0) {
        states.map( function() {
          var stateElement = $(this),
              stateName = stateElement.attr( 'tgs:state')
          stateElement.attr( 'ng-show', 'pointNameMap[\'' + pointName + '\'].currentMeasurement.value === \'' + stateName + '\'')
          stateElement.removeAttr( 'display')
          return stateName
        })
      }

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
         pointIdMap = {}, // points by point id. {id, name:, currentMeasurement:}
         measurementDecimals = 1 // number of significant decimals for DOUBLE measurements.

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
        console.log( 'gbSchematicController: got symbols pointNames.length: ' + $scope.symbols.measurements.length)
        measurementDecimals = newValue.options.measurementDecimals
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
              getCommandsForPoints( pointIds)  // TODO: does nothing for now.

              return response // for the then() chain
            },
            function( error) {
              return error
            }
          )
      }
    })

    function processMeasurement( measurement) {
      measurement = angular.copy( measurement)
      if( measurement.type === 'DOUBLE') {
        measurement.value = parseFloat( measurement.value).toFixed( measurementDecimals)
      }
      return measurement
    }

    function onMeasurements(measurements) {
      measurements.forEach(function(pm) {
        var point = pointIdMap[pm.point.id]
        if( point ) {
          // point: {
          //    currentMeasurement: {
          //      longQuality: "Good"
          //      shortQuality: ""
          //      time: 1450763927002
          //      type: "DOUBLE"
          //      validity: "GOOD"
          //      value: "277.128"
          //    }
          //    endpoint: "cebd7d00-00fa-4e36-ad37-acf2a7508aba"
          //    id: "c06f795c-2a7e-4a98-a395-1b410cbebfca"
          //    name: "Zone1.Load1.Voltage"
          //    pointType: "ANALOG"
          //    types: Array[3]
          //    unit: "V"
          // }

          point.currentMeasurement = processMeasurement( pm.measurement)

        } else {
          console.error('gbSchematicController.onMeasurements could not find point.id = ' + pm.point.id)
        }
      })
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
      // TODO: see measurement.getCommandsForPoints when schematic implements commands.
      //measurement.getCommandsForPoints( pointIds).then(
      //  function( response) {
      //    var point,
      //        data = response.data
      //    // data is map of pointId -> commands[]
      //    for( var pointId in data ) {
      //      point = pointIdMap[pointId]
      //      if( point ) {
      //        // TODO: see measurement.getCommandsForPoints
      //        point.commands = data[pointId]
      //        //point.commandTypes = getCommandTypes( point.commands).toLowerCase()
      //        console.log('commandTypes: ' + point.commandTypes)
      //      }
      //      else
      //        console.error( 'gbSchematicController.getCommandsForPoints Unknown point ID ' + pointId)
      //    }
      //
      //  }
      //)
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
            schematic.ensureQualitySymbolsInDefs( elem)
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
        case 'INVALID':      return '#quality_invalid';
        default:
          return '#quality_questionable';
      }
    };
  })


