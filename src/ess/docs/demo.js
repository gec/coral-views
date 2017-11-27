angular.module('greenbus.views.demo').controller('EssesDemoCtrl', function ($scope, $stateParams, subscription, rest, $location, gbEssesConstants) {
  var directiveScope, subscribeToMeasurementsId, subscribeToPropertiesId,
      Status = gbEssesConstants.Status,
      microgridId1 = 'microgrid-id-1',
      essTypes = ['Imported','ESS', 'Generation', 'Equipment'],
      esses = [
        {'name':'Eugene.ESS0', 'id': 'ess-id-0', 'types':essTypes},
        {'name':'Eugene.ESS1', 'id': 'ess-id-1', 'types':essTypes},
        {'name':'Eugene.ESS2', 'id': 'ess-id-2', 'types':essTypes},
        {'name':'Eugene.ESS3', 'id': 'ess-id-3', 'types':essTypes}
      ],
      equipmentIds = esses.map(function(ess){return ess.id}),
      nameplates = esses.map(function(ess, index){
        if(index === 0) {
          var n = equipmentIds.length - 1
          return makeNameplate(ess.id, 'GEC', 'AggregatedEss-01', 20*n, 10*n, {'power': 20*n, 'energy': 36*n})
        }
        else
          return makeNameplate(ess.id, 'Princeton Power Systems', 'CA-30', 20, 10, {'power': 20, 'energy': 36})
      }),
      metadata = {
        'integerLabels': {
          '0': 'Initializing',
          '1': 'EVDisconnected', // — aka.  EVDisconnected
          '2': 'Standby', // Off?
          '3': 'Idle', //— Neither charging nor discharging, Waiting on condition to change.
          '4': 'Charging',
          '5': 'Discharging',
          '6': 'TrickleCharging',
          '7': 'Busy',
          '8': 'Fault',
          '9': 'Unknown',
          '10': 'IdleUnmanaged',
          '11': 'ChargingUnmanaged',
          '12': 'DischargingUnmanaged'
        }
      }

  $stateParams.microgridId = microgridId1
  $stateParams.navigationElement = {
    id: microgridId1,
    name: 'MicroGrid1',      // full entity name
    shortName: 'Microgrid1-other',
    equipmentChildren: esses
  }


  // $location.search( 'sourceUrl', '/models/1/equipment/' + microgridId1 + '/descendants?depth=0&childTypes=CES')

  rest.whenGET( '/models/1/equipment/' + microgridId1 + '/descendants?depth=0&childTypes=CES').
    respond(esses)

  var eqPoints = esses.map(function(ess, index){return makeEssPoints(ess.name, index)}),
      equipmentIdsQueryString = rest.queryParameterFromArrayOrString('equipmentIds', equipmentIds),
      eqIdPointsMap = {}
  esses.map(function(ess, index) { eqIdPointsMap[ess.id] = eqPoints[index]})

  rest.whenGET( '/models/1/points?' + equipmentIdsQueryString + '&pointTypes=%SOC&pointTypes=OutputPower&pointTypes=Status').
    respond(eqIdPointsMap)


  $scope.pushMeasurements = function(domSelector) {
    subscribeToMeasurementsId = subscribeToMeasurementsId || getSubscriptionId( domSelector, 'SubscribeToMeasurements')

    subscription.pushMessage(
      subscribeToMeasurementsId,
      'measurements',
      makeMeasurementsForDevice(    0, Status.Discharging,     100,  10, 200, 20).concat(
          makeMeasurementsForDevice(1, Status.Idle,              0,  50, 200, 20),
          makeMeasurementsForDevice(2, Status.Charging,       -100,  90, 200, 20),
          makeMeasurementsForDevice(3, Status.EVDisconnected,    0,   0,   0, 20)
      )
    )
  }

  $scope.pushNameplateProperties = function(domSelector) {
    subscribeToPropertiesId = subscribeToPropertiesId || getSubscriptionId( domSelector, 'SubscribeToProperties')

    subscription.pushMessage(subscribeToPropertiesId, 'properties', nameplates)
  }

  var sub = {
    'SubscribeToMeasurements': {
      'pointIds': [
        'soc-id',
        'charge-discharge-power-id',
        'capacity-id',
        'discharge-rate-max-id'
      ],
      'subscriptionId': 'subscription.subscribeToMeasurements.b0ebf027-b111-4d3a-95d0-dbb42f4a45d2'
    }
  }

  /**
   * Returns a random integer between min (inclusive) and max (inclusive)
   * Using Math.round() will give you a non-uniform distribution!
   */
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function makeMeasurementsForDevice( index, status, power, soc, capacity, dischargeMax) {
    if( soc >= 10 && soc <= 90)
      soc = soc + getRandomInt(-10,10)
    if( power !== 0) {
      power = power + getRandomInt(-10,10)
      if( power === 0)
        status = Status.Idle
    }
    return [
      {'point': {'id': 'capacity-id-' + index},               'measurement': {'value': capacity.toString(), 'type': 'DOUBLE', 'unit': 'kWh', 'time': 1415136499648, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}},
      {'point': {'id': 'discharge-rate-max-id-' + index},     'measurement': {'value': dischargeMax.toString(), 'type': 'DOUBLE', 'unit': 'kW', 'time': 1415136499648, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}},
      {'point': {'id': 'charge-discharge-power-id-' + index}, 'measurement': {'value': power.toString(), 'type': 'DOUBLE', 'unit': 'kW', 'time': 1417712458469, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}},
      {'point': {'id': 'soc-id-' + index},                    'measurement': {'value': soc.toString(), 'type': 'DOUBLE', 'unit': '%SOC', 'time': 1417561909809, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}},
      {'point': {'id': 'status-id-' + index},                 'measurement': {'value': status.toString(), 'type': 'INT', 'unit': '%SOC', 'time': 1417561909809, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}}
    ]
  }

  function makeEssPoints( name, index) {
    return [
      {'name': name + '.Mode', 'id': 'mode-id-' + index, 'pointType': 'COUNTER', 'types': ['ESSMode', 'Point'], 'unit': 'Mode', 'endpoint': 'endpoint-id-01'},
      {'name': name + '.ChargeRateTarget', 'id': 'charge-rate-target-id-' + index, 'pointType': 'ANALOG', 'types': ['Point', 'ChargeRateTarget'], 'unit': 'kW', 'endpoint': 'endpoint-id-01'},
      {'name': name + '.Efficiency', 'id': 'efficiency-id-' + index, 'pointType': 'ANALOG', 'types': ['Point', 'Efficiency'], 'unit': '%', 'endpoint': 'endpoint-id-01'},
      {'name': name + '.CapacitykWh', 'id': 'capacity-id-' + index, 'pointType': 'ANALOG', 'types': ['Point', 'EnergyCapacity'], 'unit': 'kWh', 'endpoint': 'endpoint-id-01'},
      {'name': name + '.DischgRateMax', 'id': 'discharge-rate-max-id-' + index, 'pointType': 'ANALOG', 'types': ['Imported', 'Point', 'PowerCapacity', 'DischargeRateMax'], 'unit': 'kW', 'endpoint': 'endpoint-id-01'},
      {'name': name + '.ChargeRateMax', 'id': 'charge-rate-max-id-' + index, 'pointType': 'ANALOG', 'types': ['ChargeRateMax', 'Point'], 'unit': 'kW', 'endpoint': 'endpoint-id-01'},
      {'name': name + '.ChgDischgRate', 'id': 'charge-discharge-power-id-' + index, 'pointType': 'ANALOG', 'types': ['Imported', 'OutputPower', 'Point'], 'unit': 'kW', 'endpoint': 'endpoint-id-01'},
      {'name': name + '.SOC_Min', 'id': 'soc-min-id-' + index, 'pointType': 'ANALOG', 'types': ['SOC_Min', 'Point'], 'unit': '%SOC', 'endpoint': 'endpoint-id-01'},
      {'name': name + '.SOC_Max', 'id': 'soc-max-id-' + index, 'pointType': 'ANALOG', 'types': ['SOC_Max', 'Point'], 'unit': '%SOC', 'endpoint': 'endpoint-id-01'},
      {'name': name + '.SOC', 'id': 'soc-id-' + index, 'pointType': 'ANALOG', 'types': ['%SOC', 'Point'], 'unit': '%SOC', 'endpoint': 'endpoint-id-01'},
      // Status with metadata: {'integerLabels': ...}
      {'name': name + '.Status', 'id': 'status-id-' + index, 'metadata': metadata, 'pointType': 'STATUS', 'types': ['Status', 'Point'], 'unit': 'status', 'endpoint': 'endpoint-id-01'}
    ]
  }

  function makeNameplate( id, manufacturer, model, powerMax, powerTarget, capacity) {
    return {
      'entityId': id,
      'key': 'nameplate',
      'value': {
        'manufacturer': manufacturer,
        'model': model,
        'type': 'ESS',
        'SOCMax': 10,
        'SOCMin': 90,
        'chargeRateMax': powerMax,
        'chargeRateMin': 1,
        'dischgRateMax': powerMax,
        'dischgRateMin': 1,
        'chargeRateTarget': powerTarget,
        'capacity': capacity,
        'efficiency': 99,
        'mode': {'modeChgDischg': null, 'modeSmoothing': null, 'modeConstVars': null, 'modeFreqWatt': null}
      }
    }
  }

  function getElementScope( domSelector) {
    if( !directiveScope) {
      var element = document.querySelector( domSelector)
      // element is this EssesDemoCtrl scope. Get the first child's scope.
      var firstChildElement = angular.element( element).children().eq(0)
      directiveScope = firstChildElement.scope()
    }
    return directiveScope
  }

  function findSubscriptionByName( subscriptions, name) {
    var prefix = 'subscription.' + name,
        index = 0
    if( name === undefined) {
      return subscriptions[0]
    } else {
      while(index < subscriptions.length) {
        if( subscriptions[index].indexOf(prefix) === 0)
          return subscriptions[index]
        index ++
      }
    }
    return undefined
  }

  function getSubscriptionId( domSelector, name) {
    var scope = getElementScope( domSelector)
    return findSubscriptionByName( scope.__subscriptionIds, name)
  }

});