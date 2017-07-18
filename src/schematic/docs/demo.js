angular.module('greenbus.views.demo').controller('SchematicDemoCtrl', function ($scope, $stateParams, $state, $location, subscription, rest) {

  var microgridId1 = 'microgrid-id-1'

  // $state.current.name = 'microgrids.dashboard' // so it picks up the micrigridId instead of looking for $stateParams.id
  $stateParams.microgridId = microgridId1
  $stateParams.id = microgridId1 // for the microgrid, the state is normally 'microgrids.dashboard', but that's not easy to hack.
  $stateParams.navigationElement = {
    id: microgridId1,
    name: 'MicgroGrid1',      // full entity name
    shortName: 'Microgrid1-schematic-demo',
    equipmentChildren: []
  }

  var measurementValue = 0,
      measurementDelta = 10,
      points = [
        {
          'name': 'BKR1.Status',
          'id': 'bkr1-status-id',
          'pointType': 'STATUS',
          'types': ['Point'],
          'unit': 'status',
          'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'
        },
        {
          'name': 'BKR2.Status',
          'id': 'bkr2-status-id',
          'pointType': 'STATUS',
          'types': ['Point'],
          'unit': 'status',
          'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'
        }
      ],
      pointNames = points.map(function(p){return p.name}),
      pointIds = points.map(function(p){return p.id})

  // $location.search( 'pids', point.id)

  function getScopeValue( domSelector) {
    var element, scope, value
    element = document.querySelector( domSelector)
    scope = angular.element( element).scope()
    value = scope.__subscriptionIds[0]
    return value
  }

  rest.whenGET( '/models/1/points?pnames=' + pointNames[0] + '&pnames=' + pointNames[1]).
    respond(points)
  // rest.whenGET( '/models/1/points?pids=' + point.id).
  //   respond([
  //     point
  //   ])


//   $scope.pushMessage = function() {
//
//     var now = Date.now()
//     if( measurementValue > 50)
//       measurementDelta = -10
//     else if( measurementValue <= 0)
//       measurementDelta = 10
//     measurementValue += measurementDelta
//     subscription.pushMessage(
//       'subscription.subscribeToMeasurementHistory',
//       'pointWithMeasurements',
//       {
//         'point':        {'id': point.id},
//         'measurements': [
//           {'value': measurementValue, 'type': 'DOUBLE', 'unit': 'kW', 'time': now, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}
// //          {'value': '100', 'type': 'DOUBLE', 'unit': 'kW', 'time': now - 3000, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'},
// //          {'value': '200', 'type': 'DOUBLE', 'unit': 'kW', 'time': now - 2000, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'},
// //          {'value': '150', 'type': 'DOUBLE', 'unit': 'kW', 'time': now - 1000, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}
//         ]
//       }
//     )
//   }

  var SCHEMATICS = [
    '<?xml version="1.0" encoding="UTF-8"?>\
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:svg="http://www.w3.org/2000/svg" xmlns:tgs="http://www.totalgrid.org" tgs:version="2.0" zoomAndPan="magnify" style="background-color:black" preserveAspectRatio="xMidYMid meet" viewBox="0 0 945.0 300.0">\
    <g>\
      <title>Layer 1</title>\
      <g name="DES3" tgs:schematic-type="label">\
        <text class="default" x="10" y="18">Schematic 1</text>\
      </g>\
      <g>\
        <svg preserveAspectRatio="xMaxYMax" class="symbol clickable" tgs:schematic-type="equipment-symbol" x="5" y="25" tgs:point-name="' + points[0].name + '" tgs:symbol-type="circuitbreaker" tgs:action="command">\
          <g tgs:state="Open" display="none"><rect x="2" y="2" width="30" height="30" style="fill:#00FF00"/></g>\
          <g tgs:state="Closed"><rect x="2" y="2" width="30" height="30" style="fill:#A40000"/></g>\
          <g tgs:state="Unknown">\
            <rect class="symbol-state-unknown" x="2" y="2" width="30" height="30"/>\
            <use class="quality-display" xlink:href="#quality_invalid" y="7" x="7"/>\
          </g>\
        </svg>\
      </g>\
      <g>\
        <svg preserveAspectRatio="xMaxYMax" class="symbol clickable" tgs:schematic-type="equipment-symbol" x="5" y="70" tgs:point-name="' + points[1].name + '" tgs:symbol-type="circuitbreaker" tgs:action="command">\
          <g tgs:state="Open" display="none">\
            <ellipse fill="#00FF00" stroke="#FFFFFF" cx="50" cy="10" rx="10" ry="10"/>\
          </g>\
          <g tgs:state="Closed" display="none">\
            <ellipse fill="#A40000" stroke="#FFFFFF" cx="15" cy="15" rx="10" ry="10"/>\
          </g>\
          <g tgs:state="Unknown">\
            <ellipse fill="none" stroke="#FFFFFF" cx="15" cy="15" rx="10" ry="10"/>\
            <use class="quality-display" xlink:href="#quality_invalid" y="5" x="5"/>\
          </g>\
          <g tgs:state="Unknown">\
            <ellipse fill="none" stroke="#FFFFFF" cx="15" cy="15" rx="10" ry="10"/>\
            <use class="quality-display" xlink:href="#quality_invalid" y="5" x="5"/>\
          </g>\
        </svg>\
      </g>\
    </g>\
    </svg>'
  ]

  var schematic = {
    index: 0,
    first: true
  }

  $scope.pushSchematic = function(domSelector) {
    var subscriptionId = getScopeValue( domSelector),
        typ = schematic.first ? 'properties' : 'notification.property',
        property = {'entityId': microgridId1, key: 'schematic', value: SCHEMATICS[schematic.index]},
        data = schematic.first ? [property] : property


    subscription.pushMessage(subscriptionId, typ, data)

    schematic.index += 1
    if( schematic.index >= SCHEMATICS.length)
      schematic.index = 0
    schematic.first = false
  }

  $scope.pushMeasurement = function(domSelector) {
    var subscriptionId = getScopeValue( domSelector)

    subscription.pushMessage(
      subscriptionId,
      'measurements',
      [
        {'point': {'id': '1fe7e9a9-96f2-4eb0-8fb2-0fedc34e4388'}, 'measurement': {'value': '15.248456', 'type': 'DOUBLE', 'unit': 'kW', 'time': 1417724070142, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}}
      ]
    )
  }

  // var req = {'subscribeToMeasurementHistory':{'pointId':'bkr1-status-id','timeFrom':1418135845373,'limit':3600,'subscriptionId':'subscription.subscribeToMeasurementHistory.dc97ecec-267d-40aa-cf95-d4f30955a849'}}
  // var r1 = {
  //   'subscriptionId':'subscription.subscribeToMeasurementHistory.dc97ecec-267d-40aa-cf95-d4f30955a849',
  //   'type':'pointWithMeasurements',
  //   'data':{
  //     'point':{'id':'bkr1-status-id'},
  //     'measurements':[
  //       {'value': '132.411334', 'type': 'DOUBLE', 'unit': 'kW', 'time': 1418135847082, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'},
  //       {'value': '132.430658', 'type': 'DOUBLE', 'unit': 'kW', 'time': 1418136055162, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'},
  //       {'value': '132.425595', 'type': 'DOUBLE', 'unit': 'kW', 'time': 1418136520282, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'},
  //       {'value': '132.423960', 'type': 'DOUBLE', 'unit': 'kW', 'time': 1418136979282, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'},
  //       {'value': '132.388818', 'type': 'DOUBLE', 'unit': 'kW', 'time': 1418137570882, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'},
  //       {'value': '132.361062', 'type': 'DOUBLE', 'unit': 'kW', 'time': 1418137888102, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'},
  //       {'value': '132.400026', 'type': 'DOUBLE', 'unit': 'kW', 'time': 1418138399122, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'},
  //       {'value': '132.418443', 'type': 'DOUBLE', 'unit': 'kW', 'time': 1418138779583, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'},
  //       {'value': '132.393553', 'type': 'DOUBLE', 'unit': 'kW', 'time': 1418139002962, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'},
  //       {'value': '132.394244', 'type': 'DOUBLE', 'unit': 'kW', 'time': 1418139443602, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}
  //     ]
  //   }
  // }
  // var r2 = {'subscriptionId':'subscription.subscribeToMeasurements.784d692f-74bf-4453-a79d-9a9526f4202d','type':'measurements','data':[{'point':{'id':'bkr1-status-id','name':'Eugene.CHP.kW_tot'},'measurement':{'value':'132.422222','type':'DOUBLE','unit':'kW','time':1418139446662,'validity':'GOOD','shortQuality':'','longQuality':'Good'}}]}
  // var r3 = {'subscriptionId':'subscription.subscribeToMeasurementHistory.dc97ecec-267d-40aa-cf95-d4f30955a849','type':'measurements','data':[{'point':{'id':'bkr1-status-id','name':'Eugene.CHP.kW_tot'},'measurement':{'value':'132.422222','type':'DOUBLE','unit':'kW','time':1418139446662,'validity':'GOOD','shortQuality':'','longQuality':'Good'}}]}

  rest.whenGET( '/models/1/points').
  respond([
    {'name': 'Eugene.PCC_Util.Status', 'id': '218bf05f-b479-49b6-99aa-c2803419d31f', 'pointType': 'STATUS', 'types': ['UtilityBreakerStatus', 'BreakerStatus', 'Point'], 'unit': 'status', 'endpoint': '73a3da76-14f7-40e3-b0bb-455af8ee066b'},
    {'name': 'Eugene.Grid.kW_tot', 'id': '1fe7e9a9-96f2-4eb0-8fb2-0fedc34e4388', 'pointType': 'ANALOG', 'types': ['Imported', 'DemandPower', 'Point'], 'unit': 'kW', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
    {'name': 'Eugene.PCC_Cust.Status', 'id': 'be2489c8-9b08-4822-8c7a-187180fb9460', 'pointType': 'STATUS', 'types': ['Imported', 'CustomerBreakerStatus', 'BreakerStatus', 'Point'], 'unit': 'status', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
    {'name': 'Eugene.Building.Load', 'id': 'a98ec09b-a584-42d9-bea5-dde5f071273f', 'pointType': 'ANALOG', 'types': ['Imported', 'LoadPower', 'Point'], 'unit': 'kW', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
    {'name': 'Eugene.Building.DemandResponseStage', 'id': '04db3bc6-9053-4785-9c6e-638c397f2850', 'pointType': 'COUNTER', 'types': ['Point', 'DemandResponseStage', 'Imported'], 'unit': 'Stage', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'}
  ])
  rest.whenPOST( '/models/1/points/commands', pointIds).
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



});
