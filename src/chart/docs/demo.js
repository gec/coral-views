angular.module('greenbus.views.demo').controller('ChartDemoCtrl', function ($scope, $location, subscription, rest, request, gbChartDivSize) {


  var measurementValue = 0,
      measurementDelta = 10,
      point = {
    'name': 'Eugene.Grid.kW_tot',
    'id': '1770ee28-fb60-4aab-9a46-a1af345cbc22',
    'pointType': 'ANALOG',
    'types': ['Imported', 'DemandPower', 'Point'],
    'unit': 'kW',
    'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'
  }

  $location.search( 'pids', point.id)

  gbChartDivSize.width = function() { return 500}
  gbChartDivSize.height = function() { return 300}

  rest.whenGET( '/models/1/points?pids=' + point.id).
    respond([
      point
    ])


  $scope.chartAdd = function() {
    request.push( 'gb-chart.addChart', [point])
  }
  $scope.pushMessage = function() {

    var now = Date.now()
    if( measurementValue > 50)
      measurementDelta = -10
    else if( measurementValue <= 0)
      measurementDelta = 10
    measurementValue += measurementDelta
    subscription.pushMessage(
      'subscription.subscribeToMeasurementHistory',
      'pointWithMeasurements',
      {
        'point':        {'id': point.id},
        'measurements': [
          {'value': measurementValue, 'type': 'DOUBLE', 'unit': 'kW', 'time': now, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}
//          {'value': '100', 'type': 'DOUBLE', 'unit': 'kW', 'time': now - 3000, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'},
//          {'value': '200', 'type': 'DOUBLE', 'unit': 'kW', 'time': now - 2000, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'},
//          {'value': '150', 'type': 'DOUBLE', 'unit': 'kW', 'time': now - 1000, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}
        ]
      }
    )
  }

  var req = {'subscribeToMeasurementHistory':{'pointId':'1770ee28-fb60-4aab-9a46-a1af345cbc22','timeFrom':1418135845373,'limit':3600,'subscriptionId':'subscription.subscribeToMeasurementHistory.dc97ecec-267d-40aa-cf95-d4f30955a849'}}
  var r1 = {
    'subscriptionId':'subscription.subscribeToMeasurementHistory.dc97ecec-267d-40aa-cf95-d4f30955a849',
    'type':'pointWithMeasurements',
    'data':{
      'point':{'id':'1770ee28-fb60-4aab-9a46-a1af345cbc22'},
      'measurements':[
        {'value': '132.411334', 'type': 'DOUBLE', 'unit': 'kW', 'time': 1418135847082, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'},
        {'value': '132.430658', 'type': 'DOUBLE', 'unit': 'kW', 'time': 1418136055162, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'},
        {'value': '132.425595', 'type': 'DOUBLE', 'unit': 'kW', 'time': 1418136520282, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'},
        {'value': '132.423960', 'type': 'DOUBLE', 'unit': 'kW', 'time': 1418136979282, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'},
        {'value': '132.388818', 'type': 'DOUBLE', 'unit': 'kW', 'time': 1418137570882, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'},
        {'value': '132.361062', 'type': 'DOUBLE', 'unit': 'kW', 'time': 1418137888102, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'},
        {'value': '132.400026', 'type': 'DOUBLE', 'unit': 'kW', 'time': 1418138399122, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'},
        {'value': '132.418443', 'type': 'DOUBLE', 'unit': 'kW', 'time': 1418138779583, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'},
        {'value': '132.393553', 'type': 'DOUBLE', 'unit': 'kW', 'time': 1418139002962, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'},
        {'value': '132.394244', 'type': 'DOUBLE', 'unit': 'kW', 'time': 1418139443602, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}
      ]
    }
  }
  var r2 = {'subscriptionId':'subscription.subscribeToMeasurements.784d692f-74bf-4453-a79d-9a9526f4202d','type':'measurements','data':[{'point':{'id':'1770ee28-fb60-4aab-9a46-a1af345cbc22','name':'Eugene.CHP.kW_tot'},'measurement':{'value':'132.422222','type':'DOUBLE','unit':'kW','time':1418139446662,'validity':'GOOD','shortQuality':'','longQuality':'Good'}}]}
  var r3 = {'subscriptionId':'subscription.subscribeToMeasurementHistory.dc97ecec-267d-40aa-cf95-d4f30955a849','type':'measurements','data':[{'point':{'id':'1770ee28-fb60-4aab-9a46-a1af345cbc22','name':'Eugene.CHP.kW_tot'},'measurement':{'value':'132.422222','type':'DOUBLE','unit':'kW','time':1418139446662,'validity':'GOOD','shortQuality':'','longQuality':'Good'}}]}

});
