angular.module('greenbus.views.demo').controller('PropertiesTableDemoCtrl', function ($scope, $stateParams, subscription) {
  var microgridId1 = 'microgrid-id-1'

  $stateParams.microgridId = 'abc'
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
        { key: 'key1', value: 'value1'},
        { key: 'key2', value: 'value2'},
        { key: 'key3', value: 'value3'}
      ]
    )
  }

});