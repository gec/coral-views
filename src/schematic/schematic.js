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

angular.module('greenbus.views.schematic', ['greenbus.views.measurement', 'greenbus.views.rest', 'greenbus.views.request', 'greenbus.views.command']).

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

    //var SVG_QUALITY_CONTENT = {
    //  GOOD: '<symbol id="quality_good"><title>Quality Good</title></symbol>',
    //  INVALID: '<symbol id="quality_invalid"><title>Quality Invalid</title><g>' +
    //  '<path d="m7.5,5c0,0 2.5,0 5,0c2.5,0 2.5,0 2.5,2.5c0,2.5 0,2.5 0,5c0,2.5 0,2.5 -2.5,2.5c-2.5,0 -2.5,0 -5,0c-2.5,0 -2.5,0 -2.5,-2.5c0,-2.5 0,-2.5 0,-5c0,-2.5 0,-2.5 2.5,-2.5z" stroke="#999999" fill="#FF0000"></path>' +
    //  '<text fill="#FFFFFF" stroke="#999999" stroke-width="0" stroke-dasharray="null" stroke-linejoin="null" stroke-linecap="null" x="10" y="14" font-size="10" font-family="serif" text-anchor="middle" space="preserve" fill-opacity="1" stroke-opacity="1" transform="" font-weight="bold">X</text>' +
    //  '</g></symbol>',
    //  QUESTIONABLE: '<symbol id="quality_questionable"><title>Quality Questionable</title><g>' +
    //  '<path fill="#FFFF00" stroke="#999999" d="m7.5,5c0,0 2.5,0 5,0c2.5,0 2.5,0 2.5,2.5c0,2.5 0,2.5 0,5c0,2.5 0,2.5 -2.5,2.5c-2.5,0 -2.5,0 -5,0c-2.5,0 -2.5,0 -2.5,-2.5c0,-2.5 0,-2.5 0,-5c0,-2.5 0,-2.5 2.5,-2.5z"></path>' +
    //  '<text font-weight="bold" text-anchor="middle" font-family="serif" font-size="10" y="14" x="10" stroke-linecap="null" stroke-linejoin="null" stroke-dasharray="null" stroke-width="0" stroke="#999999" fill="#000000">?</text>' +
    //  '</g></symbol>'
    //}

    // public API
    var exports = {
          KEY_SCHEMATIC: 'schematic'
        },
        SVG_QUALITY = {
          GOOD: {
            id:'quality_good',
            title:'Quality Good'
          },
          INVALID: {
            id:'quality_invalid',
            title:'Quality Invalid',
            pathAttrs: {d:'m7.5,5c0,0 2.5,0 5,0c2.5,0 2.5,0 2.5,2.5c0,2.5 0,2.5 0,5c0,2.5 0,2.5 -2.5,2.5c-2.5,0 -2.5,0 -5,0c-2.5,0 -2.5,0 -2.5,-2.5c0,-2.5 0,-2.5 0,-5c0,-2.5 0,-2.5 2.5,-2.5z', stroke:'#999999', fill:'#FF0000'},
            textAttrs: {fill:'#FFFFFF', stroke:'#999999', 'stroke-width':'0', 'stroke-dasharray':'null', 'stroke-linejoin':'null', 'stroke-linecap':'null', x:'10', y:'14', 'font-size':'10', 'font-family':'serif', 'text-anchor':'middle', space:'preserve', 'fill-opacity':'1', 'stroke-opacity':'1', transform:'', 'font-weight':'bold'},
            text: 'X'
          },
          QUESTIONABLE: {
            id:'quality_questionable',
            title:'Quality Questionable',
            pathAttrs: {d:'m7.5,5c0,0 2.5,0 5,0c2.5,0 2.5,0 2.5,2.5c0,2.5 0,2.5 0,5c0,2.5 0,2.5 -2.5,2.5c-2.5,0 -2.5,0 -5,0c-2.5,0 -2.5,0 -2.5,-2.5c0,-2.5 0,-2.5 0,-5c0,-2.5 0,-2.5 2.5,-2.5z', stroke:'#999999', fill:'#FFFF00'},
            textAttrs: {fill:'#000000', stroke:'#999999', 'stroke-width':'0', 'stroke-dasharray':'null', 'stroke-linejoin':'null', 'stroke-linecap':'null', x:'10', y:'14', 'font-size':'10', 'font-family':'serif', 'text-anchor':'middle', space:'preserve', 'fill-opacity':'1', 'stroke-opacity':'1', transform:'', 'font-weight':'bold'},
            text: '?'
          }
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
            entityIds:  [equipmentId],
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
                if( angular.isFunction( onError)) {
                  var error = 'No "schematic" property found.'
                  onError( error, {error: error})
                }
              }
              break
            default:
              console.error( 'schematic.subscribe: unknown type "' + type + '" from subscription notification')
          }
          scope.$digest()
        },
        function(error, message) {
          console.error('gbPropertiesTableController.subscribe ' + error + ', ' + message)
          if( angular.isFunction( onError)) {
            onError(error, message)
          }
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
     *  <g tgs:schematic-type="point" name="LV.Line.kW_tot" tgs:point-name="LV.Line.kW_tot" id="LV.Line.kW_tot">
     *    <use class="quality-display" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#quality_invalid" y="78" x="257" id="svg_550"></use>
     *    <text class="data-label" x="277" y="92" id="svg_551">48 kW</text>
     *  </g>
     *
     *  <svg tgs:schematic-type="equipment-symbol"  symbol-type=“circuitbreaker" tgs:point-name="LV.CB_Main.Status"  class="symbol"  preserveAspectRatio=“xMaxYMax" id="svg_462" x="364" y="104">
     *    <g state="open" display="none" id="svg_465">
     *      <rect x="2" y="2" width="30" height="30" fill="#00FF00" id="svg_466"></rect>
     *    </g>
     *    <g state="closed" id="svg_463" style="display:inherit;">
     *      <rect x="2" y="2" width="30" height="30" fill="#A40000" id="svg_464"></rect>
     *    </g>
     *  </svg>
     *
     *  <rect tgs:schematic-type="navigation-area" class="navigation-area clickable" uri="ModelNodeDetailPlace:?model_node_name=LV;tab=schematic" fill="#FFFFFF" stroke-width="0" stroke-dasharray="null" stroke-linejoin="null" stroke-linecap="null" x="210" y="10" width="460" height="480" id="svg_349"></rect>
     *
     *  <* tgs:schematic-type="control" direct-operate="true" class="control clickable" tgs:point-name="LV.CB_Main.Trip" control-name="Open">
     *    <g class="control-spinner gb-executing">
     *      <path opacity=".25" d="M16 0 A16 16 0 0 0 16 32 A16 16 0 0 0 16 0 M16 4 A12 12 0 0 1 16 28 A12 12 0 0 1 16 4"/>
     *      <path d="M16 0 A16 16 0 0 1 32 16 L28 16 A12 12 0 0 0 16 4z">
     *      </path>
     *    </g>
     *  </*>
     *
     *  @param rootElement
     */
    exports.parseElements = function( rootElement) {
      var symbolElements = {},
          elements = rootElement.find( '[tgs\\:schematic-type]')

      symbolElements.measurements = elements.filter( '[tgs\\:schematic-type=point]')
      symbolElements.equipment = elements.filter( '[tgs\\:schematic-type=equipment-symbol]')
      // symbolElements.controls = elements.filter( '[tgs\\:schematic-type=control]')
      symbolElements.navigationAreas = elements.filter( '[tgs\\:schematic-type=navigation-area]')
      symbolElements.navigationLabels = elements.filter( '[tgs\\:schematic-type=navigation-label]')

      var measurementDecimals = parseInt( rootElement.children('svg').attr('tgs:measurement-decimals'))
      if( isNaN( measurementDecimals))
        measurementDecimals = 1

      symbolElements.options = {
        measurementDecimals: measurementDecimals
      }
      return symbolElements
    }


    /**
     * Must create SVG elements in the 'http://www.w3.org/2000/svg' namespace!
     *
     * @param tag
     * @param attrs
     * @returns {Element}
     */
    function makeSvgElement(tag, attrs) {
      var xmlElem = document.createElementNS('http://www.w3.org/2000/svg', tag)
      if( attrs) {
        for (var k in attrs)
          xmlElem.setAttribute(k, attrs[k])
      }
      return xmlElem
    }

    /**
     * Have to crate the quality symbols manually in the 'http://www.w3.org/2000/svg' namespace!
     * @param symbol
     * @returns {SvgSymbol}
     */
    function makeSvgSymbol( symbol) {
      var symbolEl, el

      symbolEl = makeSvgElement( 'symbol', {id: symbol.id})
      el = makeSvgElement( 'title')
      el.appendChild( document.createTextNode(symbol.title))
      symbolEl.appendChild( el)

      if( symbol.pathAttrs) {
        el = makeSvgElement( 'path', symbol.pathAttrs)
        symbolEl.appendChild( el)
      }
      if( symbol.textAttrs) {
        el = makeSvgElement( 'text', symbol.textAttrs)
        el.appendChild( document.createTextNode(symbol.text))
        symbolEl.appendChild( el)
      }

      return symbolEl
    }


    /**
     * Update the SVG element to scale to fit inside parent div.
     *
     * @param rootElement
     */
    exports.updateSvgElementAttributesToScaleToFitParentDiv = function( rootElement) {
      // Convert:
      //   <svg width="1680" height="800" >...</svg>
      // To:
      //   <svg width="100%" height="auto"
      //        viewBox="0 0 1680 800"
      //        preserveAspectRatio="xMidYMid meet"
      //   >...</svg>

      var svg = $(rootElement).filter(function(){return this.nodeType===1;}) // fitler out '<?xml version="1.0"?>'
      if (svg.length === 0)
        return  // TODO: handle no SVG error case

      // IMPORTANT - jQuery .attr() ignores case. Need case sensitive Javascript .getAttribute().

      var w, h,
          width = svg.attr('width'),
          height = svg.attr('height'),
          viewBox = svg[0].getAttribute('viewBox')
      console.log( 'gbSchematicController: Updating svg attributes to auto-size and fit in div. Initial svg attributes: width="' + width + '" height="' + height + '" viewBox="' + viewBox + '"')

      if( viewBox === null || viewBox === undefined || viewBox === '') {
        w = width === undefined || width.indexOf('%') >= 0 ? 1680 : width
        h = height === undefined || height.indexOf('%') >= 0 ? 800 : height
        viewBox = '0 0 ' + w + ' ' + h
        console.log( 'gbSchematicController: Setting viewBox="' + viewBox + '"')
        svg[0].setAttribute('viewBox', viewBox) // setAttribute for case sensitive
      } // else assume the viewBox is setup correctly

      svg.attr('width', '100%')
      svg.attr('height', '100%')
      svg[0].setAttribute('preserveAspectRatio', 'xMidYMid meet')  // setAttribute for case sensitive
    }

    /**
     * Ensure quality symbols exist in first defs element in schematic.
     *
     * @param rootElement
     */
    exports.ensureQualitySymbolsInDefs = function( rootElement) {
      // Example schematic
      //   <?xml version="1.0"?>
      //   <svg ...>
      //     <title>...</title>
      //     <defs>
      //       <symbol id="quality_questionable"> ...</symbol>
      //       <symbol id="quality_invalid"> ...</symbol>
      //       <symbol id="quality_good"> ...</symbol>
      //     </defs>
      //     ...
      //   </svg>
      var defs, good, invalid, questionable,
          svg = $(rootElement)

      if( svg.length === 0)
        return  // TODO: handle no SVG error case

      defs = svg.children( 'defs').eq(0)
      if( defs.length === 0) {
        svg.prepend( makeSvgElement('defs'))
        defs = svg.children( 'defs')
      }

      good = defs.children( '#quality_good')
      invalid = defs.children( '#quality_invalid')
      questionable = defs.children( '#quality_questionable')

      if( good.length === 0)
        defs.append( makeSvgSymbol( SVG_QUALITY.GOOD))
      if( invalid.length === 0)
        defs.append( makeSvgSymbol( SVG_QUALITY.INVALID))
      if( questionable.length === 0)
        defs.append( makeSvgSymbol( SVG_QUALITY.QUESTIONABLE))
    }

    exports.bindSymbols = function( symbolElements) {
      var measurementPointNames, equipment, equipmentPointNames, controlPointNames, pointNames, symbols
      // Convert jQuery object to array of strings. Final get() is to convert jQuery object list to simple array.
      measurementPointNames  = symbolElements.measurements.map( exports.bindMeasurementSymbols).get()
      equipment  = symbolElements.equipment.map( exports.bindEquipmentSymbols).get()
      // controlPointNames  = symbolElements.controls.map( exports.transformControlAndReturnPointName).get()

      equipmentPointNames = equipment.map( function(eq){return eq.pointName})
      pointNames = measurementPointNames.concat( equipmentPointNames /*, controlPointNames*/).unique()
      pointNames = pointNames.filter( function(s) {return s !== undefined && s.length > 0})

      symbols = {
        pointNames: pointNames,
        equipment: equipment,
        options: symbolElements.options
      }
      return symbols
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
    exports.bindMeasurementSymbols = function( ) {
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
      //useQuality.attr( 'ng-href', '{{ pointNameMap[\'' + pointName + '\'].currentMeasurement.validity | schematicValidityToHref }} ')
      //useQuality.attr( 'xlink:href', '')  // ng-href will fill this in. See http://jsbin.com/sigoleya/1/edit?html,js,output
      useQuality.attr( 'xlink:href', '{{ pointNameMap[\'' + pointName + '\'].currentMeasurement.validity | schematicValidityToHref }} ')


      return pointName
    }

    /**
     * @typedef {Object} BoundEquipment
     * @property {string} pointName The principal point name for this symbol. Shows the symbol's state based on measurement status.
     * @property {string[]} symbolControlNames control names from symbol
     * @property {string[]} symbolStateNames state names from symbol
     */
    /**
     * Bind equipment symbol states to model so the correct state is displayed according to the current status measurement value.
     * Bind select classes so user can select/deselect equipment.
     *
     *  @param index
     *  @return {BoundEquipment}
     */
    exports.bindEquipmentSymbols = function(index) {
      var equipment, symbolStateNames, symbolControlNames,
          element = $(this),
          // id = element.id(),
          states = element.find( '[tgs\\:state]'),
          controlSelects = element.find( '[tgs\\:control-select]'),
          controlNameElements = element.find( '[tgs\\:control-name]'),
          pointName = element.attr( 'tgs:point-name')

      if( !pointName || pointName.length === 0)
        return {}

      symbolStateNames = states.map( function() {
        var stateElement = $(this),
            stateName = stateElement.attr( 'tgs:state')
        stateElement.attr( 'ng-show', 'pointNameMap[\'' + pointName + '\'].currentMeasurement.value === \'' + stateName + '\'')
        stateElement.removeAttr( 'display')
        return stateName
      }).get() // convert JQuery elements to array of strings.

      // Select one or more parts of the equipment symbol to expand to the selected state. Operator may be able to click on multiple
      // parts of equipment symbol to open the commands to be selected. If there is only one command, then it is being selected when
      // the equipment is opened.
      // TODO: need to handle multiple commands at some point.
      controlSelects.each(function() {
        var selectElement = $(this),
            selectClass = selectElement.attr('tgs:control-select')
        selectElement.attr( 'ng-click', 'equipmentSelectToggle(symbols.equipment[' + index + '],\'' + selectClass + '\')')
      })
      symbolControlNames = controlNameElements.map(function() {
        var controlNameElement = $(this),
            controlName = controlNameElement.attr('tgs:control-name')

        controlNameElement.attr( 'ng-class', 'symbols.equipment[' + index + '].classes')

        var controlExecutes = controlNameElement.find( '[tgs\\:control-execute]')
        controlExecutes.each(function() {
          var executeElement = $(this)
          executeElement.attr( 'ng-click', 'equipmentControlExecute(symbols.equipment[' + index + '],\'' + controlName + '\')')
        })
        return controlName
      }).get() // convert JQuery elements to array of strings.

      return {
        pointName: pointName,
        symbolControlNames: symbolControlNames.unique(),
        symbolStateNames: symbolStateNames.unique()
      }
    }


    /**
     *
     *  <* tgs:schematic-type="control" direct-operate="true" class="control clickable" tgs:point-name="LV.CB_Main.Trip" tgs:control-name="Open">
     *    <g tgs:control-spinner>
     *      <path opacity=".25" d="M16 0 A16 16 0 0 0 16 32 A16 16 0 0 0 16 0 M16 4 A12 12 0 0 1 16 28 A12 12 0 0 1 16 4"/>
     *      <path d="M16 0 A16 16 0 0 1 32 16 L28 16 A12 12 0 0 0 16 4z">
     *      </path>
     *    </g>
     *  </*>
     *
     *  @param rootElement
     */
    // exports.transformControlAndReturnPointName = function( ) {
    //   var element = $(this),
    //       pointName = element.attr( 'tgs:point-name'),
    //       controlName = element.attr( 'tgs:control-name'),
    //       controlSpinners = element.find( '[tgs\\:control-spinner]')
    //
    //   element.attr( 'ng-click', 'controlClicked( pointNameMap[\'' + pointName + '\'],\'' + controlName + '\')')
    //   if( controlSpinners.length >=1) {
    //     var controlSpinner = controlSpinners[0]
    //     controlSpinner.removeAttr( 'class')
    //     controlSpinner.attr( 'ng-class', 'pointNameMap[\'' + pointName + '\'].controls[\'' + controlName + '\'].executing | schematicControlExecutingClasses)')
    //   }
    //
    //   return pointName
    // }

    return exports

  }]).




  /**
   * Controller for a single schematic (like inside the pop-out window).
   */
  controller( 'gbSchematicController', ['$scope', '$window', '$state', '$stateParams', 'measurement', 'rest', 'schematic', 'gbCommandRest', function( $scope, $window, $state, $stateParams, measurement, rest, schematic, gbCommandRest) {

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
    $scope.pointNameMap = {} // points by point name. {id, name:, currentMeasurement:}
    $scope.alerts = []


    $scope.closeAlert = function(index) {
      if( index < $scope.alerts.length)
        $scope.alerts.splice(index, 1)
    }

    function findControl(point, controlName) {
      if( !point)
        return undefined

      var control,
          n = point.controls.length,
          name = controlName.toLowerCase()
      while(--n) {
        control = point.controls[n]
        if( control.name.toLowerCase() === name)
          return control
      }
      return undefined
    }

    function getMessageFromException( ex) {
      if( ! ex)
        return undefined
      var message = ex.message
      if( message === undefined || message === '')
        message = ex.exception
      return message
    }

    $scope.controlClicked = function( point, controlName) {
      var msg,
          control = findControl(point, controlName)

      if(!point){
        msg = 'No point found'
        $scope.alerts = [{ type: 'danger', message: msg}]
        return
      } else if (!control){
        msg = 'Control "' + controlName + '" not found on point ' + point.name
        $scope.alerts = [{ type: 'danger', message: msg}]
        return
      } else if(control.commandType !== 'CONTROL'){
        msg = 'Command "' + controlName + '" on point ' + point.name + ' is not a control. Type is ' + control.commandType
        $scope.alerts = [{ type: 'danger', message: msg}]
        return
      }

      control.executing = true
      gbCommandRest.select('ALLOWED', [control.id]).then(
        function(lock) {
          gbCommandRest.execute(control.id, {commandLockId: lock.id}).then(
            function (commandResult) {
              control.executing = false
            },
            function (ex, statusCode, headers, config) {
              console.log('gbSchematci.controlClicked:execute ' + JSON.stringify(ex))
              control.executing = false
              msg = 'Execute failed for control "' + controlName + '" on point ' + point.name + ' - ' + getMessageFromException(ex)
              $scope.alerts = [{ type: 'danger', message: msg}]
            }
          )
        },
        function(ex, statusCode, headers, config) {
          control.executing = false
          msg = 'Failed to auto-select control "' + controlName + '" on point ' + point.name + ' - ' + getMessageFromException(ex)
          $scope.alerts = [{ type: 'danger', message: msg}]
        }
      )
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

    // Directive sets symbols after getting SVG content.
    //
    $scope.$watch('symbols', function(newValue) {
      var pointNames

      if( newValue !== undefined) {
        measurementDecimals = newValue.options.measurementDecimals
        pointNames = newValue.pointNames

        console.log( 'gbSchematicController: got pointNames.length: ' + pointNames.length)
        // TODO: unsubscribe from previous schematic's points. Could optimize for large overlaps in points when schematic changes.
        if( pointNames.length > 0) {
          schematic.getPointsByName( pointNames).then(
            function( response) {
              // We get the points that exist. If some points don't exist, the values remain as XXXX and invalid quality.
              $scope.points = response.data
              pointIdMap = processPointsAndReturnPointIdMap($scope.points)
              // TODO: what about the old names in the map?
              $scope.points.forEach( function( p) { $scope.pointNameMap[p.name] = p})
              var pointIds = Object.keys(pointIdMap)

              measurement.subscribe( $scope, pointIds, {}, self, onMeasurements, onError)
              getCommandsForPoints( pointIds)  // TODO: does nothing for now.

              return response // for the then() chain
            },
            function( error) {
              var message = 'Error getting points by name - status: ' + error.status + ', statusText: ' + error.statusText
              console.error( 'gbSchematicController: ' + message)
              $scope.alerts = [{ type: 'danger', message: message}]
              return error
            }
          )
        }
        $scope.loading = false
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

          // TODO: if status measurement, check if not one of the symbol's states, then display Unknown state.
          // TODO: if status measurement is invalid quality, show invalid 'X' over center of symbol. Also for questionable quality.
          point.currentMeasurement = processMeasurement( pm.measurement)

        } else {
          console.error('gbSchematicController.onMeasurements could not find point.id = ' + pm.point.id)
        }
      })
    }
    function onError(error, message) {
      console.error( 'gbSchematicController.subscribe.onError: ' + error + ', message = ' + JSON.stringify( message))
      $scope.alerts = [{ type: 'danger', message: error}]
    }

    function processPointsAndReturnPointIdMap(points) {
      var idMap           = {},
          currentMeasurement = {
            value:        'XXXXXXXX', // start with XXX in case point ID is wrong.
            time:         null,
            shortQuality: '',
            longQuality:  '',
            validity:     'INVALID', // start as invalid in case point ID is wrong.
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
        if( point.pointType === 'STATUS')
          point.currentMeasurement.value = 'Unknown'

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
           if( point ) {
             // TODO: see measurement.getCommandsForPoints
             point.commands = data[pointId]
           }
           else
             console.error( 'gbSchematicController.getCommandsForPoints Unknown point ID ' + pointId)
         }

       }
      )
    }


    function subscribe() {
      if( !equipmentId)
        return

      return schematic.subscribe( equipmentId, $scope,
        function( subscriptionId, content, eventType) {
          $scope.svgSource = content  // directive is watching this and will parse SVG and set $scope.symbols.
          $scope.$digest()
        },
        function( error, message) {
          $scope.alerts = [{ type: 'danger', message: error}]
          $scope.loading = false
          $scope.$digest()
        }
      )
    }

    subscribe()


  }]).

  directive('gbEquipmentSchematic', [ '$compile', 'schematic', function( $compile, schematic) {
    return {
      restrict: 'E',
      scope:    true,
      controller: 'gbSchematicController',
      templateUrl: 'greenbus.views.template/schematic/equipmentSchematic.html',
      link: function (scope, elem, attrs) {
        var symbolElements

        // The controller does the subscription and we add the SVG schematic to the DOM.
        scope.$watch('svgSource', function(newValue) {
          if( newValue !== undefined) {
            var elemChild, svg, symbols, pointNames

            elemChild = elem.find('.gb-equipment-schematic')
            svg = $.parseHTML( newValue)
            schematic.updateSvgElementAttributesToScaleToFitParentDiv( svg)
            schematic.ensureQualitySymbolsInDefs( svg)
            elemChild.prepend(svg)
            symbolElements = schematic.parseElements( elemChild)
            symbols = schematic.bindSymbols( symbolElements)

            $compile(svg)(scope);
            scope.symbols = symbols
          }
        })

      }
    };
  }]).

  filter('schematicValidityToHref', function() {
    return function(validity) {
      switch( validity ) {
        case 'GOOD':         return '#quality_good';
        case 'QUESTIONABLE': return '#quality_questionable';
        case 'INVALID':      return '#quality_invalid';
        default:
          return '#quality_invalid';
      }
    };
  }).

  filter('schematicControlExecutingClasses', function() {
    return function(executing) {
      if( executing)
        return 'control-spinner gb-executing'
      else
        return 'control-spinner ng-hide'
    };
  })//.

  // Was being used for modal with list of issues.
  //filter('schematicIssueIcon', function() {
  //  return function(validity) {
  //    switch( validity ) {
  //      case 'error':         return 'fa fa-times-circle gb-icon-error';
  //      case 'warning': return 'fa fa-exclamation-triangle gb-icon-warn';
  //      case 'information':    return 'fa fa-info-circle gb-icon-ok'
  //      default:
  //        return 'fa fa-exclamation-triangle';
  //    }
  //  };
  //})


