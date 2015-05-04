angular.module('greenbus.views.demo').controller('PropertiesTableDemoCtrl', function ($scope, $stateParams, subscription) {
  var microgridId1 = 'microgrid-id-1'

  $stateParams.microgridId = microgridId1
  $stateParams.navigationElement = {
    id: microgridId1,
    name: 'MicgroGrid1',      // full entity name
    shortName: 'Microgrid1',
    equipmentChildren: []
  }

  function getScopeValue( domSelector) {
    var element, scope, value
    element = document.querySelector( domSelector)
    scope = angular.element( element).scope()
    value = scope.__subscriptionIds[0]
    return value
  }

  $scope.pushProperties = function( domSelector) {
    var subscriptionId = getScopeValue( domSelector)

    subscription.pushMessage(
      subscriptionId,
      'properties',
      [
        { entityId: microgridId1, key: 'key1', value: 'value1'},
        { entityId: microgridId1, key: 'key2', value: {a: 'a', b: 'b', c: [1, 2, 3]}},
        { entityId: microgridId1, key: 'key3', value: 'value3'}
      ]
    )
  }

});