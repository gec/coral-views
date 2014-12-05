angular.module('greenbus.views.demo').controller('EndpointDemoCtrl', function ($scope, subscription, rest, $routeParams) {
  var measurementId = 0

  $routeParams.navId = 'equipment.a6be3d8e-7862-4ff8-b096-4c87f2939bd0'
  $routeParams.sourceUrl = '/models/1/equipment/a6be3d8e-7862-4ff8-b096-4c87f2939bd0/descendants?depth=1'

  rest.whenGET( '/models/1/endpoints').
    respond([
      {'id': '73a3da76-14f7-40e3-b0bb-455af8ee066b', 'name': 'SEL351-2', 'protocol': 'dnp3', 'enabled': true, 'commStatus': {'status': 'COMMS_UP', 'lastHeartbeat': 1417804973311}},
      {'id': '9c99715b-1739-4dda-adb1-eb8ca1a82db6', 'name': 'CloudBridge', 'protocol': 'bridge', 'enabled': true, 'commStatus': {'status': 'COMMS_UP', 'lastHeartbeat': 1417804974315}}
    ])

  $scope.pushMessage1Endpoints = function() {
    subscription.pushMessage(
      'subscription.subscribeToEndpoints',
      'endpoints',
      [
        {'id': '73a3da76-14f7-40e3-b0bb-455af8ee066b', 'name': 'SEL351-2', 'protocol': 'dnp3', 'enabled': false},
        {'id': '9c99715b-1739-4dda-adb1-eb8ca1a82db6', 'name': 'CloudBridge', 'protocol': 'bridge', 'enabled': false},
        {'id': '73a3da76-14f7-40e3-b0bb-455af8ee066b', 'name': 'SEL351-2', 'commStatus': {'status': 'COMMS_DOWN', 'lastHeartbeat': 1417807304128}},
        {'id': '9c99715b-1739-4dda-adb1-eb8ca1a82db6', 'name': 'CloudBridge', 'commStatus': {'status': 'ERROR', 'lastHeartbeat': 1417807301792}}
      ]
    )
  }
  $scope.pushMessage2Endpoint = function() {
    subscription.pushMessage(
      'subscription.subscribeToEndpoints',
      'endpoint',
      {
        'eventType': 'MODIFIED',
        'endpoint': {
          'id': '9c99715b-1739-4dda-adb1-eb8ca1a82db6',
          'name': 'CloudBridge',
          'commStatus': {
            'status': 'COMMS_UP',
            'lastHeartbeat': 1417807778662
          }
        }
      }
    )
  }

  var sub = {
    'subscribeToEndpoints': {
      'endpointIds': ['73a3da76-14f7-40e3-b0bb-455af8ee066b', '9c99715b-1739-4dda-adb1-eb8ca1a82db6'],
      'subscriptionId': 'subscription.subscribeToEndpoints.a66a6c62-86bd-42a5-d23b-93ee94a02c5c'}
  }


});