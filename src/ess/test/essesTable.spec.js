describe('gb-properties-table', function () {
  var scope, $compile, _subscription, _websocketFactory, $httpBackend,
      subscribeInstance = {};
  var element,
      microgridId = 'microgrid-1',
      properties = []

  var equipmentChildren = [
        { id: 'uuid-1', name: 'Microgrid1.Inverter1', shortName: undefined},
        { id: 'uuid-2', name: 'Microgrid1.Inverter2', shortName: undefined}
      ],
      navigationElement = {
        id: undefined,
          'class': 'NavigationItemSource',
          name: undefined,
          shortName: 'Energy Storage',
          types: undefined,
          equipmentChildren: equipmentChildren
        }

  var equipmentPoints = {
    'uuid-1': [
      {
        'name': 'Microgrid1.Inverter1.Enable',
        'id': 'uuid-1-status',
        'pointType': 'STATUS',
        'types': ['Point', 'Control', 'Standby'],
        'unit': 'Status',
        'endpoint': 'uuid-endpoint'
      },
      {
        'name': 'Microgrid1.Inverter1.StateOfChg',
        'id': 'uuid-1-soc',
        'pointType': 'ANALOG',
        'types': ['%SOC', 'Point'],
        'unit': 'Percent',
        'endpoint': 'uuid-endpoint'
      },
      {
        'name': 'Microgrid1.Inverter1.ActivePowerOutput',
        'id': 'uuid-1-power',
        'pointType': 'ANALOG',
        'types': ['OutputPower', 'Point'],
        'unit': 'Watts',
        'endpoint': 'uuid-endpoint'
      }
    ],
    'uuid-2': [
      {
        'name': 'Microgrid1.Inverter2.Enable',
        'id': 'uuid-2-status',
        'pointType': 'STATUS',
        'types': ['Point', 'Control', 'Standby'],
        'unit': 'Status',
        'endpoint': 'uuid-endpoint'
      },
      {
        'name': 'Microgrid1.Inverter2.StateOfChg',
        'id': 'uuid-2-soc',
        'pointType': 'ANALOG',
        'types': ['%SOC', 'Point'],
        'unit': 'Percent',
        'endpoint': 'uuid-endpoint'
      },
      {
        'name': 'Microgrid1.Inverter2.ActivePowerOutput',
        'id': 'uuid-2-power',
        'pointType': 'ANALOG',
        'types': ['OutputPower', 'Point'],
        'unit': 'Watts',
        'endpoint': 'uuid-endpoint'
      }
    ]
  }
  var pointIdMap = {}
  for( var eqId in equipmentPoints) {
    var index,
        eq = equipmentPoints[eqId]
    for( index = 0; index < eq.length; index++) {
      var point = eq[index]
      pointIdMap[point.id] = point
    }
  }

  var subscribeToMeasurementsResponse = [
    {
      'point': {'id': 'uuid-1-status'},  // Microgrid1.Inverter2.Enable
      'measurement': { 'value': 'Enabled', 'type': 'STRING', 'time': 1470856769630, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}
    },
    {
      'point': {'id': 'uuid-1-soc'}, // Microgrid1.Inverter2.StateOfChg
      'measurement': { 'value': '71.000000', 'type': 'DOUBLE', 'time': 1470863500559, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}
    },
    {
      'point': {'id': 'uuid-1-power'}, // Microgrid1.Inverter2.ActivePowerOutput
      'measurement': { 'value': '101.000000', 'type': 'DOUBLE', 'time': 1470671895705, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}
    },
    {
      'point': {'id': 'uuid-2-status'},  // Microgrid1.Inverter2.Enable
      'measurement': { 'value': 'Disabled', 'type': 'STRING', 'time': 1470856769630, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}
    },
    {
      'point': {'id': 'uuid-2-soc'}, // Microgrid1.Inverter2.StateOfChg
      'measurement': { 'value': '72.000000', 'type': 'DOUBLE', 'time': 1470863500559, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}
    },
    {
      'point': {'id': 'uuid-2-power'}, // Microgrid1.Inverter2.ActivePowerOutput
      'measurement': { 'value': '102.000000', 'type': 'DOUBLE', 'time': 1470671895705, 'validity': 'GOOD', 'shortQuality': '', 'longQuality': 'Good'}
    }
  ]

  var subscribeToPropertiesResponse = [ // type = 'properties'
    {
      entityId: 'uuid-1',
      key : 'nameplate',
      value: {
        type: 'ESS',
        manufacturer: 'Powerhub',
        model: 'PW01',
        SOC: {min: 11, max: 91},
        chargeRate: { min: 1, max: 11, target: 8},
        dischargeRate: { min: 1, max: 51},
        capacity: { energy: 501, power: 101},
        efficiency: 91,
        availableModes: { chargeDischarge: true, constantVars: false, frequencyWatt: false, smoothing: true}
      }
    },
    {
      entityId: 'uuid-2',
      key : 'nameplate',
      value: {
        type: 'ESS',
        manufacturer: 'Powerhub',
        model: 'PW01',
        SOC: {min: 12, max: 92},
        chargeRate: { min: 2, max: 12, target: 9},
        dischargeRate: { min: 2, max: 52},
        capacity: { energy: 502, power: 102},
        efficiency: 92,
        availableModes: { chargeDischarge: true, constantVars: false, frequencyWatt: false, smoothing: true}
      }
    }
  ]
  

  function makeSubscriptionId( request, idCounter) {
    return 'subscription.' + request.name + '.' + idCounter;
  }

  var authToken = 'some auth token',
      authenticationMock =   {
        isLoggedIn:   function() {
          return true
        },
        getAuthToken: function() {
          return authToken
        },
        getHttpHeaders: function() {
          return {'Authorization': authToken}
        }
      }


  beforeEach(module('greenbus.views.authentication'));
  beforeEach(module('greenbus.views.subscription'));
  beforeEach(module('greenbus.views.ess'));
  beforeEach(module('greenbus.views.template/ess/essesTable.html'));

  beforeEach(function () {
    subscribeInstance = {}
    _subscription = {
      subscribe: function (request, subscriberScope, onSuccess, onError) {
        if( request.name === 'SubscribeToMeasurements') {
          subscribeInstance.measurements = {
            id: makeSubscriptionId( request, 1),
            request: request,
            scope: subscriberScope,
            onSuccess: onSuccess,
            onError: onError
          }
        } else if( request.name === 'SubscribeToProperties') {
          subscribeInstance.properties = {
            id: makeSubscriptionId( request, 2),
            request: request,
            scope: subscriberScope,
            onSuccess: onSuccess,
            onError: onError
          }
        } else {
          fail( 'unknown subscription name \'' + request.name + '\'')
        }

        return subscribeInstance.measurements.id;
      }
    };

    _websocketFactory = {}
    module( function ($provide) {
      $provide.value('websocketFactory', _websocketFactory);
      $provide.value('authentication', authenticationMock);
      $provide.value('subscription', _subscription);
      $provide.value('$stateParams', {
        microgridId: microgridId,
        navigationElement: navigationElement
      });

    });

  });

  
  
  beforeEach( inject(function( $injector) {
    $httpBackend = $injector.get('$httpBackend')
    var uuids = Object.keys( equipmentPoints),
        equipmentQuery = 'equipmentIds=' + uuids[0] + '&equipmentIds=' + uuids[1],
        typesQuery = 'pointTypes=%25SOC&pointTypes=OutputPower&pointTypes=Standby'
    $httpBackend.whenGET( '/models/1/points?' + equipmentQuery + '&' + typesQuery).respond( equipmentPoints)
  }))

  beforeEach(inject(function ($rootScope, _$compile_) {

    scope = $rootScope;
    $compile = _$compile_;

    element = angular.element( '<gb-esses-table></gb-esses-table>');
    $compile(element)(scope);
    scope.$digest();
  }));


  function findEsssTableRows() {
    var table = element.find('table'),
        tbody = table.find('tbody').eq(0)
    return tbody.find('tr')
  }

  function findEssName( essRows, index) {
    return essRows.eq(index).find('td').eq(0).text()
  }
  function findEssPower( essRows, index) {
    return essRows.eq(index).find('td').eq(1).text()
  }
  function findEssState( essRows, index) {
    return essRows.eq(index).find('td').eq(2).text()
  }
  function findEssPercentSoc( essRows, index) {
    return essRows.eq(index).find('td').eq(4).text()
  }
  function findEssCapacityPower( essRows, index) {
    return essRows.eq(index).find('td').eq(5).text()
  }
  function findEssCapacityEnergy( essRows, index) {
    return essRows.eq(index).find('td').eq(6).text()
  }

  it('should subscribe to measurements and nameplate properties', inject( function () {
    var rows,
        subscribeToPointsRequest = {
          name: 'SubscribeToMeasurements',
          pointIds: ['uuid-1-soc', 'uuid-1-power', 'uuid-1-status', 'uuid-2-soc', 'uuid-2-power', 'uuid-2-status']
        },
        subscribeToPropertiesRequest = {
          name: 'SubscribeToProperties',
          entityIds: ['uuid-1', 'uuid-2'],
          keys: ['nameplate']
        }

    $httpBackend.flush();

    expect( subscribeInstance.measurements.onSuccess ).toBeDefined()
    expect( subscribeInstance.measurements.onError ).toBeDefined()
    expect( subscribeInstance.measurements.request ).toEqual( subscribeToPointsRequest)

    expect( subscribeInstance.properties.onSuccess ).toBeDefined()
    expect( subscribeInstance.properties.onError ).toBeDefined()
    expect( subscribeInstance.properties.request ).toEqual( subscribeToPropertiesRequest)


    subscribeInstance.measurements.onSuccess( subscribeInstance.measurements.id, 'measurements', subscribeToMeasurementsResponse)
    subscribeInstance.properties.onSuccess( subscribeInstance.properties.id, 'properties', subscribeToPropertiesResponse)

    rows = findEsssTableRows()

    expect( findEssName( rows, 0)).toEqual( equipmentChildren[0].name)
    expect( findEssPercentSoc( rows, 0)).toEqual( Number(subscribeToMeasurementsResponse[1].measurement.value).toFixed(0) + '%')
    expect( findEssPower( rows, 0)).toEqual( Number(subscribeToMeasurementsResponse[2].measurement.value).toFixed(0) + ' ' + pointIdMap['uuid-1-power'].unit)
    expect( findEssCapacityPower( rows, 0)).toEqual( Number(subscribeToPropertiesResponse[0].value.capacity.power).toFixed(0))
    expect( findEssCapacityEnergy( rows, 0)).toEqual( Number(subscribeToPropertiesResponse[0].value.capacity.energy).toFixed(0))

    expect( findEssName( rows, 1)).toEqual( equipmentChildren[1].name)
    expect( findEssPercentSoc( rows, 1)).toEqual( Number(subscribeToMeasurementsResponse[1+3].measurement.value).toFixed(0) + '%')
    expect( findEssPower( rows, 1)).toEqual( Number(subscribeToMeasurementsResponse[2+3].measurement.value).toFixed(0) + ' ' + pointIdMap['uuid-2-power'].unit)
    expect( findEssCapacityPower( rows, 1)).toEqual( Number(subscribeToPropertiesResponse[1].value.capacity.power).toFixed(0))
    expect( findEssCapacityEnergy( rows, 1)).toEqual( Number(subscribeToPropertiesResponse[1].value.capacity.energy).toFixed(0))
  }));

  //it('should update existing property', inject( function () {
  //  from propertiesTable.spec...
  //  var notificationProperty = {
  //    operation: 'MODIFIED',
  //    value: angular.extend( {}, properties[0], { value: 'updated'})
  //  }
  //
  //  subscribeInstance.measurements.onSuccess( subscribeInstance.measurements.id, 'properties', properties)
  //  subscribeInstance.measurements.onSuccess( subscribeInstance.measurements.id, 'notification.property', notificationProperty)
  //  scope.$digest();
  //
  //  var foundProperties = findPropertyRows()
  //  expect( foundProperties.length).toEqual(3)
  //
  //  var property = foundProperties.eq(0)
  //  expect( findTd( property, 0).text()).toBe( properties[0].key)
  //  expect( findTd( property, 1).text()).toBe( 'updated')
  //}));

});
