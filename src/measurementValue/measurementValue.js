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

  controller( 'gbMeasurementValueController', ['$scope', function( $scope) {
    var self = this
    $scope.editMode = false
    $scope.canRemove = false
    $scope.canNis = false
    $scope.removeTooltip = undefined // Remove NIS, Remove Replace
    $scope.placeHolder = ''


    self.uncheckItem = function(item) {
    }

    self.configureInput = function() {
      var m = $scope.model.currentMeasurement
      switch( m.shortQuality) {
        case 'R':
          $scope.canRemove = true
          $scope.canNis = true
          $scope.removeTooltip = 'Remove replace'
          break
        case 'N':
          $scope.canRemove = true
          $scope.canNis = false
          $scope.removeTooltip = 'Remove NIS'
          break
        default:
          $scope.canRemove = false
          $scope.canNis = true
          $scope.removeTooltip = undefined
          break
      }

      // set focus and select text
    }

    self.getRemoveTooltip = function() {
      var m = $scope.model.currentMeasurement
      switch( m.shortQuality) {
        case 'R': return $scope.removeTooltip = 'Remove replace'
        case 'N': return $scope.removeTooltip = 'Remove NIS'
        default: return $scope.removeTooltip = undefined
      }
    }

    $scope.nis = function() {
      var m = $scope.model.currentMeasurement
      if( m.shortQuality !== 'R' && m.shortQuality !== 'N') {

      }

    }
    $scope.replace = function() {

    }
    $scope.remove = function() {
      var m = $scope.model.currentMeasurement
      if( m.shortQuality === 'R' || m.shortQuality === 'N') {

      }

    }
    $scope.onBlur = function() {

    }
    $scope.onFocus = function() {

    }

    $scope.edit = function() {
      if( $scope.editMode)
        return

      $scope.editMode = true
      $scope.value = $scope.model.currentMeasurement.value
      $scope.removeTooltip = self.getRemoveTooltip()
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
          if ( ! scope.editMode) {
            scope.edit()
            scope.$digest()

            this.select();
            focusedElement = this;
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
  })


