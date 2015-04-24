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


angular.module('greenbus.views.measurementValue', []).

  factory('gbMeasurementValueRest', ['rest', function( rest) {

    /**
     * Override measurements for a point.
     *
     * @param pointId Point ID to be overridden
     * @param value The new value as a string
     * @param valueType The type of the value to override. BOOL, INT, DOUBLE, STRING
     * @param success Success callback
     * @param failure Failure callback
     */
    function override( pointId, value, valueType, callee, success, failure) {

      var arg = {
            value: value,
            valueType: valueType
          },
          url = '/models/1/points/' + pointId + '/override'

      rest.post( url, arg, null, null,
        function( data) {
          success.call( callee, data)
        },
        function( ex, statusCode, headers, config){
          console.log( 'gbMeasurementValueRest ERROR overriding point with ID: ' + pointId + ' to value "' + value + '" with type: "' + valueType + '". Exception: ' + ex.exception + ' - ' + ex.message)
          failure.call( callee, pointId, ex, statusCode)
        }
      )

      return true
    }

    /**
     * Put a point NIS (Not In Service)
     *
     * @param pointId Point ID to be overridden
     */
    function nis( pointId, callee, success, failure) {

      var arg,
          url = '/models/1/points/' + pointId + '/nis'

      rest.post( url, arg, null, null,
        function( data) {
          success.call( callee, data)
        },
        function( ex, statusCode, headers, config){
          console.log( 'gbMeasurementValueRest ERROR setting NIS point with ID: ' + pointId + '. Exception: ' + ex.exception + ' - ' + ex.message)
          failure.call( callee, pointId, ex, statusCode)
        }
      )

      return true
    }

    /**
     * Remove a point's override or NIS (Not In Service)
     *
     * @param pointId Point ID to remove the override or NIS.
     */
    function remove( pointId, callee, success, failure, nisOrOverride) {

      var url = '/models/1/points/' + pointId + '/' + nisOrOverride

      rest.delete( url, null, null,
        function( data) {
          success.call( callee, data)
        },
        function( ex, statusCode, headers, config){
          console.log( 'gbMeasurementValueRest ERROR removing ' + nisOrOverride + ' on point with ID: ' + pointId + '. Exception: ' + ex.exception + ' - ' + ex.message)
          failure.call( callee, pointId, ex, statusCode)
        }
      )

      return true
    }

    function removeNis( pointId, callee, success, failure) { remove( pointId, callee, success, failure, 'nis')}
    function removeOverride( pointId, callee, success, failure) { remove( pointId, callee, success, failure, 'override')}


    /**
     * Public API
     */
    return {
      override: override,
      nis: nis,
      removeNis: removeNis,
      removeOverride: removeOverride
    }
  }]).

  controller( 'gbMeasurementValueController', ['$scope', 'gbMeasurementValueRest', '$timeout', function( $scope, gbMeasurementValueRest, $timeout) {
    var self = this
    
    // When editing === undefined, we are not editing the value. The value is a view only span.
    // When editing === {value: '', valueType: ''}, we are editing.
    //
    $scope.editing = undefined
    
    $scope.removeTooltip = undefined // Remove NIS, Remove Replace
    $scope.placeHolder = ''
    $scope.requestPending = undefined
    $scope.replyError = undefined

    function getValueTypeFromPointType() {
      if( ! $scope.model.pointType)
        return 'DOUBLE'

      switch( $scope.model.pointType) {
        case 'ANALOG': return 'DOUBLE'
        case 'STATUS': return 'BOOL'
        case 'COUNTER': return 'INT'
        default:
          return 'DOUBLE'
      }
    }
    function getValueType() {
      if( ! $scope.model.currentMeasurement)
        return getValueTypeFromPointType()

      var m = $scope.model.currentMeasurement
      if( ! m.type)
        return getValueTypeFromPointType()

      switch( m.type) {
        case 'DOUBLE': return m.type
        case 'INT': return m.type
        case 'STRING': return m.type
        case 'BOOL': return m.type
        default:
          return getValueTypeFromPointType()
      }
    }
    
    $scope.editStart = function() {
      if( $scope.editing)
        return

      $scope.editing = {
        value: $scope.model.currentMeasurement.value,
        valueType: getValueType()
      }
      $scope.removeTooltip = self.getRemoveTooltip()
    }
    
    function editEnd() {
      $scope.editing = undefined
      pendingEditEndCancel() // just in case
    }



    //self.configureInput = function() {
    //  var m = $scope.model.currentMeasurement
    //  switch( m.shortQuality) {
    //    case 'R':
    //      $scope.canRemove = true
    //      $scope.canNis = true
    //      $scope.removeTooltip = 'Remove replace'
    //      break
    //    case 'N':
    //      $scope.canRemove = true
    //      $scope.canNis = false
    //      $scope.removeTooltip = 'Remove NIS'
    //      break
    //    default:
    //      $scope.canRemove = false
    //      $scope.canNis = true
    //      $scope.removeTooltip = undefined
    //      break
    //  }
    //
    //  // set focus and select text
    //}

    self.getRemoveTooltip = function() {
      var m = $scope.model.currentMeasurement
      switch( m.shortQuality) {
        case 'R': return $scope.removeTooltip = 'Remove replace'
        case 'N': return $scope.removeTooltip = 'Remove NIS'
        default: return $scope.removeTooltip = undefined
      }
    }

    function beforeRequest( requestType ) {
      $scope.replyError = undefined
      $scope.requestPending = requestType
    }
    function afterRequestSuccessful( requestType ) {
      $scope.replyError = undefined
      $scope.requestPending = undefined
      editEnd()
    }
    function afterRequestFailure( pointId, ex, statusCode ) {
      $scope.replyError = '"Exception: ' + ex.exception + ' - ' + ex.message
      $scope.requestPending = undefined
    }

    // If user clicks one of our buttons (NIS, Override, or Remove), then the input gets a blur event.
    // We don't want to end the edit mode in this case. We set a timeout to see if someone
    // did, in fact, click a button (or tab and a button got focus). If not, then we go ahead with
    // ending edit mode.
    //
    function pendingEditEndStart() {
      if( ! $scope.editing)
        return
      $scope.pendingEditEndTimer = $timeout( function() {
        $scope.editing = undefined
        $scope.pendingEditEndTimer = undefined
      }, 300)
    }
    function pendingEditEndCancel() {
      if( $scope.pendingEditEndTimer) {
        $timeout.cancel( $scope.pendingEditEndTimer)
        $scope.pendingEditEndTimer = undefined
      }
    }

    $scope.nis = function() {
      pendingEditEndCancel()
      if( $scope.requestPending)
        return false

      var m = $scope.model.currentMeasurement
      if( m.shortQuality !== 'R' && m.shortQuality !== 'N') {
        beforeRequest( 'nis')
        gbMeasurementValueRest.nis($scope.model.id, this, afterRequestSuccessful, afterRequestFailure)
      }
    }
    $scope.override = function() {
      pendingEditEndCancel()
      if( $scope.requestPending)
        return false

      var m = $scope.model.currentMeasurement
      beforeRequest( 'override')
      gbMeasurementValueRest.override($scope.model.id, $scope.editing.value, $scope.editing.valueType, this, afterRequestSuccessful, afterRequestFailure)
    }
    $scope.remove = function() {
      pendingEditEndCancel()
      if( $scope.requestPending)
        return false

      var m = $scope.model.currentMeasurement
      beforeRequest( 'remove')
      if( m.shortQuality === 'R')
        gbMeasurementValueRest.removeOverride($scope.model.id, this, afterRequestSuccessful, afterRequestFailure)
      else if( m.shortQuality === 'N')
        gbMeasurementValueRest.removeNis($scope.model.id, this, afterRequestSuccessful, afterRequestFailure)
      else {
        $scope.requestPending = undefined
        console.error( 'gbMeasurementValueController.remove measurement shortQuality must be R or N; but it is: "' + m.shortQuality + '"')
      }
    }
    $scope.inputKeyDown = function($event) {
      if( $event.keyCode === 27) // escape key
        editEnd()
    }
    $scope.inputOnFocus = function() {
      pendingEditEndCancel()
    }
    $scope.buttonOnFocus = function() {
      pendingEditEndCancel()
    }

    $scope.inputOnBlur = function() {
      pendingEditEndStart()
    }
    $scope.buttonOnBlur = function() {
      pendingEditEndStart()
    }

  }]).

  directive( 'gbMeasurementValue', function(){
    return {
      restrict: 'E', // Element name
      // The template HTML will replace the directive.
      replace: true,
      scope: {
             model  : '=',
             notify: '&'
      },
      templateUrl: 'greenbus.views.template/measurementValue/measurementValue.html',
      controller: 'gbMeasurementValueController',
      link: function(scope, element, attrs, controller) {
        var focusedElement
        element.on('click', function () {
          console.log( 'gbMeasurementValue onClick')
          if ( ! scope.editing) {
            scope.editStart()
            scope.$digest()
            console.log( 'gbMeasurementValue onClick selecting input')
            var input = element.find( 'input')
            if( input && input.length > 0) {
              input[0].select()
              //if( input[0].selectionStart !== 0)
              //  input[0].setSelectionRange( 0, 9999)
              //if( input[0].hasOwnProperty('selectionStart')) {
              //  if( input[0].selectionStart !== 0)
              //    input[0].selectionStart = 0
              //}
              focusedElement = input[0];
            }
          }
        })
        element.on('blur', function () {
          focusedElement = null;
        })

        var selectItem = attrs.selectItem || 'selectItem'
        scope.$parent[selectItem] = controller.selectItem
        scope.$parent.uncheckItem = controller.uncheckItem
        controller.notifyParent = function( state) {
          scope.notify( {state: state})
        }
      }
    }
  }).

  filter('buttonDisabled', function() {
    return function(disabled, classes) {
      return disabled ? classes + ' disabled' : classes
    };
  })


