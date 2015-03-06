angular.module('greenbus.views.demo').controller('MeasurementValueDemoCtrl', function ($scope) {
  $scope.points = [
    {'name': 'one', 'id': '1', 'pointType': 'ANALOG', 'types': ['Imported', 'DemandPower', 'Point'], 'unit': 'kW', 'endpoint': '11'},
    {'name': 'bkr', 'id': '2', 'pointType': 'STATUS', 'types': ['Imported', 'CustomerBreakerStatus', 'BreakerStatus', 'Point'], 'unit': 'status', 'endpoint': '22'},
    {'name': 'three', 'id': '3', 'pointType': 'COUNTER', 'types': ['Point', 'DemandResponseStage', 'Imported'], 'unit': 'Stage', 'endpoint': '33'}
  ]
  $scope.points[0].currentMeasurement = {
    'value':        '15.248456',
    'type':         'DOUBLE',
    'unit':         'kW',
    'time':         1417724070142,
    'validity':     'GOOD',
    'shortQuality': '',
    'longQuality':  'Good'
  }
  $scope.points[1].currentMeasurement = {
    'value':        'closed',
    'type':         'STRING',
    'unit':         'status',
    'time':         1417724070142,
    'validity':     'GOOD',
    'shortQuality': 'N',
    'longQuality':  'Good'
  }
  $scope.points[2].currentMeasurement = {
    'value':        3,
    'type':         'INT',
    'unit':         'stage',
    'time':         1417724070142,
    'validity':     'GOOD',
    'shortQuality': 'R',
    'longQuality':  'Good'
  }


  $scope.selectAllChanged = function( state) {
    $scope.selectAllState = state
  }

  $scope.setShortQuality = function( index, shortQuality) {
    $scope.points[index].currentMeasurement.shortQuality = shortQuality
  }
});