angular.module('greenbus.views.demo').controller('EquipmentDemoCtrl', function ($scope, $stateParams, rest, $location) {
  var microgridId1 = 'microgrid-id-1'

  $stateParams.microgridId = microgridId1
  $stateParams.navigationElement = {
    id: microgridId1,
    name: 'MicgroGrid1',      // full entity name
    shortName: 'Microgrid1-equipment-demo',
    equipmentChildren: []
  }
  $location.search( 'sourceUrl', '/models/1/equipment/' + microgridId1)

  rest.whenGET( '/models/1/points?equipmentIds=' + microgridId1 + '&depth=9999&limit=100').
  respond([
    {'name': 'Eugene.PCC_Util.Status', 'id': '218bf05f-b479-49b6-99aa-c2803419d31f', 'pointType': 'STATUS', 'types': ['UtilityBreakerStatus', 'BreakerStatus', 'Point'], 'unit': 'status', 'endpoint': '73a3da76-14f7-40e3-b0bb-455af8ee066b'},
    {'name': 'Eugene.Grid.kW_tot', 'id': '1fe7e9a9-96f2-4eb0-8fb2-0fedc34e4388', 'pointType': 'ANALOG', 'types': ['Imported', 'DemandPower', 'Point'], 'unit': 'kW', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
    {'name': 'Eugene.PCC_Cust.Status', 'id': 'be2489c8-9b08-4822-8c7a-187180fb9460', 'pointType': 'STATUS', 'types': ['Imported', 'CustomerBreakerStatus', 'BreakerStatus', 'Point'], 'unit': 'status', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
    {'name': 'Eugene.Building.Load', 'id': 'a98ec09b-a584-42d9-bea5-dde5f071273f', 'pointType': 'ANALOG', 'types': ['Imported', 'LoadPower', 'Point'], 'unit': 'kW', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
    {'name': 'Eugene.Building.DemandResponseStage', 'id': '04db3bc6-9053-4785-9c6e-638c397f2850', 'pointType': 'COUNTER', 'types': ['Point', 'DemandResponseStage', 'Imported'], 'unit': 'Stage', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'}
  ])

});