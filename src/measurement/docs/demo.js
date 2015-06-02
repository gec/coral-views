angular.module('greenbus.views.demo').controller('MeasurementDemoCtrl', function ($scope, subscription, rest, $routeParams) {
  var measurementId = 0

  $routeParams.navId = 'equipment.a6be3d8e-7862-4ff8-b096-4c87f2939bd0'
  $routeParams.sourceUrl = '/models/1/equipment/a6be3d8e-7862-4ff8-b096-4c87f2939bd0/descendants?depth=1'

  rest.whenGET( '/models/1/points').
    respond([
      {'name': 'Eugene.PCC_Util.Status', 'id': '218bf05f-b479-49b6-99aa-c2803419d31f', 'pointType': 'STATUS', 'types': ['UtilityBreakerStatus', 'BreakerStatus', 'Point'], 'unit': 'status', 'endpoint': '73a3da76-14f7-40e3-b0bb-455af8ee066b'},
      {'name': 'Eugene.Grid.kW_tot', 'id': '1fe7e9a9-96f2-4eb0-8fb2-0fedc34e4388', 'pointType': 'ANALOG', 'types': ['Imported', 'DemandPower', 'Point'], 'unit': 'kW', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
      {'name': 'Eugene.PCC_Cust.Status', 'id': 'be2489c8-9b08-4822-8c7a-187180fb9460', 'pointType': 'STATUS', 'types': ['Imported', 'CustomerBreakerStatus', 'BreakerStatus', 'Point'], 'unit': 'status', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
      {'name': 'Eugene.Building.Load', 'id': 'a98ec09b-a584-42d9-bea5-dde5f071273f', 'pointType': 'ANALOG', 'types': ['Imported', 'LoadPower', 'Point'], 'unit': 'kW', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
      {'name': 'Eugene.Building.DemandResponseStage', 'id': '04db3bc6-9053-4785-9c6e-638c397f2850', 'pointType': 'COUNTER', 'types': ['Point', 'DemandResponseStage', 'Imported'], 'unit': 'Stage', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'}
    ])
  rest.whenGET( '/models/1/points/commands').
    respond({
      'be2489c8-9b08-4822-8c7a-187180fb9460': [
        {'name': 'Eugene.PCC_Cust.Close0', 'id': 'a1b8f486-f476-4095-8700-f25719ce41cd', 'commandType': 'CONTROL', 'displayName': 'Close0', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
        {'name': 'Eugene.PCC_Cust.Trip0', 'id': '11aaf3b1-9777-4617-841f-564308752822', 'commandType': 'CONTROL', 'displayName': 'Trip0', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'}
      ],
      '218bf05f-b479-49b6-99aa-c2803419d31f': [
        {'name': 'Eugene.PCC_Util.Close', 'id': '88305576-1c98-49fb-993f-233d2e137af8', 'commandType': 'CONTROL', 'displayName': 'Close', 'endpoint': '73a3da76-14f7-40e3-b0bb-455af8ee066b'},
        {'name': 'Eugene.PCC_Util.Trip', 'id': '02715339-51f9-4f7c-8898-b8261849220e', 'commandType': 'CONTROL', 'displayName': 'Trip', 'endpoint': '73a3da76-14f7-40e3-b0bb-455af8ee066b'}
      ],
      '49f847d5-9f2c-419a-a5cf-ca6d90bea442': [
        {'name': 'Eugene.ESS.SetMode', 'id': '15e08caf-d452-42ee-acf5-05d932275068', 'commandType': 'SETPOINT_INT', 'displayName': 'SetMode', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'}
      ],
      '5d002203-2154-40d1-880a-2a442f45e0db': [
        {'name': 'Eugene.ESS.SetChargeRateTarget', 'id': 'd3e57ae3-e2e0-4d42-aa62-362922a5831d', 'commandType': 'SETPOINT_DOUBLE', 'displayName': 'SetChargeRateTarget', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'}
      ], '3ad4f01a-9609-4752-864e-a865c71b7616': [
        {'name': 'Eugene.CHP.SetOutputTarget', 'id': '5c5303e8-ae27-485c-a6e0-eb3009870be4', 'commandType': 'SETPOINT_DOUBLE', 'displayName': 'SetOutputTarget', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'}
      ]
    })


  $scope.pushMeasurement = function() {
    subscription.pushMessage(
      'subscription.subscribeToMeasurements',
      'measurements',
      [
        {'point': {'id': '1fe7e9a9-96f2-4eb0-8fb2-0fedc34e4388'}, 'measurement': {'value': '15.248456', 'type': 'DOUBLE', 'unit': 'kW', 'time': 1417724070142, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}}
      ]
    )
  }

});