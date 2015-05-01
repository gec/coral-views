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
 * A piece of equipment may have multiple tabs including: Measurements, Properties (aka. key/value), Schematic, etc.
 */
angular.module('greenbus.views.equipment', [ 'ui.router']).

  controller('gbEquipmentController', ['$scope', '$stateParams',
    function($scope, $stateParams) {
      var self = this,
          microgridId       = $stateParams.microgridId,
          navigationElement = $stateParams.navigationElement

      $scope.shortName = 'loading...'
      $scope.tabs = {
        measurements: false,
        properties: false
      }

      // Initialized from URL or menu click or both
      //
      if( ! navigationElement)
        return

      $scope.shortName = navigationElement.shortName

      var onePieceOfEquipment = navigationElement.equipmentChildren.length === 0
      $scope.tabs = {
        measurements: true,
        properties: onePieceOfEquipment
      }
    }
  ]).

  directive('gbEquipment', function() {
    return {
      restrict:    'E', // Element name
      scope:       true,
      templateUrl: 'greenbus.views.template/equipment/equipment.html',
      controller:  'gbEquipmentController'
    }
  })


