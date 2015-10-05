describe('schematic', function () {
  var parentScope, scope, $compile, _subscription, $httpBackend,
      subscribeInstance = {};
  var element, svgOneMeasurement, svgOneEquipmentSymbol,
      measurements = [];

  var equipmentId = 'equipmentId',
      points = [
        {'name': 'MG1.Device2.kW_tot', 'id': 'Device2.kW_tot', 'pointType': 'ANALOG', 'types': ['Imported', 'DemandPower', 'Point'], 'unit': 'kW', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6' },
        {'name': 'MG1.Device1.Status', 'id': 'Device1.Status', 'pointType': 'STATUS', 'types': ['UtilityBreakerStatus', 'BreakerStatus', 'Point'], 'unit': 'status', 'endpoint': 'someEndpointUuid' },
        {'name': 'MG1.Device0.Status', 'id': 'Device0.Status', 'pointType': 'STATUS', 'types': ['Imported', 'CustomerBreakerStatus', 'BreakerStatus', 'Point'], 'unit': 'status', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
        {'name': 'MG1.Device3.Load', 'id': 'Device3.Load', 'pointType': 'ANALOG', 'types': ['Imported', 'LoadPower', 'Point'], 'unit': 'kW', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
        {'name': 'MG1.Device4.DR', 'id': 'Device4.DR', 'pointType': 'COUNTER', 'types': ['Point', 'DemandResponseStage', 'Imported'], 'unit': 'Stage', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'}
      ],
      commands = {
        'Device0.Status': [  // for MG1.Device0.Status
          {'name': 'MG1.Device0.Close0', 'id': 'a1b8f486-f476-4095-8700-f25719ce41cd', 'commandType': 'CONTROL', 'displayName': 'Close0', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
          {'name': 'MG1.Device0.Trip0', 'id': '11aaf3b1-9777-4617-841f-564308752822', 'commandType': 'CONTROL', 'displayName': 'Trip0', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'}
        ],
        'Device1.Status': [ // for MG1.Device1.Status
          {'name': 'MG1.Device1.Close', 'id': '88305576-1c98-49fb-993f-233d2e137af8', 'commandType': 'CONTROL', 'displayName': 'Close', 'endpoint': '73a3da76-14f7-40e3-b0bb-455af8ee066b'},
          {'name': 'MG1.Device1.Trip', 'id': '02715339-51f9-4f7c-8898-b8261849220e', 'commandType': 'CONTROL', 'displayName': 'Trip', 'endpoint': '73a3da76-14f7-40e3-b0bb-455af8ee066b'}
        ]
      }

  svgOneMeasurement  =
    '<?xml version="1.0"?>' +
    '<svg  xmlns="http://www.w3.org/2000/svg" xmlns:tgs="http://www.totalgrid.org" xmlns:xlink="http://www.w3.org/1999/xlink" style="background-color:black;" preserveAspectRatio="xMidYMid meet" viewBox="0 0 1500.0 587.5">' +
      '<g id="svgContent">' +
        '<g tgs:schematic-type="point" name="' + points[0].name + '" tgs:point-name="' + points[0].name + '" id="' + points[0].name + '">' +
          '<use class="quality-display" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#quality_invalid" y="78" x="257" id="svg_550"></use>' +
          '<text class="data-label" x="277" y="92" id="svg_551">48 kW</text>' +
        '</g>' +
      '</g>' +
    '</svg>'
  svgOneEquipmentSymbol =
    '<?xml version="1.0"?>' +
    '<svg  xmlns="http://www.w3.org/2000/svg" xmlns:tgs="http://www.totalgrid.org" xmlns:xlink="http://www.w3.org/1999/xlink" style="background-color:black;" preserveAspectRatio="xMidYMid meet" viewBox="0 0 1500.0 587.5">' +
      '<g id="svgContent">' +
        '<svg preserveAspectRatio="xMaxYMax" class="symbol" tgs:schematic-type="equipment-symbol" id="svg_619" x="484" y="404" tgs:point-name="' + points[1].name + '" tgs:symbol-type="circuitbreaker">' +
          '<g tgs:state="OPEN" display="none" id="svg_622">' +
          ' <rect x="2" y="2" width="30" height="30" fill="#00FF00" id="svg_623"/>' +
          '</g>' +
          '<g tgs:state="CLOSED" id="svg_620">' +
            '<rect x="2" y="2" width="30" height="30" fill="#A40000" id="svg_621"/>' +
          '</g>' +
        '</svg>' +
      '</g>' +
    '</svg>'


  function makeSubscriptionId( request, idCounter) {
    var messageKey = Object.keys( request)[0]
    return 'subscription.' + messageKey + '.' + idCounter;
  }

  var authToken = 'some auth token'
  var mocks = {
    authentication: {
      isLoggedIn:   function() { return true },
      getAuthToken: function() { return authToken },
      getHttpHeaders: function() { return {'Authorization': authToken} }
    },
    request: {
      push: jasmine.createSpy('requestPush')
    }
  }


  beforeEach(module('greenbus.views.assert'));
  beforeEach(module('greenbus.views.schematic'));
  beforeEach(module('greenbus.views.measurement'));


  beforeEach(function () {
    subscribeInstance = {}
    _subscription = {
      subscribe: function (request, subscriberScope, onSuccess, onError) {
        subscribeInstance = {
          id: makeSubscriptionId( request, 1),
          request: request,
          scope: subscriberScope,
          onSuccess: onSuccess,
          onError: onError
        }

        return subscribeInstance.id;
      }
    };

    _websocketFactory = {}
    module( function ($provide) {
      $provide.value('authentication', mocks.authentication);
      $provide.value('subscription', _subscription);
      $provide.value('navigation', {});
      //$provide.value('$routeParams', {}); // no $routeParams.navId, depth, or equipmentIds
      $provide.value('$stateParams', {
        microgridId: 'abc',
        id: equipmentId,
        navigationElement: {
          id: equipmentId,
          name: 'name',      // full entity name
          shortName: 'shortName',
          equipmentChildren: []
        },
      });
    });

  });

  beforeEach( inject(function( $injector) {
    $httpBackend = $injector.get('$httpBackend')
    $httpBackend.whenGET( '/models/1/points?pnames=' + points[0].name).respond( [
      angular.extend( {} , points[0])
      //{'name': 'MG1.Device2.kW_tot', 'id': 'Device2.kW_tot', 'pointType': 'ANALOG', 'types': ['Imported', 'DemandPower', 'Point'], 'unit': 'kW', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6' }
    ])
    $httpBackend.whenGET( '/models/1/points?pnames=' + points[1].name).respond( [
      angular.extend( {} , points[1])
    ])
  }))


  beforeEach(inject(function ($rootScope, _$compile_, $q) {

    parentScope = $rootScope.$new();
    $compile = _$compile_;

    //parentScope.pointsPromise = $q.when( {data: points})

    element = angular.element( '<gb-equipment-schematic></gb-equipment-schematic>');
    $compile(element)(parentScope);
    parentScope.$digest();
    // No isolateScope() until after parentScope.$digest(). Possibly because of points-promise parameter?
    scope = element.isolateScope() || element.scope()
  }));


  function findMeasurementGs() {
    return element.find('g[tgs\\:schematic-type="point"]');
  }

  function findEquipmentSymbolGs() {
    return element.find('[tgs\\:schematic-type="equipment-symbol"]');  // Usually <svg></svg> instead of <g></g>, but could be either.
  }

  function findEquipmentSymbolStates( equipmentElement) {
    return equipmentElement.find('[tgs\\:state]');
  }

  function findMeasurementUse( measurementG) {
    return measurementG.find('use').eq(0);
  }

  function getMeasurementValue( measurementGs, index) {
    return measurementGs.eq(index).find('text').eq(0).text();
  }

  function findCheckboxDivForOneTr( pointTr) {
    var td = pointTr.find('td').eq(0)
    return td.find('div').eq(0);
  }

  it('should subscribe to schematic and call notify', inject( function ( schematic) {
    var points,
        scope = { $digest: jasmine.createSpy('$digest')},
        onSchematic = jasmine.createSpy('onSchematic'),
        svgContent = svgOneMeasurement

    schematic.subscribe( equipmentId, scope, onSchematic)

    var properties = [
      {key: 'schematic', value: svgContent}
    ]

    subscribeInstance.onSuccess( subscribeInstance.id, 'properties', properties)

    var request = {
      name: 'SubscribeToProperties',
      entityId:  equipmentId,
      keys: ['schematic']
    }
    expect( subscribeInstance.onSuccess ).toBeDefined()
    expect( subscribeInstance.onError ).toBeDefined()
    expect( subscribeInstance.request ).toEqual( request)


    expect( onSchematic.calls.mostRecent().args).toEqual( [subscribeInstance.id, svgContent, 'CURRENT'])
  }));

  it('should transform measurements', inject( function ( schematic) {
    var measElems, measElem, measValue, measurements,
        onSchematic = jasmine.createSpy('onSchematic'),
        svgContent = svgOneMeasurement

    var properties = [
      {key: 'schematic', value: svgContent}
    ]

    subscribeInstance.onSuccess( subscribeInstance.id, 'properties', properties)
    expect( subscribeInstance.onSuccess ).toBeDefined()

    measElems = findMeasurementGs()
    expect( measElems.length).toBe(1)
    measValue = getMeasurementValue( measElems, 0)
    expect( measValue).toEqual( ' ')

    scope.pointNameMap = {}
    scope.pointNameMap[ points[0].name] = {
      name: points[0].name,
      unit: 'someUnit',
      currentMeasurement: {
        value: 'someValue',
        validity: 'GOOD'
      }
    }
    scope.$digest()

    measValue = getMeasurementValue( measElems, 0)
    expect( measValue).toEqual( 'someValue someUnit')


    // Flush getPoints.
    $httpBackend.flush()

    measurements = [
      {
        'point': {'id': points[0].id},
        'measurement': {
          'value': '248.000000',
          'type': 'DOUBLE',
          'unit': 'kW',
          'time': 1442261552564,
          'validity': 'GOOD',
          'shortQuality': '',
          'longQuality': 'Good'
        }
      }
    ]
    subscribeInstance.onSuccess( subscribeInstance.id, 'measurements', measurements)
    measValue = getMeasurementValue( measElems, 0)
    expect( measValue).toEqual( '248 kW')

  }));

  it('should transform equipment symbols and update visible state', inject( function ( schematic) {
    var equipmentElems, stateElements, measValue, measurements,
        onSchematic = jasmine.createSpy('onSchematic'),
        svgContent = svgOneEquipmentSymbol

    var properties = [
      {key: 'schematic', value: svgContent}
    ]

    subscribeInstance.onSuccess( subscribeInstance.id, 'properties', properties)
    expect( subscribeInstance.onSuccess ).toBeDefined()

    equipmentElems = findEquipmentSymbolGs()
    expect( equipmentElems.length).toBe(1)
    stateElements = findEquipmentSymbolStates( equipmentElems.eq(0))
    expect( stateElements.length).toBe( 2)

    scope.pointNameMap = {}
    scope.pointNameMap[ points[1].name] = {
      name: points[1].name,
      unit: 'someUnit',
      currentMeasurement: {
        value: 'someValue',
        validity: 'GOOD'
      }
    }
    scope.$digest()

    expect( stateElements.eq(0).attr( 'ng-show')).toEqual( 'pointNameMap[\'' + points[1].name + '\'].currentMeasurement.value === \'OPEN\'')
    expect( stateElements.eq(1).attr( 'ng-show')).toEqual( 'pointNameMap[\'' + points[1].name + '\'].currentMeasurement.value === \'CLOSED\'')

    // Flush getPoints.
    $httpBackend.flush()

    measurements = [
      {
        'point': {'id': points[1].id},
        'measurement': {
          'value': 'CLOSED',
          'type': 'STRING',
          'unit': 'Status',
          'time': 1442261552564,
          'validity': 'GOOD',
          'shortQuality': '',
          'longQuality': 'Good'
        }
      }
    ]
    subscribeInstance.onSuccess( subscribeInstance.id, 'measurements', measurements)
    expect( stateElements.eq(0).attr( 'class')).toEqual( 'ng-hide')
    expect( stateElements.eq(1).attr( 'class')).toEqual( '')

    measurements = [
      {
        'point': {'id': points[1].id},
        'measurement': {
          'value': 'OPEN',
          'type': 'STRING',
          'unit': 'Status',
          'time': 1442261552564,
          'validity': 'GOOD',
          'shortQuality': '',
          'longQuality': 'Good'
        }
      }
    ]
    subscribeInstance.onSuccess( subscribeInstance.id, 'measurements', measurements)
    expect( stateElements.eq(0).attr( 'class')).toEqual( '')
    expect( stateElements.eq(1).attr( 'class')).toEqual( 'ng-hide')

  }));


});

describe( 'schematic tests', function() {
  it('should ...')
})
