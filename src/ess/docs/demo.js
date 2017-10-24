angular.module('greenbus.views.demo').controller('EssesDemoCtrl', function ($scope, $stateParams, subscription, rest, $location) {
  var directiveScope,
      subscriptionId,
      microgridId1 = 'microgrid-id-1',
      ess1 = {
          'name':'Eugene.ESS',
          'id': 'ess-id-1',
          'types':['Imported','ESS', 'Generation', 'Equipment']
        }


  $stateParams.microgridId = microgridId1
  $stateParams.navigationElement = {
    id: microgridId1,
    name: 'MicroGrid1',      // full entity name
    shortName: 'Microgrid1-other',
    equipmentChildren: [ess1]
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

  function getSubscriptionId( domSelector) {
    var scope = getElementScope( domSelector)
    return scope.__subscriptionIds[0]
  }

  // $location.search( 'sourceUrl', '/models/1/equipment/' + microgridId1 + '/descendants?depth=0&childTypes=CES')

  rest.whenGET( '/models/1/equipment/' + microgridId1 + '/descendants?depth=0&childTypes=CES').
    respond([
      {
        'name':'Eugene.ESS',
        'id': ess1.id,
        'types':['Imported','ESS', 'Generation', 'Equipment']
      }
    ])

  var RESPONSE = {}
  RESPONSE[ess1.id] = [
    {'name': 'Eugene.ESS.Mode', 'id': 'mode-id', 'pointType': 'COUNTER', 'types': ['ESSMode', 'Point', 'Imported'], 'unit': 'Mode', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
    {'name': 'Eugene.ESS.ChargeRateTarget', 'id': 'charge-rate-target-id', 'pointType': 'ANALOG', 'types': ['Point', 'ChargeRateTarget', 'Imported'], 'unit': 'kW', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
    {'name': 'Eugene.ESS.Efficiency', 'id': 'efficiency-id', 'pointType': 'ANALOG', 'types': ['Point', 'Imported', 'Efficiency'], 'unit': '%', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
    {'name': 'Eugene.ESS.CapacitykWh', 'id': 'capacity-id', 'pointType': 'ANALOG', 'types': ['Point', 'Imported', 'EnergyCapacity'], 'unit': 'kWh', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
    {'name': 'Eugene.ESS.DischgRateMax', 'id': 'discharge-rate-max-id', 'pointType': 'ANALOG', 'types': ['Imported', 'Point', 'PowerCapacity', 'DischargeRateMax'], 'unit': 'kW', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
    {'name': 'Eugene.ESS.ChargeRateMax', 'id': 'charge-rate-max-id', 'pointType': 'ANALOG', 'types': ['ChargeRateMax', 'Imported', 'Point'], 'unit': 'kW', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
    {'name': 'Eugene.ESS.ChgDischgRate', 'id': 'charge-discharge-power-id', 'pointType': 'ANALOG', 'types': ['Imported', 'OutputPower', 'Point'], 'unit': 'kW', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
    {'name': 'Eugene.ESS.SOC_Min', 'id': 'soc-min-id', 'pointType': 'ANALOG', 'types': ['SOC_Min', 'Point', 'Imported'], 'unit': '%SOC', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
    {'name': 'Eugene.ESS.SOC_Max', 'id': 'soc-max-id', 'pointType': 'ANALOG', 'types': ['SOC_Max', 'Imported', 'Point'], 'unit': '%SOC', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
    {'name': 'Eugene.ESS.SOC', 'id': 'soc-id', 'pointType': 'ANALOG', 'types': ['%SOC', 'Imported', 'Point'], 'unit': '%SOC', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'}
  ]
  rest.whenGET( '/models/1/points?equipmentIds=' + ess1.id + '&pointTypes=%SOC&pointTypes=OutputPower&pointTypes=Standby').
    respond(RESPONSE)


  $scope.pushMessage = function(domSelector) {
    subscriptionId = subscriptionId || getSubscriptionId( domSelector)

    subscription.pushMessage(
      subscriptionId,
      'measurements',
      [
        {'point': {'id': 'capacity-id'}, 'measurement': {'value': '100.000000', 'type': 'DOUBLE', 'unit': 'kWh', 'time': 1415136499648, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}},
        {'point': {'id': 'discharge-rate-max-id'}, 'measurement': {'value': '100.000000', 'type': 'DOUBLE', 'unit': 'kW', 'time': 1415136499648, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}},
        {'point': {'id': 'charge-discharge-power-id'}, 'measurement': {'value': '0.000000', 'type': 'DOUBLE', 'unit': 'kW', 'time': 1417712458469, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}},
        {'point': {'id': 'soc-id'}, 'measurement': {'value': '100.000000', 'type': 'DOUBLE', 'unit': '%SOC', 'time': 1417561909809, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}}
      ]
    )
  }

  var sub = {
    'subscribeToMeasurements': {
      'pointIds': [
        'soc-id',
        'charge-discharge-power-id',
        'capacity-id',
        'discharge-rate-max-id'
      ],
      'subscriptionId': 'subscription.subscribeToMeasurements.b0ebf027-b111-4d3a-95d0-dbb42f4a45d2'
    }
  }

});