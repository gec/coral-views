angular.module('greenbus.views.demo').controller('EquipmentDemoCtrl', function ($scope, $stateParams) {
  var microgridId1 = 'microgrid-id-1'

  $stateParams.microgridId = 'abc'
  $stateParams.navigationElement = {
    id: microgridId1,
    name: 'MicgroGrid1',      // full entity name
    shortName: 'Microgrid1',
    equipmentChildren: []
  }

});