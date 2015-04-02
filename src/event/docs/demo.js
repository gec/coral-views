angular.module('greenbus.views.demo').controller('EventDemoCtrl', function ($scope, rest, subscription) {
  var eventId = 0,
      alarmId = 0,
      eventCache = []

  function getScopeValue( domSelector, subscriptionKey) {
    var element, scope, value
    element = document.querySelector( domSelector)
    scope = angular.element( element).scope()
    value = scope[subscriptionKey]
    return value
  }

  $scope.pushEvent = function( domSelector, subscriptionKey) {
    var event,
        subscriptionId = getScopeValue( domSelector, subscriptionKey)

    eventId++
    event = {'id': eventId.toString(), 'deviceTime': 0, 'eventType': 'System.UserLogin', 'alarm': false, 'severity': 5, 'agent': 'system', 'entity': '44c0e05e-1e21-4785-a2ad-80fdfad8c51d', 'message': 'User logged in: system', 'time': Date.now()}
    eventCache.unshift( event)
    
    subscription.pushMessage(
      subscriptionId,
      'event',
      [
        event
      ]
    )
    
    // Next page is one after current event.
    var nextPage = eventCache.slice( 1, 4)
    rest.whenGET( '/models/1/events?startAfterId=' + eventId + '&limit=3').
      respond( nextPage)
  }



  $scope.pushAlarm = function( domSelector, subscriptionKey) {
    var subscriptionId = getScopeValue( domSelector, subscriptionKey)

    alarmId++
    var alarm  = {'id': alarmId.toString(), 'state': 'UNACK_AUDIBLE', 'eventId': '17', 'deviceTime': 0, 'eventType': 'Scada.Breaker', 'alarm': true, 'severity': 3, 'agent': 'system', 'entity': '218bf05f-b479-49b6-99aa-c2803419d31f', 'message': 'Breaker Opened: Openstatus validity GOOD', 'time': Date.now()}
    subscription.pushMessage(
      subscriptionId,
      'alarm', [ alarm ]
    )

    var a2 = angular.extend( {}, alarm, {state: 'UNACK_SILENT'}),
        a3 = angular.extend( {}, alarm, {state: 'ACKNOWLEDGED'}),
        a4 = angular.extend( {}, alarm, {state: 'REMOVED'})

    rest.whenPOST( '/models/1/alarms', { state: 'UNACK_SILENT', ids: [alarmId.toString()]}).respond([ a2 ])
    rest.whenPOST( '/models/1/alarms', { state: 'ACKNOWLEDGED', ids: [alarmId.toString()]}).respond([ a3 ])
    rest.whenPOST( '/models/1/alarms', { state: 'REMOVED', ids: [alarmId.toString()]}).respond([ a4 ])
  }



  var subscribeEvents = {
    'subscribeToEvents':{
      'eventTypes':[],
      'limit':40,
      'subscriptionId':'subscription.subscribeToEvents.fc96f4bc-a323-4f00-90d9-856fa13b408c'
    }
  }

  var events = {
    'subscriptionId': 'subscription.subscribeToEvents.8c30c910-ca56-4b9d-8039-d420a856d2db',
    'type': 'event',
    'data': [
      {'id': '134', 'deviceTime': 0, 'eventType': 'System.UserLogin', 'alarm': false, 'severity': 5, 'agent': 'system', 'entity': '44c0e05e-1e21-4785-a2ad-80fdfad8c51d', 'message': 'User logged in: system', 'time': 1416331910823},
      {'id': '133', 'deviceTime': 0, 'eventType': 'BridgeEvent', 'alarm': false, 'severity': 4, 'agent': 'system', 'entity': '1f40e0af-78a1-498d-8312-f3767c02104d', 'message': 'User logged in: system', 'time': 1416318773954},
      {'id': '132', 'deviceTime': 0, 'eventType': 'BridgeEvent', 'alarm': false, 'severity': 4, 'agent': 'system', 'entity': '1f40e0af-78a1-498d-8312-f3767c02104d', 'message': 'User logged in: system', 'time': 1416310720452},
      {'id': '131', 'deviceTime': 0, 'eventType': 'BridgeEvent', 'alarm': false, 'severity': 4, 'agent': 'system', 'entity': '1f40e0af-78a1-498d-8312-f3767c02104d', 'message': 'User logged in: system', 'time': 1416298641649},
      {'id': '130', 'deviceTime': 0, 'eventType': 'System.UserLogin', 'alarm': false, 'severity': 5, 'agent': 'system', 'entity': '44c0e05e-1e21-4785-a2ad-80fdfad8c51d', 'message': 'User logged in: system', 'time': 1416250152834},
      {'id': '129', 'deviceTime': 0, 'eventType': 'System.UserLogout', 'alarm': false, 'severity': 5, 'agent': '-', 'entity': '', 'message': 'User logged out', 'time': 1416250145365},
      {'id': '128', 'deviceTime': 0, 'eventType': 'BridgeEvent', 'alarm': false, 'severity': 4, 'agent': 'system', 'entity': '1f40e0af-78a1-498d-8312-f3767c02104d', 'message': 'User logged in: system', 'time': 1416249463572},
      {'id': '127', 'deviceTime': 0, 'eventType': 'System.UserLogin', 'alarm': false, 'severity': 5, 'agent': 'system', 'entity': '44c0e05e-1e21-4785-a2ad-80fdfad8c51d', 'message': 'User logged in: system', 'time': 1416240805039},
      {'id': '126', 'deviceTime': 0, 'eventType': 'System.UserLogin', 'alarm': false, 'severity': 5, 'agent': 'system', 'entity': '44c0e05e-1e21-4785-a2ad-80fdfad8c51d', 'message': 'User logged in: system', 'time': 1416237740094},
      {'id': '125', 'deviceTime': 0, 'eventType': 'System.UserLogin', 'alarm': false, 'severity': 5, 'agent': 'system', 'entity': '44c0e05e-1e21-4785-a2ad-80fdfad8c51d', 'message': 'User logged in: system', 'time': 1416237730012},
      {'id': '124', 'deviceTime': 0, 'eventType': 'System.UserLogin', 'alarm': false, 'severity': 5, 'agent': 'system', 'entity': '44c0e05e-1e21-4785-a2ad-80fdfad8c51d', 'message': 'User logged in: system', 'time': 1416237729292},
      {'id': '123', 'deviceTime': 0, 'eventType': 'System.UserLogin', 'alarm': false, 'severity': 5, 'agent': 'system', 'entity': '44c0e05e-1e21-4785-a2ad-80fdfad8c51d', 'message': 'User logged in: system', 'time': 1416237516788},
      {'id': '122', 'deviceTime': 0, 'eventType': 'System.UserLogin', 'alarm': false, 'severity': 5, 'agent': 'system', 'entity': '44c0e05e-1e21-4785-a2ad-80fdfad8c51d', 'message': 'User logged in: system', 'time': 1416237511065},
      {'id': '121', 'deviceTime': 0, 'eventType': 'System.UserLogin', 'alarm': false, 'severity': 5, 'agent': 'system', 'entity': '44c0e05e-1e21-4785-a2ad-80fdfad8c51d', 'message': 'User logged in: system', 'time': 1416237494582},
      {'id': '120', 'deviceTime': 0, 'eventType': 'BridgeEvent', 'alarm': false, 'severity': 4, 'agent': 'system', 'entity': '1f40e0af-78a1-498d-8312-f3767c02104d', 'message': 'User logged in: system', 'time': 1416232352063},
      {'id': '119', 'deviceTime': 0, 'eventType': 'System.UserLogin', 'alarm': false, 'severity': 5, 'agent': 'system', 'entity': '44c0e05e-1e21-4785-a2ad-80fdfad8c51d', 'message': 'User logged in: system', 'time': 1416232013516},
      {'id': '118', 'deviceTime': 0, 'eventType': 'System.UserLogin', 'alarm': false, 'severity': 5, 'agent': 'system', 'entity': '44c0e05e-1e21-4785-a2ad-80fdfad8c51d', 'message': 'User logged in: system', 'time': 1416232008530},
      {'id': '117', 'deviceTime': 0, 'eventType': 'System.UserLogin', 'alarm': false, 'severity': 5, 'agent': 'system', 'entity': '44c0e05e-1e21-4785-a2ad-80fdfad8c51d', 'message': 'User logged in: system', 'time': 1416232008305},
      {'id': '116', 'deviceTime': 0, 'eventType': 'BridgeEvent', 'alarm': false, 'severity': 4, 'agent': 'system', 'entity': '977ccdbe-5b64-4438-992d-ae238ccdc43c', 'message': 'User logged in: system', 'time': 1416152562981},
      {'id': '115', 'deviceTime': 0, 'eventType': 'BridgeEvent', 'alarm': false, 'severity': 4, 'agent': 'system', 'entity': '1f40e0af-78a1-498d-8312-f3767c02104d', 'message': 'User logged in: system', 'time': 1416113438525},
      {'id': '114', 'deviceTime': 0, 'eventType': 'BridgeEvent', 'alarm': false, 'severity': 4, 'agent': 'system', 'entity': '977ccdbe-5b64-4438-992d-ae238ccdc43c', 'message': 'User logged in: system', 'time': 1416104812387},
      {'id': '113', 'deviceTime': 0, 'eventType': 'BridgeEvent', 'alarm': false, 'severity': 4, 'agent': 'system', 'entity': '1f40e0af-78a1-498d-8312-f3767c02104d', 'message': 'User logged in: system', 'time': 1416103676244},
      {'id': '112', 'deviceTime': 0, 'eventType': 'BridgeEvent', 'alarm': false, 'severity': 4, 'agent': 'system', 'entity': '1f40e0af-78a1-498d-8312-f3767c02104d', 'message': 'User logged in: system', 'time': 1416103223215},
      {'id': '111', 'deviceTime': 0, 'eventType': 'BridgeEvent', 'alarm': false, 'severity': 4, 'agent': 'system', 'entity': '1f40e0af-78a1-498d-8312-f3767c02104d', 'message': 'User logged in: system', 'time': 1416102727214},
      {'id': '110', 'deviceTime': 0, 'eventType': 'BridgeEvent', 'alarm': false, 'severity': 4, 'agent': 'system', 'entity': '1f40e0af-78a1-498d-8312-f3767c02104d', 'message': 'User logged in: system', 'time': 1416004449600},
      {'id': '109', 'deviceTime': 0, 'eventType': 'BridgeEvent', 'alarm': false, 'severity': 4, 'agent': 'system', 'entity': '1f40e0af-78a1-498d-8312-f3767c02104d', 'message': 'User logged in: system', 'time': 1416001797818},
      {'id': '108', 'deviceTime': 0, 'eventType': 'BridgeEvent', 'alarm': false, 'severity': 4, 'agent': 'system', 'entity': '1f40e0af-78a1-498d-8312-f3767c02104d', 'message': 'User logged in: system', 'time': 1416001250108},
      {'id': '107', 'deviceTime': 0, 'eventType': 'BridgeEvent', 'alarm': false, 'severity': 4, 'agent': 'system', 'entity': '1f40e0af-78a1-498d-8312-f3767c02104d', 'message': 'User logged in: system', 'time': 1415995645646},
      {'id': '106', 'deviceTime': 0, 'eventType': 'BridgeEvent', 'alarm': false, 'severity': 4, 'agent': 'system', 'entity': '1f40e0af-78a1-498d-8312-f3767c02104d', 'message': 'User logged in: system', 'time': 1415993372727},
      {'id': '105', 'deviceTime': 0, 'eventType': 'BridgeEvent', 'alarm': false, 'severity': 4, 'agent': 'system', 'entity': '1f40e0af-78a1-498d-8312-f3767c02104d', 'message': 'User logged in: system', 'time': 1415993147643},
      {'id': '104', 'deviceTime': 0, 'eventType': 'System.UserLogin', 'alarm': false, 'severity': 5, 'agent': 'system', 'entity': '44c0e05e-1e21-4785-a2ad-80fdfad8c51d', 'message': 'User logged in: system', 'time': 1415979140003},
      {'id': '103', 'deviceTime': 0, 'eventType': 'System.UserLogin', 'alarm': false, 'severity': 5, 'agent': 'system', 'entity': '44c0e05e-1e21-4785-a2ad-80fdfad8c51d', 'message': 'User logged in: system', 'time': 1415979083136},
      {'id': '102', 'deviceTime': 0, 'eventType': 'BridgeEvent', 'alarm': false, 'severity': 4, 'agent': 'system', 'entity': '1f40e0af-78a1-498d-8312-f3767c02104d', 'message': 'User logged in: system', 'time': 1415968597089},
      {'id': '101', 'deviceTime': 0, 'eventType': 'System.UserLogin', 'alarm': false, 'severity': 5, 'agent': 'system', 'entity': '44c0e05e-1e21-4785-a2ad-80fdfad8c51d', 'message': 'User logged in: system', 'time': 1415894602846},
      {'id': '100', 'deviceTime': 0, 'eventType': 'BridgeEvent', 'alarm': false, 'severity': 4, 'agent': 'system', 'entity': '5bfdd44b-3c78-43e3-9b16-34379a16d26c', 'message': 'User logged in: system', 'time': 1415872350937},
      {'id': '99', 'deviceTime': 0, 'eventType': 'BridgeEvent', 'alarm': false, 'severity': 4, 'agent': 'system', 'entity': '977ccdbe-5b64-4438-992d-ae238ccdc43c', 'message': 'User logged in: system', 'time': 1415853853032},
      {'id': '98', 'deviceTime': 0, 'eventType': 'BridgeEvent', 'alarm': false, 'severity': 4, 'agent': 'system', 'entity': '1f40e0af-78a1-498d-8312-f3767c02104d', 'message': 'User logged in: system', 'time': 1415850346170},
      {'id': '97', 'deviceTime': 0, 'eventType': 'System.UserLogin', 'alarm': false, 'severity': 5, 'agent': 'system', 'entity': '44c0e05e-1e21-4785-a2ad-80fdfad8c51d', 'message': 'User logged in: system', 'time': 1415828167631},
      {'id': '96', 'deviceTime': 0, 'eventType': 'System.UserLogin', 'alarm': false, 'severity': 5, 'agent': 'system', 'entity': '44c0e05e-1e21-4785-a2ad-80fdfad8c51d', 'message': 'User logged in: system', 'time': 1415827269550},
      {'id': '95', 'deviceTime': 0, 'eventType': 'System.UserLogin', 'alarm': false, 'severity': 5, 'agent': 'system', 'entity': '44c0e05e-1e21-4785-a2ad-80fdfad8c51d', 'message': 'User logged in: system', 'time': 1415825901110}
    ]
  }

  var subcribeAlarms = {
    'subscribeToEvents': {
      'limit': 40,
      'subscriptionId': 'subscription.subscribeToEvents.61417dc9-2e7d-4b8d-f9cd-f6d9a3b268f2'
    }
  }

  var alarms = {
    'subscriptionId': 'subscription.subscribeToEvents.59713953-a630-4584-8a8d-7b617015a47b',
    'type': 'alarm',
    'data': [
      {'id': '3', 'state': 'UNACK_AUDIBLE', 'eventId': '48', 'deviceTime': 0, 'eventType': 'Scada.Breaker', 'alarm': true, 'severity': 3, 'agent': 'system', 'entity': '218bf05f-b479-49b6-99aa-c2803419d31f', 'message': 'Breaker Opened: Openstatus validity GOOD', 'time': 1415304360269},
      {'id': '2', 'state': 'UNACK_AUDIBLE', 'eventId': '22', 'deviceTime': 0, 'eventType': 'Scada.Breaker', 'alarm': true, 'severity': 3, 'agent': 'system', 'entity': '218bf05f-b479-49b6-99aa-c2803419d31f', 'message': 'Breaker Opened: Openstatus validity GOOD', 'time': 1415288035666},
      {'id': '1', 'state': 'UNACK_AUDIBLE', 'eventId': '17', 'deviceTime': 0, 'eventType': 'Scada.Breaker', 'alarm': true, 'severity': 3, 'agent': 'system', 'entity': '218bf05f-b479-49b6-99aa-c2803419d31f', 'message': 'Breaker Opened: Openstatus validity GOOD', 'time': 1415287958571}
    ]
  }

});