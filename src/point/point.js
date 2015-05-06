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


/**
 * A table of points for the current equipment in $stateParams.
 */
angular.module('greenbus.views.point', [ 'ui.router', 'greenbus.views.equipment']).

  controller('gbPointsTableController', ['$scope', '$stateParams', 'equipment',
    function($scope, $stateParams, equipment) {
      var self = this,
          microgridId       = $stateParams.microgridId,
          navigationElement = $stateParams.navigationElement

      $scope.points = []

      // Initialized from URL or menu click or both
      //
      if( ! navigationElement)
        return
      var promise = $scope.pointsPromise || equipment.getCurrentPoints( true)
      $scope.points = promise.then(
        function( response) {
          $scope.points = response.data
          return response // for the then() chain
        },
        function( error) {
          return error
        }
      )

    }
  ]).

  directive('gbPointsTable', function() {
    return {
      restrict:    'E', // Element name
      // The template HTML will replace the directive.
      replace:     true,
      scope: {
        pointsPromise: '=?'
      },
      templateUrl: 'greenbus.views.template/point/pointsTable.html',
      controller:  'gbPointsTableController'
    }
  })


