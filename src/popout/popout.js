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


angular.module('greenbus.views.popout', []).

  controller( 'gbPopoutController', ['$scope', '$state', '$stateParams', '$window',
    function( $scope, $state, $stateParams, $window) {

      $scope.popout = function() {
        var stateHref = $scope.stateHref || $state.href($state.current.name, $stateParams),
            href = $scope.href || 'popout/', // Relative to current app's href.
            fullHref = href + stateHref
        console.log( 'mmcMicrogridController.tabSetPopout() url=' + href)
        $window.open(fullHref, '_blank', $scope.windowParams)
      }
    }
  ]).

  /**
   *
   * @param href - App to open. Defaults to 'popout/' which is relative to current app.
   * @param stateHref - $state to open. Defaults to 'popout/' which is relative to current app.
   * @param windowParams - 3rd parameter for window.open() which forces a new window.
   *                       Example: 'resizeable,top=100,left=100,height=400,width=600,location=no,toolbar=no'
   */
  directive( 'gbPopout', function(){
    return {
      restrict: 'E', // Element name
      // The template HTML will NOT replace the directive.
      replace: false,
      scope: {
             href  : '=?',
             stateHref: '=?',
             windowParams: '=?'
      },
      templateUrl: 'greenbus.views.template/popout/popout.html',
      controller: 'gbPopoutController'
    }
  })
