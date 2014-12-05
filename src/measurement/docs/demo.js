angular.module('greenbus.views.demo').controller('MeasurementDemoCtrl', function ($scope, subscription, rest, $routeParams) {
  var measurementId = 0

  $routeParams.navId = 'equipment.a6be3d8e-7862-4ff8-b096-4c87f2939bd0'
  $routeParams.sourceUrl = '/models/1/equipment/a6be3d8e-7862-4ff8-b096-4c87f2939bd0/descendants?depth=1'

  rest.whenGET( '/models/1/points').
    respond([
      {'name': 'Eugene.PCC_Util.Status', 'id': '218bf05f-b479-49b6-99aa-c2803419d31f', 'pointType': 'STATUS', 'types': ['UtilityBreakerStatus', 'BreakerStatus', 'Point'], 'unit': 'status', 'endpoint': '73a3da76-14f7-40e3-b0bb-455af8ee066b'},
      {'name': 'Eugene.Grid.kW_tot', 'id': '1fe7e9a9-96f2-4eb0-8fb2-0fedc34e4388', 'pointType': 'ANALOG', 'types': ['Imported', 'DemandPower', 'Point'], 'unit': 'kW', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
//      {'name': 'Eugene.CHP.OutputTarget', 'id': '3ad4f01a-9609-4752-864e-a865c71b7616', 'pointType': 'ANALOG', 'types': ['Point', 'Imported', 'OutputTarget'], 'unit': 'kW', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
//      {'name': 'Eugene.CHP.Capacity', 'id': '9d4bb9a4-a0da-4c7f-ac58-a6cf3116b005', 'pointType': 'ANALOG', 'types': ['Point', 'PowerCapacity', 'Imported'], 'unit': 'kW', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
//      {'name': 'Eugene.CHP.kW_tot', 'id': '1770ee28-fb60-4aab-9a46-a1af345cbc22', 'pointType': 'ANALOG', 'types': ['OutputPower', 'Imported', 'Point'], 'unit': 'kW', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
//      {'name': 'Eugene.PVUnit.%_cap', 'id': '9be55b4c-3fea-42b9-bc28-92da04c25c9a', 'pointType': 'ANALOG', 'types': ['Point', 'Ratio', 'Imported'], 'unit': '%', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
//      {'name': 'Eugene.PVUnit.kW_cap', 'id': '5b55c4cd-ced6-4c36-a32f-1b89373ccc5a', 'pointType': 'ANALOG', 'types': ['PVCapacity', 'Point', 'Imported'], 'unit': 'kW', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
//      {'name': 'Eugene.PVUnit.kW_tot', 'id': '52b75d1a-2fa2-40a9-87cf-6e8fcf4e07db', 'pointType': 'ANALOG', 'types': ['PVOutput', 'Imported', 'OutputPower', 'Point'], 'unit': 'kW', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
//      {'name': 'Eugene.ESS.Mode', 'id': '49f847d5-9f2c-419a-a5cf-ca6d90bea442', 'pointType': 'COUNTER', 'types': ['Point', 'BatteryMode', 'Imported'], 'unit': 'Mode', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
//      {'name': 'Eugene.ESS.ChargeRateTarget', 'id': '5d002203-2154-40d1-880a-2a442f45e0db', 'pointType': 'ANALOG', 'types': ['Point', 'ChargeRateTarget', 'Imported'], 'unit': 'kW', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
//      {'name': 'Eugene.ESS.Efficiency', 'id': '0cae9485-b54f-416d-b53d-581fd68ab85b', 'pointType': 'ANALOG', 'types': ['Point', 'Efficiency', 'Imported'], 'unit': '%', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
//      {'name': 'Eugene.ESS.CapacitykWh', 'id': '88063f24-ed2d-4104-9d22-774508059a75', 'pointType': 'ANALOG', 'types': ['Imported', 'Point', 'CapacityEnergy'], 'unit': 'kWh', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
//      {'name': 'Eugene.ESS.DischgRateMax', 'id': '6b9bd021-a590-4257-bdca-56933bc0ef41', 'pointType': 'ANALOG', 'types': ['Imported', 'MaxDischargeRate', 'CapacityPower', 'Point'], 'unit': 'kW', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
//      {'name': 'Eugene.ESS.ChargeRateMax', 'id': 'd5db66fe-68ee-4fc3-8585-4602cb2137a1', 'pointType': 'ANALOG', 'types': ['MaxChargeRate', 'Point', 'Imported'], 'unit': 'kW', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
//      {'name': 'Eugene.ESS.ChgDischgRate', 'id': 'f5154760-99b7-4cb6-830f-63257b9d48cb', 'pointType': 'ANALOG', 'types': ['Imported', 'Point', 'Charging'], 'unit': 'kW', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
//      {'name': 'Eugene.ESS.SOC_Min', 'id': '5eebbd7f-146f-4871-a0fa-ce0eb8f4bf98', 'pointType': 'ANALOG', 'types': ['SOC_Min', 'Imported', 'Point'], 'unit': '%SOC', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
//      {'name': 'Eugene.ESS.SOC_Max', 'id': 'bc8a0065-2d06-4acc-8264-1250f0b617af', 'pointType': 'ANALOG', 'types': ['SOC_Max', 'Imported', 'Point'], 'unit': '%SOC', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
//      {'name': 'Eugene.ESS.SOC', 'id': '4f614424-aa67-44c8-8d8a-30e40ffc9412', 'pointType': 'ANALOG', 'types': ['Imported', '%SOC', 'Point'], 'unit': '%SOC', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
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


  var mm = {'subscriptionId': 'subscription.subscribeToMeasurements.1b5e67ce-d9c6-4d06-bce3-85fb1b3274a2', 'type': 'measurements', 'data': [
//    {'point': {'id': '5b55c4cd-ced6-4c36-a32f-1b89373ccc5a'}, 'measurement': {'value': '200.000000', 'type': 'DOUBLE', 'unit': 'kW', 'time': 1415136038308, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}},
//    {'point': {'id': '88063f24-ed2d-4104-9d22-774508059a75'}, 'measurement': {'value': '100.000000', 'type': 'DOUBLE', 'unit': 'kWh', 'time': 1415136499648, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}},
//    {'point': {'id': '9d4bb9a4-a0da-4c7f-ac58-a6cf3116b005'}, 'measurement': {'value': '248.000000', 'type': 'DOUBLE', 'unit': 'kW', 'time': 1415136204594, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}},
//    {'point': {'id': 'bc8a0065-2d06-4acc-8264-1250f0b617af'}, 'measurement': {'value': '100.000000', 'type': 'DOUBLE', 'unit': '%SOC', 'time': 1415136499648, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}},
//    {'point': {'id': '5eebbd7f-146f-4871-a0fa-ce0eb8f4bf98'}, 'measurement': {'value': '25.000000', 'type': 'DOUBLE', 'unit': '%SOC', 'time': 1415136499648, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}},
//    {'point': {'id': 'd5db66fe-68ee-4fc3-8585-4602cb2137a1'}, 'measurement': {'value': '100.000000', 'type': 'DOUBLE', 'unit': 'kW', 'time': 1415136499648, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}},
//    {'point': {'id': '6b9bd021-a590-4257-bdca-56933bc0ef41'}, 'measurement': {'value': '100.000000', 'type': 'DOUBLE', 'unit': 'kW', 'time': 1415136499648, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}},
//    {'point': {'id': 'be2489c8-9b08-4822-8c7a-187180fb9460'}, 'measurement': {'value': 'Closed', 'type': 'STRING', 'unit': 'status', 'time': 1415304531239, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}},
//    {'point': {'id': '0cae9485-b54f-416d-b53d-581fd68ab85b'}, 'measurement': {'value': '0.850000', 'type': 'DOUBLE', 'unit': '%', 'time': 1415136499648, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}},
//    {'point': {'id': 'a98ec09b-a584-42d9-bea5-dde5f071273f'}, 'measurement': {'value': '307.620000', 'type': 'DOUBLE', 'unit': 'kW', 'time': 1417724070226, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}},
//    {'point': {'id': '218bf05f-b479-49b6-99aa-c2803419d31f'}, 'measurement': {'value': 'Closed', 'type': 'STRING', 'unit': 'status', 'time': 1417712453402, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}},
//    {'point': {'id': '3ad4f01a-9609-4752-864e-a865c71b7616'}, 'measurement': {'value': '132.400000', 'type': 'DOUBLE', 'unit': 'kW', 'time': 1417712453702, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}},
//    {'point': {'id': '4f614424-aa67-44c8-8d8a-30e40ffc9412'}, 'measurement': {'value': '100.000000', 'type': 'DOUBLE', 'unit': '%SOC', 'time': 1417561909809, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}},
//    {'point': {'id': '5d002203-2154-40d1-880a-2a442f45e0db'}, 'measurement': {'value': '100.000000', 'type': 'DOUBLE', 'unit': 'kW', 'time': 1417712456817, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}},
//    {'point': {'id': '04db3bc6-9053-4785-9c6e-638c397f2850'}, 'measurement': {'value': 'None', 'type': 'STRING', 'unit': 'Stage', 'time': 1416945585768, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}},
//    {'point': {'id': '49f847d5-9f2c-419a-a5cf-ca6d90bea442'}, 'measurement': {'value': 'Constant', 'type': 'STRING', 'unit': 'Mode', 'time': 1417712457882, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}},
//    {'point': {'id': 'f5154760-99b7-4cb6-830f-63257b9d48cb'}, 'measurement': {'value': '0.000000', 'type': 'DOUBLE', 'unit': 'kW', 'time': 1417712458469, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}},
//    {'point': {'id': '52b75d1a-2fa2-40a9-87cf-6e8fcf4e07db'}, 'measurement': {'value': '157.973592', 'type': 'DOUBLE', 'unit': 'kW', 'time': 1417724069501, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}},
//    {'point': {'id': '9be55b4c-3fea-42b9-bc28-92da04c25c9a'}, 'measurement': {'value': '78.986796', 'type': 'DOUBLE', 'unit': '%', 'time': 1417724069501, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}},
//    {'point': {'id': '1770ee28-fb60-4aab-9a46-a1af345cbc22'}, 'measurement': {'value': '132.437951', 'type': 'DOUBLE', 'unit': 'kW', 'time': 1417724070142, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}},
    {'point': {'id': '1fe7e9a9-96f2-4eb0-8fb2-0fedc34e4388'}, 'measurement': {'value': '15.248456', 'type': 'DOUBLE', 'unit': 'kW', 'time': 1417724070142, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}}
  ]}

});