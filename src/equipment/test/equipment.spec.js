describe('gb-measurements', function () {
  var parentScope, scope, $compile, $httpBackend, element,
      equipmentId = 'equipment-id-1',
      equipmentChildren = [],
      points = [
        {'name': 'MG1.Device1.Status', 'id': 'Device1.Status', 'pointType': 'STATUS', 'types': ['UtilityBreakerStatus', 'BreakerStatus', 'Point'], 'unit': 'status', 'endpoint': 'someEndpointUuid' },
        {'name': 'MG1.Device0.Status', 'id': 'Device0.Status', 'pointType': 'STATUS', 'types': ['Imported', 'CustomerBreakerStatus', 'BreakerStatus', 'Point'], 'unit': 'status', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
        {'name': 'MG1.Device2.kW_tot', 'id': 'Device2.kW_tot', 'pointType': 'ANALOG', 'types': ['Imported', 'DemandPower', 'Point'], 'unit': 'kW', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6' },
        {'name': 'MG1.Device3.Load', 'id': 'Device3.Load', 'pointType': 'ANALOG', 'types': ['Imported', 'LoadPower', 'Point'], 'unit': 'kW', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
        {'name': 'MG1.Device4.DR', 'id': 'Device4.DR', 'pointType': 'COUNTER', 'types': ['Point', 'DemandResponseStage', 'Imported'], 'unit': 'Stage', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'}
      ]

  var authToken = 'some auth token'
  var mocks = {
    authentication: {
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
  }

  beforeEach(module('greenbus.views.authentication'));
  beforeEach(module('greenbus.views.rest'));
  beforeEach(module('greenbus.views.equipment'));
  beforeEach(module('greenbus.views.template/equipment/equipment.html'));

  beforeEach(function () {
    module( function ($provide) {
      $provide.value('authentication', mocks.authentication);
      $provide.value('$stateParams', {
        microgridId: 'abc',
        navigationElement: {
          id: equipmentId,
          name: 'name',      // full entity name
          shortName: 'shortName',
          equipmentChildren: equipmentChildren
        },
      });
    });

  });
  beforeEach( inject(function( $injector) {
    $httpBackend = $injector.get('$httpBackend')
    $httpBackend.whenGET( '/models/1/points?equipmentIds=' + equipmentId + '&depth=9999&limit=100').respond( points)
  }))
  afterEach( function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  beforeEach(inject(function ($rootScope, _$compile_) {

    parentScope = $rootScope.$new();
    $compile = _$compile_;

    element = angular.element( '<gb-equipment></gb-equipment>');
    $compile(element)(parentScope);
    scope = element.isolateScope() || element.scope()
  }));


  function findTabs() {
    return element.find('.tab-pane')
  }


  it('no equipmentChildren should create two tabs - Measurements, Properties', inject( function () {
    $httpBackend.flush();
    scope.$digest();

    var tabs = findTabs()
    expect( tabs.length).toEqual(3);

  }));

  it('multiple equipmentChildren should only create Measurements and Points tabs', inject( function () {
    equipmentChildren.splice( 0, 0, {id: equipmentId})
    $httpBackend.flush();
    scope.$digest();

    var tabs = findTabs()
    expect( tabs.length).toEqual(2);

    expect(element.find('*[heading="Measurements"]').length).toBe(1)
    expect(element.find('*[heading="Properties"]').length).toBe(0)
    expect(element.find('*[heading="Points"]').length).toBe(1)

  }));


});

