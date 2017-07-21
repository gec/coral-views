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
      directiveScope = angular.element( element).scope()
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
    {'name': 'Eugene.ESS.Mode', 'id': '49f847d5-9f2c-419a-a5cf-ca6d90bea442', 'pointType': 'COUNTER', 'types': ['ESSMode', 'Point', 'Imported'], 'unit': 'Mode', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
    {'name': 'Eugene.ESS.ChargeRateTarget', 'id': '5d002203-2154-40d1-880a-2a442f45e0db', 'pointType': 'ANALOG', 'types': ['Point', 'ChargeRateTarget', 'Imported'], 'unit': 'kW', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
    {'name': 'Eugene.ESS.Efficiency', 'id': '0cae9485-b54f-416d-b53d-581fd68ab85b', 'pointType': 'ANALOG', 'types': ['Point', 'Imported', 'Efficiency'], 'unit': '%', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
    {'name': 'Eugene.ESS.CapacitykWh', 'id': '88063f24-ed2d-4104-9d22-774508059a75', 'pointType': 'ANALOG', 'types': ['Point', 'Imported', 'EnergyCapacity'], 'unit': 'kWh', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
    {'name': 'Eugene.ESS.DischgRateMax', 'id': '6b9bd021-a590-4257-bdca-56933bc0ef41', 'pointType': 'ANALOG', 'types': ['Imported', 'Point', 'PowerCapacity', 'DischargeRateMax'], 'unit': 'kW', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
    {'name': 'Eugene.ESS.ChargeRateMax', 'id': 'd5db66fe-68ee-4fc3-8585-4602cb2137a1', 'pointType': 'ANALOG', 'types': ['ChargeRateMax', 'Imported', 'Point'], 'unit': 'kW', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
    {'name': 'Eugene.ESS.ChgDischgRate', 'id': 'f5154760-99b7-4cb6-830f-63257b9d48cb', 'pointType': 'ANALOG', 'types': ['Imported', 'OutputPower', 'Point'], 'unit': 'kW', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
    {'name': 'Eugene.ESS.SOC_Min', 'id': '5eebbd7f-146f-4871-a0fa-ce0eb8f4bf98', 'pointType': 'ANALOG', 'types': ['SOC_Min', 'Point', 'Imported'], 'unit': '%SOC', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
    {'name': 'Eugene.ESS.SOC_Max', 'id': 'bc8a0065-2d06-4acc-8264-1250f0b617af', 'pointType': 'ANALOG', 'types': ['SOC_Max', 'Imported', 'Point'], 'unit': '%SOC', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
    {'name': 'Eugene.ESS.SOC', 'id': '4f614424-aa67-44c8-8d8a-30e40ffc9412', 'pointType': 'ANALOG', 'types': ['%SOC', 'Imported', 'Point'], 'unit': '%SOC', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'}
  ]
  rest.whenGET( '/models/1/points?equipmentIds=' + ess1.id + '&pointTypes=%SOC&pointTypes=OutputPower&pointTypes=Standby').
    respond(RESPONSE)


  $scope.pushMessage = function(domSelector) {
    subscriptionId = subscriptionId || getSubscriptionId( domSelector)

    subscription.pushMessage(
      subscriptionId,
      'measurements',
      [
        {'point': {'id': '88063f24-ed2d-4104-9d22-774508059a75'}, 'measurement': {'value': '100.000000', 'type': 'DOUBLE', 'unit': 'kWh', 'time': 1415136499648, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}},
        {'point': {'id': '6b9bd021-a590-4257-bdca-56933bc0ef41'}, 'measurement': {'value': '100.000000', 'type': 'DOUBLE', 'unit': 'kW', 'time': 1415136499648, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}},
        {'point': {'id': 'f5154760-99b7-4cb6-830f-63257b9d48cb'}, 'measurement': {'value': '0.000000', 'type': 'DOUBLE', 'unit': 'kW', 'time': 1417712458469, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}},
        {'point': {'id': '4f614424-aa67-44c8-8d8a-30e40ffc9412'}, 'measurement': {'value': '100.000000', 'type': 'DOUBLE', 'unit': '%SOC', 'time': 1417561909809, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}}
      ]
    )
  }

  var sub = {
    'subscribeToMeasurements': {
      'pointIds': [
        '4f614424-aa67-44c8-8d8a-30e40ffc9412',
        'f5154760-99b7-4cb6-830f-63257b9d48cb',
        '88063f24-ed2d-4104-9d22-774508059a75',
        '6b9bd021-a590-4257-bdca-56933bc0ef41'
      ],
      'subscriptionId': 'subscription.subscribeToMeasurements.b0ebf027-b111-4d3a-95d0-dbb42f4a45d2'
    }
  }

});