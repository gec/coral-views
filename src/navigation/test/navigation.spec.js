describe('navigation', function () {
  var parentScope, scope, $httpBackend, replyMock, appsOperatorMenusLeft,
      alarmCount = 3,
      alarms = []


  var authToken = 'some auth token'
  var authenticationMock =   {
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

  function whenGETFullModel() {
    $httpBackend.whenGET( '/models/1/equipment?depth=1&rootTypes=MicroGrid').
      respond([
        {'entity': {'name': 'Microgrid1', 'id': 'a6be3d8e-7862-4ff8-b096-4c87f2939bd0', 'types': ['Root', 'MicroGrid', 'EquipmentGroup']}, 'children': []}
      ])
    $httpBackend.whenGET( '/models/1/equipment/a6be3d8e-7862-4ff8-b096-4c87f2939bd0/descendants?depth=1').
      respond([
        {'name': 'Microgrid1.ESS', 'id': '4e9a2bca-593d-491f-b8a4-1ed4ae2b6633', 'types': ['ESS', 'Imported', 'Equipment']},
        {'name': 'Microgrid1.PCC_Util', 'id': '52f50614-ae5d-4a92-b7c3-4c5ab979d90a', 'types': ['Equipment', 'Breaker']},
        {'name': 'Microgrid1.CHP', 'id': '60901f24-910e-422b-bc4b-04d5f8de3964', 'types': ['Generation', 'Equipment', 'Imported']},
        {'name': 'Microgrid1.PCC_Cust', 'id': 'ac674796-686c-41e5-815a-fb897514f5ce', 'types': ['Imported', 'Equipment', 'Breaker']},
        {'name': 'Microgrid1.PVUnit', 'id': 'c0a2e729-e5e8-4d54-9b89-8f9d3130d1b9', 'types': ['Equipment', 'PV', 'Generation','Imported']},
        {'name': 'Microgrid1.Building', 'id': 'ec50507e-50d2-4705-a64c-328d3df48599', 'types': ['Load', 'DemandResponse', 'Equipment', 'Imported']},
        {'name': 'Microgrid1.Grid', 'id': 'f42b850f-ceae-4809-9b84-c8e1dd072ca8', 'types': ['Grid', 'Substation', 'Equipment', 'Imported']}
      ])
    $httpBackend.whenGET( '/models/1/equipment/a6be3d8e-7862-4ff8-b096-4c87f2939bd0/descendants?depth=0&childTypes=PV').
      respond([
        {'name': 'Microgrid1.PVUnit', 'id': 'c0a2e729-e5e8-4d54-9b89-8f9d3130d1b9', 'types': ['Imported', 'PV', 'Equipment']}
      ])
    $httpBackend.whenGET( '/models/1/equipment/a6be3d8e-7862-4ff8-b096-4c87f2939bd0/descendants?depth=0&childTypes=ESS').
      respond([
        {'name': 'Microgrid1.ESS', 'id': '4e9a2bca-593d-491f-b8a4-1ed4ae2b6633', 'types': ['Imported', 'ESS', 'Equipment']}
      ])
    $httpBackend.whenGET( '/models/1/equipment/a6be3d8e-7862-4ff8-b096-4c87f2939bd0/descendants?depth=0&childTypes=Generation').
      respond([
        {'name': 'Microgrid1.CHP', 'id': '60901f24-910e-422b-bc4b-04d5f8de3964', 'types': ['Imported', 'Equipment', 'Generation']},
        {'name': 'Microgrid1.PVUnit', 'id': 'c0a2e729-e5e8-4d54-9b89-8f9d3130d1b9', 'types': ['Equipment', 'PV', 'Generation','Imported']}
      ])
    $httpBackend.whenGET( '/models/1/equipment/a6be3d8e-7862-4ff8-b096-4c87f2939bd0/descendants?depth=0&childTypes=Load').
      respond([
        {'name': 'Microgrid1.Building', 'id': 'ec50507e-50d2-4705-a64c-328d3df48599', 'types': ['Imported', 'Equipment', 'DemandResponse', 'Load']}
      ])
  }

  beforeEach(module('greenbus.views.authentication'));
  beforeEach(module('greenbus.views.rest'));
  beforeEach(module('greenbus.views.navigation'));

  beforeEach(function () {
    module( function ($provide) {
      $provide.value('authentication', authenticationMock)
    });

    replyMock = jasmine.createSpyObj('replyMock', ['success', 'failure'])

    appsOperatorMenusLeft = [
      {
        'class': 'NavigationItemSource',
        'data': { 'label': 'Loading...', 'state': 'microgrids.dashboard', 'url': '/microgrids/$this/dashboard', 'component': 'gb-measurements', 'componentType': 'COMPONENT', 'sourceUrl': '/models/1/equipment?depth=1&rootTypes=MicroGrid', 'insertLocation': 'REPLACE', 'selected': true, 'children': [
          { 'class': 'NavigationItemSource', 'data': { 'label': 'Equipment', 'state': '.equipments', 'url': '/microgrids/$parent/equipments', 'component': 'gb-measurements', 'componentType': 'COMPONENT', 'sourceUrl': '/models/1/equipment/$parent/descendants?depth=1', 'insertLocation': 'CHILDREN', 'selected': false, 'children': []}},
          { 'class': 'NavigationItemSource', 'data': { 'label': 'Solar', 'state': '.pvs', 'url': '/microgrids/$parent/pvs', 'component': 'gb-measurements', 'componentType': 'COMPONENT', 'sourceUrl': '/models/1/equipment/$parent/descendants?depth=0&childTypes=PV', 'insertLocation': 'CHILDREN', 'selected': false, 'children': []}},
          { 'class': 'NavigationItemSource', 'data': { 'label': 'Energy Storage', 'state': '.esses', 'url': '/microgrids/$parent/esses/', 'component': 'gb-esses', 'componentType': 'COMPONENT', 'sourceUrl': '/models/1/equipment/$parent/descendants?depth=0&childTypes=ESS', 'insertLocation': 'CHILDREN', 'selected': false, 'children': []}},
          { 'class': 'NavigationItemSource', 'data': { 'label': 'Generation', 'state': '.generations', 'url': '/microgrids/$parent/generations', 'component': 'gb-measurements', 'componentType': 'COMPONENT', 'sourceUrl': '/models/1/equipment/$parent/descendants?depth=0&childTypes=Generation', 'insertLocation': 'CHILDREN', 'selected': false, 'children': []}},
          { 'class': 'NavigationItemSource', 'data': { 'label': 'Load', 'state': '.loads', 'url': '/microgrids/$parent/loads', 'component': 'gb-measurements', 'componentType': 'COMPONENT', 'sourceUrl': '/models/1/equipment/$parent/descendants?depth=0&childTypes=Load', 'insertLocation': 'CHILDREN', 'selected': false, 'children': []}}
        ]
        }
      },
      { 'class': 'NavigationItem', 'data': { 'label': 'Endpoints', 'state': 'endpoints', 'url': '/endpoints', 'component': 'gb-endpoints', 'componentType': 'COMPONENT', 'selected': false, 'children': []}},
      { 'class': 'NavigationItem', 'data': { 'label': 'Events', 'state': 'events', 'url': '/events', 'component': '<gb-events limit="40"/>', 'componentType': 'TEMPLATE', 'selected': false, 'children': []}},
      { 'class': 'NavigationItem', 'data': { 'label': 'Alarms', 'state': 'alarms', 'url': '/alarms', 'component': '<gb-alarms limit="40"/>', 'componentType': 'TEMPLATE', 'selected': false, 'children': []}}
    ]
  });

  beforeEach( inject(function( $injector) {
    $httpBackend = $injector.get('$httpBackend')
  }))


  afterEach( function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });


  it('should get navigation elements, model entities, and populate tree menu.', inject( function ( navigation) {
    var navTree, microgrid1, equipments, pvs, esses, generations, loads,
        scope = {
          menuSelect: jasmine.createSpy('menuSelect'),
          $on: jasmine.createSpy('$on')
        },
        menuUrl = '/apps/operator/menus/left'

    $httpBackend.whenGET( menuUrl).respond( appsOperatorMenusLeft)
    whenGETFullModel()
    $httpBackend.expectGET( menuUrl)
    navigation.getNavTree( menuUrl, 'navTree', scope, scope.menuSelect)
    $httpBackend.verifyNoOutstandingExpectation();

    $httpBackend.expectGET( '/models/1/equipment?depth=1&rootTypes=MicroGrid')
    $httpBackend.expectGET( '/models/1/equipment/a6be3d8e-7862-4ff8-b096-4c87f2939bd0/descendants?depth=1')
    $httpBackend.expectGET( '/models/1/equipment/a6be3d8e-7862-4ff8-b096-4c87f2939bd0/descendants?depth=0&childTypes=PV')
    $httpBackend.expectGET( '/models/1/equipment/a6be3d8e-7862-4ff8-b096-4c87f2939bd0/descendants?depth=0&childTypes=ESS')
    $httpBackend.expectGET( '/models/1/equipment/a6be3d8e-7862-4ff8-b096-4c87f2939bd0/descendants?depth=0&childTypes=Generation')
    $httpBackend.expectGET( '/models/1/equipment/a6be3d8e-7862-4ff8-b096-4c87f2939bd0/descendants?depth=0&childTypes=Load')
    $httpBackend.flush()
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();

    navTree = scope.navTree
    expect( navTree.length).toBe( 4)
    expect( navTree[0].label).toBe( 'Microgrid1')
    expect( navTree[1].label).toBe( 'Endpoints')
    expect( navTree[2].label).toBe( 'Events')
    expect( navTree[3].label).toBe( 'Alarms')

    microgrid1 = navTree[0]
    expect( microgrid1.children.length).toBe( 5)
    expect( microgrid1.state).toBe( 'microgrids.dashboard')

    equipments =  microgrid1.children[0]
    pvs =  microgrid1.children[1]
    esses =  microgrid1.children[2]
    generations =  microgrid1.children[3]
    loads =  microgrid1.children[4]

    expect( equipments.children.length).toBe( 7)
    expect( pvs.children.length).toBe( 1)
    expect( esses.children.length).toBe( 1)
    expect( generations.children.length).toBe( 2)
    expect( loads.children.length).toBe( 1)

    expect( equipments.state).toBe( 'microgrids.equipments')
    expect( equipments.children[0].state).toBe( 'microgrids.equipmentsId')
    expect( pvs.state).toBe( 'microgrids.pvs')
    expect( pvs.children[0].state).toBe( 'microgrids.pvsId')
    expect( esses.state).toBe( 'microgrids.esses')
    expect( esses.children[0].state).toBe( 'microgrids.essesId')
    expect( generations.state).toBe( 'microgrids.generations')
    expect( generations.children[0].state).toBe( 'microgrids.generationsId')
    expect( loads.state).toBe( 'microgrids.loads')
    expect( loads.children[0].state).toBe( 'microgrids.loadsId')


    expect( microgrid1.equipmentChildren.length).toBe( 0)
    expect( equipments.equipmentChildren.length).toBe( 7)
    expect( pvs.equipmentChildren.length).toBe( 1)
    expect( esses.equipmentChildren.length).toBe( 1)
    expect( generations.equipmentChildren.length).toBe( 2)
    expect( loads.equipmentChildren.length).toBe( 1)

    expect( scope.menuSelect).toHaveBeenCalledWith( microgrid1)
    expect( scope.menuSelect.calls.count()).toBe( 1)

  }));

});
