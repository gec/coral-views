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

angular.module('greenbus.views.ess', ['greenbus.views.measurement', 'greenbus.views.navigation', 'greenbus.views.rest', 'greenbus.views.subscription']).

  factory('gbEssesConstants', function() {
    return {
      Status: {                  // label,          managed
        Initializing: 0,         // 'Initializing', false
        EVDisconnected: 1,       // 'EVDisconnected', false
        Standby: 2,              // 'Standby', true
        Idle: 3,                 // 'Idle', true
        Charging: 4,             // 'Charging', true
        Discharging: 5,          // 'Discharging', true
        TrickleCharging: 6,      // 'TrickleCharging', true
        Busy: 7,                 // 'Busy', true
        Fault: 8,                // 'Fault', true
        Unknown: 9,              // 'Unknown', false
        IdleUnmanaged: 10,       // 'IdleUnmanaged', false
        ChargingUnmanaged: 11,   // 'ChargingUnmanaged', false
        DischargingUnmanaged: 12 // 'DischargingUnmanaged', false
      },
      StatusLabels: [
        'Initializing',
        'EVDisconnected',
        'Standby',
        'Idle',
        'Charging',
        'Discharging',
        'TrickleCharging',
        'Busy',
        'Fault',
        'Unknown',
        'IdleUnmanaged',
        'ChargingUnmanaged',
        'DischargingUnmanaged'
      ],
      Models: {
        PP_CA_30: 'CA-30',
        GEC_AGGREGATED_ESS_01:'AggregatedEss-01'
      }
    }
  }).

  controller( 'gbEssesController', ['$scope', '$filter', '$stateParams', 'rest', 'measurement', 'subscription', '$location', 'gbEssesConstants', function( $scope, $filter, $stateParams, rest, measurement, subscription, $location, constants) {
    var nameplateSubscriptionId,
        PT = {
          Point: 'Point',
          Power: 'OutputPower',
          PowerTarget: 'ChargeRateTarget',
          PercentSoc: '%SOC',
          Status: 'Status'//,
          //Standby: 'Standby'
        },
        TypeToVarMap = {
          OutputPower: 'power',
          '%SOC': 'percentSoc',
          Status: 'status'//,
          //Standby: 'standby'
        },
        POINT_TYPES =  [PT.PercentSoc, PT.Power, /*PT.Standby,*/ PT.Status]


    $scope.ceses = []     // our mappings of data from the server
    $scope.searchText = ''
    $scope.sortColumn = 'name'
    $scope.reverse = false
    $scope.showHeading = $scope.showHeading | true
    var pointIdToInfoMap = {},
        searchArgs = $location.search(),
        sourceUrl = searchArgs.sourceUrl || null

    var microgridId       = $stateParams.microgridId,
        navigationElement = $stateParams.navigationElement

    // Initialized from URL or menu click or both
    //
    if( ! navigationElement)
      return

    var equipments = navigationElement.equipmentChildren, // [{id: '...', name: '...', shortName: undefined}, ... ]
        cesMapByEquipmentId = {}


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
        case PT.Power:
          value = formatNumberValue( value);
          break;
        case PT.Status:
          value = Number( value);
          break;
        default:
      }
      return value
    }

    // Return standby, charging, or discharging
    // function getState( ess) {
    //   if( ess.standby.toLowerCase() === 'disabled' || ess.standby === 'OffAvailable' || ess.standby === 'true')
    //     return 'standby';
    //   else if( typeof ess.power.indexOf === 'function') {
    //     // It's a string value + space + unit.
    //     if( ess.power.indexOf('-') === 0) // has minus sign, so it's charging
    //       return 'charging';
    //     else if( ess.power === 0 || ess.power === '0')
    //       return 'standby';
    //     else
    //       return 'discharging'
    //   }
    //
    //   return ''
    // }

    //function makeCes( eq, capacityUnit) {
    function makeCes( eq) {
      return {
        name: eq.name,
        energyCapacity: '',
        powerCapacity: '',
        //standby: '',
        power: '',
        percentSoc: '',
        percentSocMax100: 0, // Used by batter symbol
        state: '-',    // 'standby', 'charging', 'discharging'
        status: 0,
        statusLabel: '-',
      }
    }

    function getInterestingType( types) {
      for( var index = types.length-1; index >= 0; index--) {
        var typ = types[index]
        switch( typ) {
          case PT.PercentSoc:
          case PT.Power:
          //case PT.Standby:
          case PT.Status:
          // case PT.PowerCapacity: // kW
          // case PT.EnergyCapacity: // kWh
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

    function uniformStatusFromPower( power) {
      return isNaN(power) || power === 0 ? constants.Status.Idle
          : power > 0 ? constants.Status.Discharging
          : constants.Status.Charging
    }

    function uniformStatusFromPPCA30Status( status, power) {
      switch( status) {
        case 0: return constants.Status.Idle;
        case 6: return constants.Status.Busy;
        case 7: return uniformStatusFromPower(power)
        case 8: return constants.Status.Fault;
        case 9: return constants.Status.Busy;
        default: return constants.Status.Unknown
      }
    }

    function statusLabel(info, status) {
      var stringValue = status.toString()
      if( info.statusMetadata) {
        var integerLabels = info.statusMetadata.integerLabels
        return integerLabels.hasOwnProperty(stringValue) ? integerLabels[stringValue] : stringValue
      } else
        return stringValue
    }

    function onMeasurement( pm) {
      var info = pointIdToInfoMap[ pm.point.id]
      if( info){
        console.log( 'gbEssController.onMeasurement ' + pm.point.id + ' "' + pm.measurement.value + '"')
        // Map the point.name to the standard types (i.e. capacity, standby, charging)
        var value = processValue( info, pm.measurement)
        var ess = $scope.ceses[ info.cesIndex]
        if( info.type === PT.PercentSoc) {
          ess.percentSocMax100 = Math.min( value, 100)
        } else if( info.type === PT.Status) {
          //if( ess.model === constants.Models.PP_CA_30) {
          //  ess.statusRaw = value
          //  value = uniformStatusFromPPCA30Status(value, ess.power)
          //  ess.statusLabel = constants.StatusLabels[value]
          //} else {
            ess.statusLabel = statusLabel(info, value)
          //}
        } else if( info.Type === PT.Power) {
          //if( ess.model === constants.Models.PP_CA_30) {
          //  ess.status = uniformStatusFromPPCA30Status(ess.statusRaw, value)
          //  ess.statusLabel = constants.StatusLabels[ess.status]
          //}
        }
        ess[ TypeToVarMap[info.type]] = value
        //ess.state = getState( ess)

      } else {
        console.error( 'gbEssesController.onMeasurement could not find point.id = ' + pm.point.id)
      }
    }

    function onMeasurements( measurements ) {
      measurements.forEach( function( pm){ onMeasurement( pm) })
    }

    function subscribeToMeasurements( pointIds) {
      measurement.subscribe( $scope, pointIds, {}, self, onMeasurements)
    }


    // Called after get sourceUrl is successful
    function getPointsForEquipmentAndSubscribeToMeasurements( equipments) {
      var cesIndex, pointsUrl,
          pointIds = [],
          equipmentIds = equipments.map(function(eq) {return eq.id }),
          pointTypesQueryParams = rest.queryParameterFromArrayOrString( 'pointTypes', POINT_TYPES),
          equipmentIdsQueryParams = rest.queryParameterFromArrayOrString('equipmentIds', equipmentIds)


      pointsUrl = '/models/1/points?' + equipmentIdsQueryParams + '&' + pointTypesQueryParams
      rest.get( pointsUrl, 'points', $scope, function( data) {
        //var sampleData = {
        //  'e57170fd-2a13-4420-97ab-d1c0921cf60d': [
        //    {
        //      'name': 'MG1.CES1.ModeStndby',
        //      'id': 'fa9bd9a1-5ad1-4c20-b019-261cb69d0a39',
        //      'types': [PT.Point, PT.Standby]
        //    },
        //    {
        //      'name': 'MG1.CES1.CapacitykWh',
        //      'id': '585b3e36-1826-4d7b-b538-d2bb71451d76',
        //      'types': [PT.EnergyCapacity, PT.Point]
        //    },
        //    {
        //      'name': 'MG1.CES1.ChgDischgRate',
        //      'id': 'ec7d6f06-e627-44d2-9bb9-530541fdcdfd',
        //      'types': [PT.Power, PT.Point]
        //    }
        //  ]}

        equipments.forEach( function( eq) {
          var point, ces,
              points = data[eq.id],
              cesIndex = $scope.ceses.length

          if( points) {
            POINT_TYPES.forEach( function( typ) {
              point = getPointByType( points, typ)
              if( point) {
                console.log( 'gbEssesController.getPointsForEquipmentAndSubscribeToMeasurements point: name=' + point.name + ', types = ' + point.types)
                var pointInfo = {
                  'cesIndex': cesIndex,
                  'type': getInterestingType( point.types),
                  'unit': point.unit
                }
                if( point.hasOwnProperty('metadata')  && point.metadata.hasOwnProperty('integerLabels') && angular.isObject(point.metadata.integerLabels)) {
                  pointInfo.statusMetadata = point.metadata
                  // if(integerLabels.hasOwnProperty(stringValue)) {
                  //   point.currentMeasurement.valueBeforeApplyingLabel = point.currentMeasurement.value
                  //   point.currentMeasurement.value = integerLabels[stringValue]
                  // }
                }

                pointIdToInfoMap[point.id] = pointInfo
                pointIds.push( point.id)
              } else {
                console.error( 'gbEssesController.getPointsForEquipmentAndSubscribeToMeasurements  GET /models/n/points entity[' + eq.id + '] does not have point with type ' + typ)
              }

            })
            ces = makeCes( eq)
            cesMapByEquipmentId[eq.id] = ces
            $scope.ceses.push( ces)
          } else {
            console.error( 'gbEssesController.getPointsForEquipmentAndSubscribeToMeasurements  GET /models/n/points did not return UUID=' + eq.id)
          }
        })

        measurement.subscribe( $scope, pointIds, {}, self, onMeasurements)
        subscribeToEquipmentNameplates(equipments, equipmentIds)
      })

    }


    function formatCapacity( capacity) {
      var result = { energy: '', power: ''}
      if( capacity.hasOwnProperty( 'energy'))
        result.energy = formatNumberValue( capacity.energy)
      if( capacity.hasOwnProperty( 'power'))
        result.power = formatNumberValue( capacity.power)
      return result
    }

    function updateNameplateProperty( property) {
      var value,
          ces = cesMapByEquipmentId[property.entityId]
      if( ces) {
        value = property.value
        if( value.hasOwnProperty('capacity')) {
          ces.capacity = formatCapacity( value.capacity)
        }
        if( value.hasOwnProperty('model')) {
          ces.model = value.model
        }
      }
    }

    function notifyNameplateProperty( notificationProperty) {
      var property = notificationProperty.value

      if( property.key === 'nameplate') {
        var ces = cesMapByEquipmentId[property.entityId]
        if( ces) {
          switch( notificationProperty.operation) {
            case 'ADDED':
            case 'MODIFIED':
              updateNameplateProperty( property)
              break;
            case 'REMOVED':
              ces.capacity = {}
              console.error( 'gbEssesController: required property, "nameplate", was REMOVED from the model for ' + property.entityId)
          }
        } else {
          console.error( 'gbEssesController: got notification of "nameplate" property for unknown equipmentId: ' + property.entityId)
        }
      }
    }

    function subscribeToEquipmentNameplates( equipments, equipmentIds) {

      var json = {
        name: 'SubscribeToProperties',
        entityIds:  equipmentIds,
        keys: ['nameplate']
      }

      nameplateSubscriptionId = subscription.subscribe( json, $scope,
        function( subscriptionId, type, data) {

          switch( type) {
            case 'notification.property':
              notifyNameplateProperty( data)
              break
            case 'properties':
              data.forEach(updateNameplateProperty)
              break
            default:
              console.error( 'gbPropertiesTableController: unknown type "' + type + '" from subscription notification')
          }
          $scope.$digest()
        },
        function(error, message) {
          console.error('gbPropertiesTableController.subscribe ' + error + ', ' + JSON.stringify( message))
          $scope.alerts = [{ type: 'danger', message: error}]
        }
      )
    }


    //var eqTypes = rest.queryParameterFromArrayOrString( 'eqTypes', ['ESS'])
    //var pointTypes = rest.queryParameterFromArrayOrString( 'pointTypes', POINT_TYPES)
    //var url = '/equipmentwithpointsbytype?' + eqTypes + '&' + pointTypes
    //rest.get( sourceUrl, 'equipment', $scope, getPointsForEquipmentAndSubscribeToMeasurements);

    if( $scope.queryEsses) {
      var childTypes = rest.queryParameterFromArrayOrString( 'childTypes', ['ESS'])
      var url = '/models/1/equipment/' + microgridId + '/descendants?depth=99&' + childTypes
      rest.get(url, undefined, $scope).then (
          function( response) {
            getPointsForEquipmentAndSubscribeToMeasurements(response.data)
          },
          function(response){
            console.error('gbEssesController.getEsses: rest.get error: ' + JSON.stringify(response))
          }
      )
    } else {
      getPointsForEquipmentAndSubscribeToMeasurements(equipments)
    }

  }]).


  directive( 'gbEssesTable', function(){
    return {
      restrict: 'E', // Element name
      // The template HTML will replace the directive.
      replace: true,
      transclude: true,
      scope: {
        queryEsses: '=?',
        showHeading: '=?'
      }, // isolated scope!
      templateUrl: 'greenbus.views.template/ess/essesTable.html',
      controller: 'gbEssesController'
    }
  }).

  // filter('essStateIcon', function() {
  //   return function(state) {
  //     if( state === 'standby')
  //       return '/images/essStandby29x16.png'
  //     else if( state === 'charging')
  //       return '/images/essCharging29x16.png'
  //     else if( state === 'discharging')
  //       return '/images/essDischarging29x16.png'
  //     else
  //       return ''
  //   };
  // }).
  // filter('essStateIconClass', function() {
  //   return function(state) {
  //     if( state === 'standby')
  //       return 'battery-state-icon fa fa-minus'
  //     else if( state === 'charging')
  //       return 'battery-state-icon fa fa-bolt'
  //     else if( state === 'discharging')
  //       return 'battery-state-icon fa fa-arrow-down'
  //     else if( state === 'disconnected')
  //       return 'battery-state-icon fa fa-times'
  //     else
  //       return ''
  //   };
  // }).
  filter('essStatusIconClass', ['gbEssesConstants', function(constants) {
    return function(status, extraClasses) {
      var classes = 'battery-state-icon '
      if (extraClasses !== undefined)
        classes +=  extraClasses + ' '
      switch( status) {
        case constants.Status.Initializing: return classes + 'fa fa-question'
        case constants.Status.EVDisconnected: return classes + 'fa fa-times'
        case constants.Status.Standby:
        case constants.Status.Idle:
        case constants.Status.IdleUnmanaged: return classes + 'fa fa-minus'
        case constants.Status.Charging: return classes + 'fa fa-bolt'
        case constants.Status.ChargingUnmanaged: return classes + 'fa fa-bolt'
        case constants.Status.TrickleCharging: return classes + 'fa fa-bolt'
        case constants.Status.Discharging: return classes + 'fa fa-arrow-down'
        case constants.Status.DischargingUnmanaged: return classes + 'fa fa-arrow-down'
        case constants.Status.Busy:
        case constants.Status.Fault: return classes + 'fa fa-minus'
        case constants.Status.Unknown: return classes + 'fa fa-question'
        default: return classes + 'fa fa-question'
      }
    };
  }]).
  // filter('essStateDescription', function() {
  //   return function(state) {
  //     return state + ' state';
  //   };
  // }).
  filter('essBatterySocChargedClass', ['gbEssesConstants', function(constants) {
    return function(soc, status) {
      var classes = ( soc > 10 && soc !== 0) ? 'battery-soc charged' : 'battery-soc charged alarmed'
      if( status === constants.Status.Standby || status === constants.Status.Idle || status === constants.Status.IdleUnmanaged)
        classes += ' standby'
      return classes
    };
  }]).
  filter('essBatterySocUnchargedClass', ['gbEssesConstants', function(constants) {
    return function(soc, status) {
      var classes = null
      if( soc === null || soc === '' )
        classes = 'battery-soc unknown'
      else if( status === constants.Status.EVDisconnected)
        classes = 'battery-soc uncharged storage-unavailable'
      else if( soc > 10)
        classes = 'battery-soc uncharged'
      else
        classes = 'battery-soc uncharged alarmed'

      if( status === constants.Status.Standby || status === constants.Status.Idle || status === constants.Status.IdleUnmanaged)
        classes += ' standby'

      return classes
    };
  }])

