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

    self.updateSelectAllState = function() {
      var oldSelectAllState = $scope.selectAllState
      if( $scope.selectCount === 0 )
        $scope.selectAllState = SELECT_UNCHECKED
      else if( $scope.model && $scope.selectCount >= $scope.model.length )
        $scope.selectAllState = SELECT_CHECKED
      else
        $scope.selectAllState = SELECT_PARTIAL

      if( $scope.selectAllState !== oldSelectAllState)
        self.notifyParent( $scope.selectAllState)
    }

    /**
     * Check or uncheck item.
     * @param item  The item to check or uncheck
     * @param newState If undefined, toggle selection. If defined set to that state.
     */
    self.selectItem = function(item, newState) {
      var currentState = item.checked || SELECT_UNCHECKED

      if( newState === undefined)
        newState = SELECT_NEXT_STATE[ currentState]

      if( currentState !== newState) {

        item.checked = newState
        if( item.checked === SELECT_CHECKED )
          $scope.selectCount++
        else
          $scope.selectCount--

        // Just in case
        if( $scope.selectCount < 0)
          $scope.selectCount = 0

        self.updateSelectAllState()
      }

    }

    self.uncheckItem = function(item) {
      if( item.checked) {
        if( $scope.selectCount > 0 )
          $scope.selectCount--
        item.checked = false

        self.updateSelectAllState()
      }
    }

    $scope.selectAll = function() {
      if( !$scope.model || $scope.model.length === 0)
        return

      $scope.selectAllState = SELECT_NEXT_STATE[ $scope.selectAllState]
      // if check, check visible. If uncheck, uncheck all.
//      var ps = $scope.selectAllState === SELECT_CHECKED ? $scope.pointsFiltered : $scope.model
      var ps =$scope.model

      $scope.selectCount = $scope.selectAllState === SELECT_CHECKED ? ps.length : 0
      for( var i = ps.length - 1; i >= 0; i-- ) {
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
      templateUrl: 'greenbus.views.template/selection/selectAll.html',
      controller: 'gbSelectAllController',
      link: function(scope, element, attrs, controller) {
        var selectItem = attrs.selectItem || 'selectItem'
        scope.$parent[selectItem] = controller.selectItem
        scope.$parent.uncheckItem = controller.uncheckItem
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



