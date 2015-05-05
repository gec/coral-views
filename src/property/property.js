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
 * A table of key/value properties for one piece of equipment.
 */
angular.module('greenbus.views.property', [ 'ui.router', 'greenbus.views.rest', 'greenbus.views.subscription']).

  controller('gbPropertiesTableController', ['$scope', '$stateParams', 'rest', 'subscription',
    function($scope, $stateParams, rest, subscription) {
      var equipmentId, subscriptionId,
          self = this,
          microgridId       = $stateParams.microgridId,
          navigationElement = $stateParams.navigationElement

      $scope.properties = []

      // Initialized from URL or menu click or both
      //
      if( ! navigationElement)
        return

      addTypesToPropertiesList()

      var onePieceOfEquipment = navigationElement.equipmentChildren.length === 0
      if( !onePieceOfEquipment) {
        console.error( 'gbPropertiesTableController: more than one child: navigationElement.equipmentChildren.length = ' + navigationElement.equipmentChildren.length)
        return
      }

      equipmentId = navigationElement.id

      function addTypesToPropertiesList() {
        if( navigationElement.types)
          $scope.properties.push( {
            key: 'types',
            value: navigationElement.types.join( ', ')
          })
      }

      function findProperty( property) {
        var i
        for( i = 0; i < $scope.properties.length; i++) {
          var prop = $scope.properties[i]
          if( properties.key === prop.key)
            return prop
        }
        return undefined
      }

      function compare(a,b) {
        if (a.key < b.key)
          return -1;
        if (a.key > b.key)
          return 1;
        return 0;
      }

      function applyIsObject( property) {
        property.isObject = angular.isObject( property.value)
      }

      function updateOrAddProperty( property) {
        var currentProperty = findProperty( property.key)
        if( currentProperty) {
          currentProperty.value = property.value
          applyIsObject( currentProperty)
        }
        else {
          $scope.properties.push( property)
          $scope.properties.sort( compare)
        }
      }

      function subscribeToProperties() {

        var json = {
          subscribeToProperties: {
            entityId:  equipmentId
          }
        }

        subscriptionId = subscription.subscribe( json, $scope,
          function( subscriptionId, type, data) {

            switch( type) {
              case 'property':
                updateOrAddProperty( data)
                break
              case 'properties':
                $scope.properties = data
                addTypesToPropertiesList()
                $scope.properties.forEach( applyIsObject)
                $scope.properties.sort( compare)
                break
              default:
                console.error( 'gbPropertiesTableController: unknown type "' + type + '" from subscription notification')
            }
            $scope.$digest()
          },
          function(error, message) {
            console.error('gbPropertiesTableController.subscribe ' + error + ', ' + message)
          }
        )
      }

      subscribeToProperties()
    }
  ]).

  directive('gbPropertiesTable', function() {
    return {
      restrict:    'E', // Element name
      // The template HTML will replace the directive.
      replace:     true,
      scope:       true,
      templateUrl: 'greenbus.views.template/property/propertiesTable.html',
      controller:  'gbPropertiesTableController'
    }
  })


