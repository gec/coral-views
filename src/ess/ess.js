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

angular.module('greenbus.views.ess', ['greenbus.views.measurement', 'greenbus.views.navigation', 'greenbus.views.rest']).
  
  controller( 'gbEssesController', ['$scope', '$filter', '$stateParams', 'rest', 'measurement', '$location', function( $scope, $filter, $stateParams, rest, measurement, $location) {
    var PT = {
          Point: 'Point',
          Power: 'OutputPower',
          EnergyCapacity: 'EnergyCapacity',
          PowerCapacity: 'PowerCapacity',
          PercentSoc: '%SOC',
          Standby: 'Standby'
        },
        TypeToVarMap = {
          OutputPower: 'power',
          EnergyCapacity: 'energyCapacity',
          PowerCapacity: 'powerCapacity',
          '%SOC': 'percentSoc',
          Standby: 'standby'
        }

    $scope.ceses = []     // our mappings of data from the server
    $scope.searchText = ''
    $scope.sortColumn = 'name'
    $scope.reverse = false
    var pointIdToInfoMap = {},
        searchArgs = $location.search(),
        sourceUrl = searchArgs.sourceUrl || null

    var microgridId       = $stateParams.microgridId,
        navigationElement = $stateParams.navigationElement

    // Initialized from URL or menu click or both
    //
    if( ! navigationElement)
      return

    var equipment = navigationElement.equipmentChildren,
        equipmentIds = [],
        equipmentIdMap = {}
    equipment.forEach( function( eq) {
      equipmentIdMap[eq.id] = eq
      equipmentIds.push( eq.id)
    })


    var number = $filter('number')
    function formatNumberValue( value) {
      if ( typeof value == 'boolean' || isNaN( value) || !isFinite(value) || value === '') {
        return value
      } else {
        return number( value, 0)
      }
    }
    function formatNumberNoDecimal( value) {
      if ( typeof value == 'boolean' || isNaN( value) || !isFinite(value) || value === '')
        return value

//      if( typeof value.indexOf === 'function') {
//        var decimalIndex = value.indexOf('.')
//        value = value.substring( 0, decimalIndex)
//      } else {
//        value = Math.round( parseFloat( value))
//      }
      value = Math.round( parseFloat( value))

      return value
    }

    $scope.findPoint = function( id) {
      $scope.ceses.forEach( function( point) {
        if( id == point.id)
          return point
      })
      return null
    }

    function getValueWithinRange( value, min, max) {
      if( value < min)
        value = min
      else if( value > max)
        value = max
      return value
    }

    function processValue( info, pointMeasurement) {
      var value = pointMeasurement.value

      switch (info.type) {
        case PT.PercentSoc:
          value = formatNumberNoDecimal( value);
          break;
        case PT.EnergyCapacity:
        case PT.PowerCapacity:
          value = formatNumberValue( value) + ' ' + info.unit;
          break;
        case PT.Power:
          value = formatNumberValue( value) + ' ' + info.unit;
          break;
        default:
      }
      return value
    }

    // Return standby, charging, or discharging
    function getState( ess) {
      if( ess.standby === 'OffAvailable' || ess.standby === 'true')
        return 'standby';
      else if( typeof ess.power == 'boolean')
        return ess.power ? 'charging' : 'discharging';
      else if( typeof ess.power.indexOf === 'function') {
        // It's a string value + space + unit.
        if( ess.power.indexOf('-') === 0) // has minus sign, so it's charging
          return 'charging';
        else if( ess.power.indexOf('0 ') === 0)
          return 'standby';
        else
          return 'discharging'
      }

      return ''
    }

    //function makeCes( eq, capacityUnit) {
    function makeCes( eq) {
      return {
        name: eq.name,
        energyCapacity: '',
        powerCapacity: '',
        standby: '',
        power: '',
        percentSoc: '',
        percentSocMax100: 0, // Used by batter symbol
        standbyOrOnline: '', // 'Standby', 'Online'
        state: 's'    // 'standby', 'charging', 'discharging'
      }
    }

    var POINT_TYPES =  [PT.PercentSoc, PT.Power, PT.Standby, PT.EnergyCapacity, PT.PowerCapacity]
    function getInterestingType( types) {
      for( var index = types.length-1; index >= 0; index--) {
        var typ = types[index]
        switch( typ) {
          case PT.PercentSoc:
          case PT.Power:
          case PT.Standby:
          case PT.PowerCapacity: // kW
          case PT.EnergyCapacity: // kWh
            return typ
          default:
        }
      }
      return null
    }
    function getPointByType( points, typ ) {
      for( var index = points.length-1; index >= 0; index-- ) {
        var point = points[index]
        if( point.types.indexOf( typ) >= 0)
          return point
      }
      return null
    }

    function onMeasurement( pm) {
      var info = pointIdToInfoMap[ pm.point.id]
      if( info){
        console.log( 'gbEssController.onMeasurement ' + pm.point.id + ' "' + pm.measurement.value + '"')
        // Map the point.name to the standard types (i.e. capacity, standby, charging)
        var value = processValue( info, pm.measurement)
        if( info.type == PT.Standby) {
          if( value === 'OffAvailable' || value === 'true')
            $scope.ceses[ info.cesIndex].standbyOrOnline = 'Standby'
          else
            $scope.ceses[ info.cesIndex].standbyOrOnline = 'Online'
        } else if( info.type == PT.PercentSoc) {
          $scope.ceses[ info.cesIndex].percentSocMax100 = Math.min( value, 100)
        }
        $scope.ceses[ info.cesIndex][ TypeToVarMap[info.type]] = value
        $scope.ceses[ info.cesIndex].state = getState( $scope.ceses[ info.cesIndex])

      } else {
        console.error( 'gbEssesController.onMeasurement could not find point.id = ' + pm.point.id)
      }
    }

    function onMeasurements( measurements ) {
      measurements.forEach( function( pm){ onMeasurement( pm) })
      $scope.$digest()
    }

    function subscribeToMeasurements( pointIds) {
      measurement.subscribe( $scope, pointIds, {}, self, onMeasurements)
    }


    // Called after get sourceUrl is successful
    function getPointsForEquipmentAndSubscribeToMeasurements( ) {
      var cesIndex, pointsUrl,
          pointIds = [],
          pointTypesQueryParams = rest.queryParameterFromArrayOrString( 'pointTypes', POINT_TYPES),
          equipmentIdsQueryParams = rest.queryParameterFromArrayOrString('equipmentIds', equipmentIds)


      pointsUrl = '/models/1/points?' + equipmentIdsQueryParams + '&' + pointTypesQueryParams
      rest.get( pointsUrl, 'points', $scope, function( data) {
        var sampleData = {
          'e57170fd-2a13-4420-97ab-d1c0921cf60d': [
            {
              'name': 'MG1.CES1.ModeStndby',
              'id': 'fa9bd9a1-5ad1-4c20-b019-261cb69d0a39',
              'types': [PT.Point, PT.Standby]
            },
            {
              'name': 'MG1.CES1.CapacitykWh',
              'id': '585b3e36-1826-4d7b-b538-d2bb71451d76',
              'types': [PT.EnergyCapacity, PT.Point]
            },
            {
              'name': 'MG1.CES1.ChgDischgRate',
              'id': 'ec7d6f06-e627-44d2-9bb9-530541fdcdfd',
              'types': [PT.Power, PT.Point]
            }
          ]}

        equipmentIds.forEach( function( eqId) {
          var point,
              points = data[eqId],
              cesIndex = $scope.ceses.length

          if( points) {
            POINT_TYPES.forEach( function( typ) {
              point = getPointByType( points, typ)
              if( point) {
                console.log( 'gbEssesController.getPointsForEquipmentAndSubscribeToMeasurements point: name=' + point.name + ', types = ' + point.types)
                pointIdToInfoMap[point.id] = {
                  'cesIndex': cesIndex,
                  'type': getInterestingType( point.types),
                  'unit': point.unit
                }
                pointIds.push( point.id)
              } else {
                console.error( 'gbEssesController.getPointsForEquipmentAndSubscribeToMeasurements  GET /models/n/points entity[' + eqId + '] does not have point with type ' + typ)
              }

            })
            $scope.ceses.push( makeCes( equipmentIdMap[eqId]))
          } else {
            console.error( 'gbEssesController.getPointsForEquipmentAndSubscribeToMeasurements  GET /models/n/points did not return UUID=' + eqId)
          }
        })

        measurement.subscribe( $scope, pointIds, {}, self, onMeasurements)
      })

    }

    //var eqTypes = rest.queryParameterFromArrayOrString( 'eqTypes', ['ESS'])
    //var pointTypes = rest.queryParameterFromArrayOrString( 'pointTypes', POINT_TYPES)
    //var url = '/equipmentwithpointsbytype?' + eqTypes + '&' + pointTypes
    //rest.get( sourceUrl, 'equipment', $scope, getPointsForEquipmentAndSubscribeToMeasurements);

    getPointsForEquipmentAndSubscribeToMeasurements()
  }]).


  directive( 'gbEsses', function(){
    return {
      restrict: 'E', // Element name
      // The template HTML will replace the directive.
      replace: true,
      transclude: true,
      scope: true,
      templateUrl: 'greenbus.views.template/ess/esses.html',
      controller: 'gbEssesController'
    }
  }).

  filter('essStateIcon', function() {
    return function(state) {
      if( state === 'standby')
        return '/images/essStandby29x16.png'
      else if( state === 'charging')
        return '/images/essCharging29x16.png'
      else if( state === 'discharging')
        return '/images/essDischarging29x16.png'
      else
        return ''
    };
  }).
  filter('essStateDescription', function() {
    return function(state) {
      return state + ' state';
    };
  }).
  filter('essBatterySocChargedClass', function() {
    return function(soc, state) {
      var classes = ( soc > 10 ) ? 'battery-soc charged' : 'battery-soc charged alarmed'
      if( state === 'standby' )
        classes += ' standby'
      return classes
    };
  }).
  filter('essBatterySocUnchargedClass', function() {
    return function(soc, state) {
      var classes = null
      if( soc === null || soc === '' )
        classes = 'battery-soc unknown'
      else if( soc > 10 )
        classes = 'battery-soc uncharged'
      else
        classes = 'battery-soc uncharged alarmed'

      if( state === 'standby')
        classes += ' standby'

      return classes
    };
  })

