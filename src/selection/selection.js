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


angular.module('greenbus.views.selection', []).

  controller( 'gbSelectAllController', ['$scope', function( $scope) {
    var self = this
    var SELECT_UNCHECKED = 0,
        SELECT_CHECKED = 1,
        SELECT_PARTIAL = 2,
        SELECT_NEXT_STATE = [1, 0, 0]
    $scope.selectAllState = SELECT_UNCHECKED
    $scope.selectCount = 0


    self.selectItem = function(item) {
      item.checked = item.hasOwnProperty( 'checked') ? SELECT_NEXT_STATE[ item.checked] : SELECT_CHECKED
      if( item.checked === SELECT_CHECKED )
        $scope.selectCount++
      else
        $scope.selectCount--

      var oldSelectAllState = $scope.selectAllState
      if( $scope.selectCount === 0 )
        $scope.selectAllState = SELECT_UNCHECKED
      else if( $scope.selectCount >= $scope.model.length - 1 )
        $scope.selectAllState = SELECT_CHECKED
      else
        $scope.selectAllState = SELECT_PARTIAL

      if( $scope.selectAllState !== oldSelectAllState)
        self.notifyParent( $scope.selectAllState)
    }

    $scope.selectAll = function() {
      $scope.selectAllState = SELECT_NEXT_STATE[ $scope.selectAllState]
      // if check, check visible. If uncheck, uncheck all.
//      var ps = $scope.selectAllState === SELECT_CHECKED ? $scope.pointsFiltered : $scope.model
      var ps =$scope.model
      var i = ps.length - 1
      $scope.selectCount = $scope.selectAllState === SELECT_CHECKED ? i : 0
      for( ; i >= 0; i-- ) {
        var item = ps[ i]
        item.checked = $scope.selectAllState
      }
      self.notifyParent( $scope.selectAllState)
    }

  }]).

  directive( 'gbSelectAll', function(){
    return {
      restrict: 'E', // Element name
      // The template HTML will replace the directive.
      replace: true,
      transclude: true,
      scope: {
             model  : '=',
             notify: '&'
      },
      templateUrl: 'template/selection/selectAll.html',
      controller: 'gbSelectAllController',
      link: function(scope, element, attrs, controller) {
        var selectItem = attrs.selectItem || 'selectItem'
        scope.$parent[selectItem] = controller.selectItem
        controller.notifyParent = function( state) {
          scope.notify( {state: state})
        }
      }
    }
  }).

  filter('selectItemClass', function() {
    return function(checked) {
      switch( checked) {
        case 0: return 'fa fa-square-o text-muted'
        case 1: return 'fa fa-check-square-o'
        case 2: return 'fa fa-minus-square-o'
        default: return 'fa fa-square-o'
      }
    };
  })



