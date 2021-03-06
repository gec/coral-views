describe('schematic', function () {
  var _subscription, $httpBackend,
      subscribeInstance = {},
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

  var svgNamespaces = ' xmlns="http://www.w3.org/2000/svg" xmlns:tgs="http://www.totalgrid.org" xmlns:xlink="http://www.w3.org/1999/xlink" ',
      svgNoMeasurements  =
        '<?xml version="1.0"?>' +
        '<svg' + svgNamespaces + 'style="background-color:black;" preserveAspectRatio="xMidYMid meet" viewBox="0 0 1500.0 587.5">' +
          '<g id="svgContent">' +
            '<text x="20" y="20">Some content</text>' +
          '</g>' +
        '</svg>',
      svgOneMeasurement  =
        '<?xml version="1.0"?>' +
        '<svg' + svgNamespaces + 'style="background-color:black;" preserveAspectRatio="xMidYMid meet" viewBox="0 0 1500.0 587.5">' +
          '<g id="svgContent">' +
            '<g tgs:schematic-type="point" name="' + points[0].name + '" tgs:point-name="' + points[0].name + '" id="' + points[0].name + '">' +
              '<use class="quality-display" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#quality_invalid" y="78" x="257" id="svg_550"></use>' +
              '<text class="data-label" x="277" y="92" id="svg_551">48 kW</text>' +
            '</g>' +
          '</g>' +
        '</svg>',
      svgOneMeasurementMeasurementDecimals3  =
        '<?xml version="1.0"?>' +
        '<svg' + svgNamespaces + 'tgs:measurement-decimals="3" style="background-color:black;" preserveAspectRatio="xMidYMid meet" viewBox="0 0 1500.0 587.5">' +
          '<g id="svgContent">' +
            '<g tgs:schematic-type="point" name="' + points[0].name + '" tgs:point-name="' + points[0].name + '" id="' + points[0].name + '">' +
              '<use class="quality-display" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#quality_invalid" y="78" x="257" id="svg_550"></use>' +
              '<text class="data-label" x="277" y="92" id="svg_551">48 kW</text>' +
            '</g>' +
          '</g>' +
        '</svg>',
      svgOneEquipmentSymbol =
        '<?xml version="1.0"?>' +
        '<svg' + svgNamespaces + 'style="background-color:black;" preserveAspectRatio="xMidYMid meet" viewBox="0 0 1500.0 587.5">' +
          '<g id="svgContent">' +
            '<svg preserveAspectRatio="xMaxYMax" class="symbol" tgs:schematic-type="equipment-symbol" id="svg_619" x="484" y="404" tgs:point-name="' + points[1].name + '" tgs:symbol-type="circuitbreaker">' +
              '<g tgs:state="Open" display="none" id="svg_622">' +
              ' <rect x="2" y="2" width="30" height="30" fill="#00FF00" id="svg_623"/>' +
              '</g>' +
              '<g tgs:state="Closed" id="svg_620">' +
                '<rect x="2" y="2" width="30" height="30" fill="#A40000" id="svg_621"/>' +
              '</g>' +
            '</svg>' +
          '</g>' +
        '</svg>'


  function makeSubscriptionId( request, idCounter) {
    return 'subscription.' + request.name + '.' + idCounter;
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
  beforeEach(module('greenbus.views.template/schematic/equipmentSchematic.html'));


  beforeEach(function () {
    subscribeInstance = {}
    _subscription = {
      subscribe: function (request, subscriberScope, onMessage, onError) {
        subscribeInstance = {
          id: makeSubscriptionId( request, 1),
          request: request,
          scope: subscriberScope,
          onMessage: onMessage,
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
    $httpBackend.whenPOST( '/models/1/points/commands', [points[0].id]).respond( [
      // TODO: some commands to return.
    ])
    $httpBackend.whenPOST( '/models/1/points/commands', [points[1].id]).respond( [
      // TODO: some commands to return.
    ])
  }))

  describe('gbEquipmentSchematic', function () {
    var parentScope, scope, $compile, element


    beforeEach(inject(function ($rootScope, _$compile_, $q) {

      parentScope = $rootScope.$new();
      $compile    = _$compile_;

      //parentScope.pointsPromise = $q.when( {data: points})

      element = angular.element('<gb-equipment-schematic></gb-equipment-schematic>');
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

    function findEquipmentSymbolStates(equipmentElement) {
      return equipmentElement.find('[tgs\\:state]');
    }

    function findMeasurementUse(measurementG) {
      return measurementG.find('use').eq(0);
    }

    function getMeasurementValue(measurementGs, index) {
      return measurementGs.eq(index).find('text').eq(0).text();
    }

    function findCheckboxDivForOneTr(pointTr) {
      var td = pointTr.find('td').eq(0)
      return td.find('div').eq(0);
    }

    it('should ensure defs section is populated with quality symbols', inject(function (schematic) {
      var onSchematic = jasmine.createSpy('onSchematic'),
          svgContent  = svgOneMeasurement

      var properties = [
        {key: 'schematic', value: svgContent}
      ]
      expect(subscribeInstance.onMessage).toBeDefined()
      subscribeInstance.onMessage(subscribeInstance.id, 'properties', properties)

      scope.pointNameMap                 = {}
      scope.pointNameMap[points[0].name] = {
        name: points[0].name,
        unit: 'someUnit',
        currentMeasurement: {
          value: 'someValue',
          validity: 'GOOD'
        }
      }
      scope.$digest()


      var defs, good, invalid, questionable

      defs = element.find( 'defs')
      expect( defs.length).toBe(1)

      good = defs.children( '#quality_good')
      invalid = defs.children( '#quality_invalid')
      questionable = defs.children( '#quality_questionable')

      expect( good.length).toBe(1)
      expect( invalid.length).toBe(1)
      expect( questionable.length).toBe(1)

    }));

    it('should disable loading spinner after loading schematic without measurements', inject(function (schematic) {
      var measElems, measElem, measValue, measurements,
          onSchematic = jasmine.createSpy('onSchematic'),
          svgContent  = svgNoMeasurements

      var properties = [
        {key: 'schematic', value: svgContent}
      ]

      expect(subscribeInstance.onMessage).toBeDefined()
      subscribeInstance.onMessage(subscribeInstance.id, 'properties', properties)
      expect(scope.loading).toBeFalse()

    }));

    it('should transform measurements', inject(function (schematic) {
      var measElems, measElem, measValue, measurements,
          onSchematic = jasmine.createSpy('onSchematic'),
          svgContent  = svgOneMeasurement

      var properties = [
        {key: 'schematic', value: svgContent}
      ]

      expect(subscribeInstance.onMessage).toBeDefined()
      subscribeInstance.onMessage(subscribeInstance.id, 'properties', properties)

      measElems = findMeasurementGs()
      expect(measElems.length).toBe(1)
      measValue = getMeasurementValue(measElems, 0)
      expect(measValue).toEqual(' ')

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
      subscribeInstance.onMessage(subscribeInstance.id, 'measurements', measurements)
      measValue = getMeasurementValue(measElems, 0)
      expect(measValue).toEqual('248.0 kW')

      expect(scope.loading).toBeFalse()
    }));

    it('should transform measurements based on measurement-decimal', inject(function (schematic) {
      var measElems, measElem, measValue, measurements,
          onSchematic = jasmine.createSpy('onSchematic'),
          svgContent  = svgOneMeasurementMeasurementDecimals3

      var properties = [
        {key: 'schematic', value: svgContent}
      ]

      subscribeInstance.onMessage(subscribeInstance.id, 'properties', properties)
      expect(subscribeInstance.onMessage).toBeDefined()

      measElems = findMeasurementGs()
      expect(measElems.length).toBe(1)
      measValue = getMeasurementValue(measElems, 0)
      expect(measValue).toEqual(' ')

      scope.pointNameMap                 = {}
      scope.pointNameMap[points[0].name] = {
        name: points[0].name,
        unit: 'someUnit',
        currentMeasurement: {
          value: 'someValue',
          validity: 'GOOD'
        }
      }
      scope.$digest()

      measValue = getMeasurementValue(measElems, 0)
      expect(measValue).toEqual('someValue someUnit')


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
      subscribeInstance.onMessage(subscribeInstance.id, 'measurements', measurements)
      measValue = getMeasurementValue(measElems, 0)
      expect(measValue).toEqual('248.000 kW')

    }));

    it('should transform equipment symbols and update visible state', inject(function (schematic, $timeout) {
      var equipmentElems, stateElements, measValue, measurements,
          onSchematic = jasmine.createSpy('onSchematic'),
          svgContent  = svgOneEquipmentSymbol

      var properties = [
        {key: 'schematic', value: svgContent}
      ]

      subscribeInstance.onMessage(subscribeInstance.id, 'properties', properties)
      expect(subscribeInstance.onMessage).toBeDefined()

      equipmentElems = findEquipmentSymbolGs()
      expect(equipmentElems.length).toBe(1)
      stateElements = findEquipmentSymbolStates(equipmentElems.eq(0))
      expect(stateElements.length).toBe(2)

      scope.pointNameMap                 = {}
      scope.pointNameMap[points[1].name] = {
        name: points[1].name,
        unit: 'someUnit',
        currentMeasurement: {
          value: 'someValue',
          validity: 'GOOD'
        }
      }
      scope.$digest()

      expect(stateElements.eq(0).attr('ng-show')).toEqual('pointNameMap[\'' + points[1].name + '\'].currentMeasurement.value === \'Open\'')
      expect(stateElements.eq(1).attr('ng-show')).toEqual('pointNameMap[\'' + points[1].name + '\'].currentMeasurement.value === \'Closed\'')

      // Flush getPoints.
      $httpBackend.flush()

      measurements = [
        {
          'point': {'id': points[1].id},
          'measurement': {
            'value': 'Closed',
            'type': 'STRING',
            'unit': 'Status',
            'time': 1442261552564,
            'validity': 'GOOD',
            'shortQuality': '',
            'longQuality': 'Good'
          }
        }
      ]
      subscribeInstance.onMessage(subscribeInstance.id, 'measurements', measurements)
      scope.$digest()
      expect(stateElements.eq(0).attr('class')).toEqual('ng-hide')
      expect(stateElements.eq(1).attr('class')).toEqual('')

      measurements = [
        {
          'point': {'id': points[1].id},
          'measurement': {
            'value': 'Open',
            'type': 'STRING',
            'unit': 'Status',
            'time': 1442261552564,
            'validity': 'GOOD',
            'shortQuality': '',
            'longQuality': 'Good'
          }
        }
      ]
      subscribeInstance.onMessage(subscribeInstance.id, 'measurements', measurements)
      $timeout.flush()
      expect(stateElements.eq(0).attr('class')).toEqual('')
      expect(stateElements.eq(1).attr('class')).toEqual('ng-hide')

    }));

  }) // end describe 'gbEquipmentSchematic'



  describe( 'factory.schematic', function() {

    var svgWidth = '1680',
        svgHeight = '800',
        svgViewBox = '0 0 ' + svgWidth + ' '+ svgHeight,
        svgPreserveAspectRatio = 'xMidYMid meet',
        svgWidthHeightNoViewBox = '<?xml version="1.0"?>' +
                    '<svg' + svgNamespaces + 'width="'+svgWidth+'" height="'+svgHeight+'" meet"style="background-color:black;">' +
                      '<title>Zone1</title>' +
                      '<g><title>modeling</title></g>' +
                      '<g display="none"><title>navigation</title></g>' +
                    '</svg>',
        svgViewBoxAndPreserveAspectRatio = '<?xml version="1.0"?>' +
                    '<svg' + svgNamespaces + 'preserveAspectRatio="xMidYMid meet" viewBox="' + svgViewBox + '" style="background-color:black;">' +
                      '<title>Zone1</title>' +
                      '<g><title>modeling</title></g>' +
                      '<g display="none"><title>navigation</title></g>' +
                    '</svg>',
        svgNoDefs = '<?xml version="1.0"?>' +
                    '<svg' + svgNamespaces + 'style="background-color:black;" preserveAspectRatio="xMidYMid meet" viewBox="0 0 1500.0 587.5">' +
                      '<title>Zone1</title>' +
                      '<g><title>modeling</title></g>' +
                      '<g display="none"><title>navigation</title></g>' +
                    '</svg>',
        svgNoSymbols =  '<?xml version="1.0"?>' +
                        '<svg' + svgNamespaces + 'style="background-color:black;" preserveAspectRatio="xMidYMid meet" viewBox="0 0 1500.0 587.5">' +
                          '<title>Zone1</title>' +
                          '<defs></defs>' +
                          '<g><title>modeling</title></g>' +
                          '<g display="none"><title>navigation</title></g>' +
                        '</svg>',
        svgOneSymbol =  '<?xml version="1.0"?>' +
                        '<svg' + svgNamespaces + 'style="background-color:black;" preserveAspectRatio="xMidYMid meet" viewBox="0 0 1500.0 587.5">' +
                          '<title>Zone1</title>' +
                          '<defs>'+
                            '<symbol id="quality_questionable"><title>Quality Questionable</title><g>' +
                            '<path fill="#FFFF00" stroke="#999999" d="m7.5,5c0,0 2.5,0 5,0c2.5,0 2.5,0 2.5,2.5c0,2.5 0,2.5 0,5c0,2.5 0,2.5 -2.5,2.5c-2.5,0 -2.5,0 -5,0c-2.5,0 -2.5,0 -2.5,-2.5c0,-2.5 0,-2.5 0,-5c0,-2.5 0,-2.5 2.5,-2.5z"/>' +
                            '<text font-weight="bold" text-anchor="middle" font-family="serif" font-size="10" y="14" x="10" stroke-linecap="null" stroke-linejoin="null" stroke-dasharray="null" stroke-width="0" stroke="#999999" fill="#000000">?</text>' +
                            '</g></symbol>' +
                          '</defs>' +
                          '<g><title>modeling</title></g>' +
                          '<g display="none"><title>navigation</title></g>' +
                        '</svg>'


    it('should ensure scale to fit when width and height but no viewBox', inject( function ( schematic) {
      var svg, element, svgElem, width, height, viewBox, preserveAspectRatio

      element = $(document.createElement('div'))
      svg = $.parseHTML( svgWidthHeightNoViewBox)
      schematic.updateSvgElementAttributesToScaleToFitParentDiv( svg)
      element.prepend( svg)

      svgElem = element.find( 'svg')
      expect( svgElem.length).toBe(1)

      svgElem = svgElem[0]
      // IMPORTANT - jQuery .attr() ignores case. Need case sensitive Javascript .getAttribute().
      expect( svgElem.getAttribute('width')).toEqual( '100%')
      expect( svgElem.getAttribute('height')).toEqual( '100%')
      expect( svgElem.getAttribute('viewBox')).toEqual( svgViewBox)
      expect( svgElem.getAttribute('preserveAspectRatio')).toEqual( svgPreserveAspectRatio)
    }));

    it('should ensure scale to fit when viewBox, but no width or height', inject( function ( schematic) {
      var svg, element, svgElem, width, height, viewBox, preserveAspectRatio

      element = $(document.createElement('div'))
      svg = $.parseHTML( svgViewBoxAndPreserveAspectRatio)
      schematic.updateSvgElementAttributesToScaleToFitParentDiv( svg)
      element.prepend( svg)

      svgElem = element.find( 'svg')
      expect( svgElem.length).toBe(1)

      svgElem = svgElem[0]
      // IMPORTANT - jQuery .attr() ignores case. Need case sensitive Javascript .getAttribute().
      expect( svgElem.getAttribute('width')).toEqual( '100%')
      expect( svgElem.getAttribute('height')).toEqual( '100%')
      expect( svgElem.getAttribute('viewBox')).toEqual( svgViewBox)
      expect( svgElem.getAttribute('preserveAspectRatio')).toEqual( svgPreserveAspectRatio)
    }));

    it('should ensure quality symbols when no defs section', inject( function ( schematic) {
      var svg, element, defs, good, invalid, questionable

      element = $(document.createElement('div'))
      svg = $.parseHTML( svgNoDefs)
      schematic.ensureQualitySymbolsInDefs( svg)
      element.prepend( svg)

      defs = element.find( 'defs')
      expect( defs.length).toBe(1)

      good = defs.children( '#quality_good')
      invalid = defs.children( '#quality_invalid')
      questionable = defs.children( '#quality_questionable')

      expect( good.length).toBe(1)
      expect( invalid.length).toBe(1)
      expect( questionable.length).toBe(1)

    }));

    it('should ensure quality symbols when all are missing', inject( function ( schematic) {
      var element, defs, good, invalid, questionable

      element = $(document.createElement('div'))
      svg = $.parseHTML( svgNoSymbols)
      schematic.ensureQualitySymbolsInDefs( svg)
      element.prepend( svg)

      defs = element.find( 'defs')
      expect( defs.length).toBe(1)

      good = defs.children( '#quality_good')
      invalid = defs.children( '#quality_invalid')
      questionable = defs.children( '#quality_questionable')

      expect( good.length).toBe(1)
      expect( invalid.length).toBe(1)
      expect( questionable.length).toBe(1)

    }));

    it('should ensure quality symbols when some are missing', inject( function ( schematic) {
      var element, defs, good, invalid, questionable

      element = $(document.createElement('div'))
      svg = $.parseHTML( svgOneSymbol)
      schematic.ensureQualitySymbolsInDefs( svg)
      element.prepend( svg)


      defs = element.find( 'defs')
      expect( defs.length).toBe(1)

      good = defs.children( '#quality_good')
      invalid = defs.children( '#quality_invalid')
      questionable = defs.children( '#quality_questionable')

      expect( good.length).toBe(1)
      expect( invalid.length).toBe(1)
      expect( questionable.length).toBe(1)

    }));

    it('should subscribe to "schematic" property and call onMessage', inject( function ( schematic) {
      var scope = { $digest: jasmine.createSpy('$digest')},
          onSchematic = jasmine.createSpy('onSchematic'),
          svgContent = svgOneMeasurement

      schematic.subscribe( equipmentId, scope, onSchematic)

      var properties = [
        {key: 'schematic', value: svgContent, entityId: 'some-uuid'}
      ]

      var request = {
        name: 'SubscribeToProperties',
        entityIds:  [equipmentId],
        keys: ['schematic']
      }
      expect( subscribeInstance.onMessage ).toBeDefined()
      expect( subscribeInstance.onError ).toBeDefined()
      expect( subscribeInstance.request ).toEqual( request)
      subscribeInstance.onMessage( subscribeInstance.id, 'properties', properties)



      expect( onSchematic.calls.mostRecent().args).toEqual( [subscribeInstance.id, svgContent, 'CURRENT'])
    }));

    it('should handle subscription error by calling onError ', inject( function ( schematic) {
      var scope = { $digest: jasmine.createSpy('$digest')},
          onSchematic = jasmine.createSpy('onSchematic'),
          onError = jasmine.createSpy('onError'),
          svgContent = svgOneMeasurement,
          errorMessage = 'Some error message.',
          message = {
            error: errorMessage
          }


      schematic.subscribe( equipmentId, scope, onSchematic, onError)

      var properties = [
        {key: 'schematic', value: svgContent}
      ]

      var request = {
        name: 'SubscribeToProperties',
        entityIds:  [equipmentId],
        keys: ['schematic']
      }
      expect( subscribeInstance.onMessage ).toBeDefined()
      expect( subscribeInstance.onError ).toBeDefined()
      expect( subscribeInstance.request ).toEqual( request)
      subscribeInstance.onError( errorMessage, message)

      expect( onSchematic).not.toHaveBeenCalled()
      expect( onError.calls.mostRecent().args).toEqual( [errorMessage, message])
    }));


    it('should handle subscriber with no onError function', inject( function ( schematic) {
      var scope = { $digest: jasmine.createSpy('$digest')},
          onSchematic = jasmine.createSpy('onSchematic'),
          svgContent = svgOneMeasurement,
          errorMessage = 'Some error message.',
          message = {
            error: errorMessage
          }


      schematic.subscribe( equipmentId, scope, onSchematic)
      // Schematic error because no properties. Shouldn't call onError because it's undefined
      subscribeInstance.onMessage( subscribeInstance.id, 'properties', [])

      // Schematic should check for onError === undefined
      subscribeInstance.onError(errorMessage, message)

    }));


    it('should handle no schematic property by calling onError ', inject( function ( schematic) {
      var points, scope = { $digest: jasmine.createSpy('$digest')},
          onSchematic = jasmine.createSpy('onSchematic'),
          onError = jasmine.createSpy('onError'),
          errorMessage = 'No "schematic" property found.',
          message = {
            error: errorMessage
          }


      schematic.subscribe( equipmentId, scope, onSchematic, onError)

      var noProperties = []
      subscribeInstance.onMessage( subscribeInstance.id, 'properties', noProperties)

      expect( onSchematic).not.toHaveBeenCalled()
      expect( onError.calls.mostRecent().args).toEqual( [errorMessage, message])
    }));




  }) // end of describe 'factory.schematic'


});

