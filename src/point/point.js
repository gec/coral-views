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

function GBNameSortAscending( a, b) {
  var aName=a.name.toLowerCase(),
      bName=b.name.toLowerCase()
  return aName < bName ? -1
    : aName > bName ? 1
    : 0
}
/**
 * A table of points for the current equipment in $stateParams.
 */
angular.module('greenbus.views.point', [ 'ui.router', 'greenbus.views.equipment', 'greenbus.views.pager']).

  factory('pointPageRest', ['equipment', function( equipment) {

    /**
     * Get the next page after startAfterId (ordered by point name).
     *
     * @param ids Array of alarm IDs
     * @param newState Examples; 'UNACK_SILENT','ACKNOWLEDGED'
     */
    function pageNext( startAfterId, limit, success, failure) {
      return pageDo( startAfterId, limit, success, failure, true)
    }

    /**
     * Get the previous page before startAfterId (ordered by point name).
     *
     * @param startAfterId
     * @param limit Number of items to get
     * @param success Success callback
     * @param failure Failure callback
     */
    function pagePrevious( startAfterId, limit, success, failure) {
      return pageDo( startAfterId, limit, success, failure, false)
    }

    /**
     *
     * @param startAfterId
     * @param limit Number of items to get
     * @param success Success callback
     * @param failure Failure callback
     * @param ascending boolean T: paging forwards by name, F: paging backwards.
     */
    function pageDo( startAfterId, limit, success, failure, ascending) {
      var promise = equipment.getPoints( true, limit, startAfterId, ascending)
      promise.then(
        function( response) {
          success( response.data)
          return response // for the then() chain
        },
        function( error) {
          console.error( 'gbPointsTableController.pageDo Error ' + error.statusText + ', startAfterId: ' + startAfterId + ', ascending:' + ascending)
          $scope.alerts = [{ type: 'danger', message: error.statusText}]
          failure( startAfterId, limit, error.data, error.status)
          return error // for the then() chain
        }
      )

      return promise
    }

    /**
     * Public API
     */
    return {
      pageNext: pageNext,
      pagePrevious: pagePrevious
    }
  }]).


  controller('gbPointsTableController', ['$scope', '$attrs', '$stateParams', 'equipment', 'pointPageRest',
    function($scope, $attrs, $stateParams, equipment, pointPageRest) {
      var self = this,
          microgridId       = $stateParams.microgridId,
          navigationElement = $stateParams.navigationElement

      var pageSize = Number( $scope.pageSize || 20),
          subscriptionView = new GBSubscriptionView( pageSize, pageSize * 4, undefined, GBNameSortAscending)
      $scope.points = subscriptionView.items
      $scope.pageState = GBSubscriptionViewState.FIRST_PAGE
      $scope.alerts = []
      $scope.searchText = ''


      function updatePointTypesStrings() {
        $scope.points.forEach( function(p) {p.typesString = p.types.join( ', ')})
      }

      // Paging functions
      //
      function pageNotify( state, oldItems) {
        $scope.pageState = state
        updatePointTypesStrings()
      }
      $scope.pageFirst = function() {
        $scope.pageState = subscriptionView.pageFirst()
      }
      $scope.pageNext = function() {
        $scope.pageState = subscriptionView.pageNext( pointPageRest, pageNotify)
      }
      $scope.pagePrevious = function() {
        $scope.pageState = subscriptionView.pagePrevious( pointPageRest, pageNotify)
      }

      $scope.closeAlert = function(index) {
        if( index < $scope.alerts.length)
          $scope.alerts.splice(index, 1)
      }

      // Initialized from URL or menu click or both
      //
      if( ! navigationElement)
        return
      var promise = $scope.pointsPromise || equipment.getPoints( true, pageSize)
      promise.then(
        function( response) {
          subscriptionView.onMessage( response.data)
          $scope.loading = false
          updatePointTypesStrings()
          return response // for the then() chain
        },
        function( error) {
          console.error( 'gbPointsTableController. Error ' + error.statusText)
          $scope.alerts = [{ type: 'danger', message: error.statusText}]
          return error
        }
      )


      $scope.search = function(point) {
        var s = $scope.searchText.trim()
        if( s === undefined || s === null || s.length === 0 )
          return true
        s = s.toLowerCase()

        return point.name.toLowerCase().indexOf(s) !== -1 ||
          point.unit.toLowerCase().indexOf(s) !== -1 ||
          point.pointType.toLowerCase().indexOf(s) !== -1 ||
          point.typesString.toLowerCase().indexOf(s) !== -1
      }

    }
  ]).

  directive('gbPointsTable', function() {
    return {
      restrict:    'E', // Element name
      // The template HTML will replace the directive.
      replace:     true,
      scope: {
        pointsPromise: '=?',
        pageSize: '=?'
      },
      templateUrl: 'greenbus.views.template/point/pointsTable.html',
      controller:  'gbPointsTableController'
    }
  })


