describe('navigation', function () {
  var parentScope, scope, $httpBackend, replyMock, appsOperatorMenusLeft,
      alarmCount = 3,
      alarms = [],
      microgridsUrl = '/models/1/equipment?depth=1&rootTypes=MicroGrid',
      microgrids = [
        { id: 'microgrid-1', name: 'Microgrid1'},
        { id: 'microgrid-2', name: 'Microgrid2'}
      ],
      microgridsReverse = microgrids.slice().reverse()

  microgrids.forEach( function( mg) {
    mg.urls = {
      equipments: '/models/1/equipment/' + mg.id + '/descendants?depth=1',
      pvs: '/models/1/equipment/' + mg.id + '/descendants?depth=0&childTypes=PV',
      esses: '/models/1/equipment/' + mg.id + '/descendants?depth=0&childTypes=ESS',
      generations: '/models/1/equipment/' + mg.id + '/descendants?depth=0&childTypes=Generation',
      loads: '/models/1/equipment/' + mg.id + '/descendants?depth=0&childTypes=Load'
    }
  })


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

  function whenGETOneMicrogrid( mg) {

    console.log( 'whenGETOneMicrogrid: ' + mg.urls.equipments)
    $httpBackend.whenGET( mg.urls.equipments).
      respond([
        {'name': mg.name + '.ESS',      'id': mg.id + '-ESS',       'types': ['Equipment', 'ESS']},
        {'name': mg.name + '.PCC_Util', 'id': mg.id + '-PCC-Util',  'types': ['Equipment', 'Breaker']},
        {'name': mg.name + '.CHP',      'id': mg.id + '-CHP',       'types': ['Equipment', 'Generation', 'CHP']},
        {'name': mg.name + '.PCC_Cust', 'id': mg.id + '-PCC-Cust',  'types': ['Equipment', 'Breaker']},
        {'name': mg.name + '.PVUnit',   'id': mg.id + '-PVUnit',    'types': ['Equipment', 'Generation', 'PV']},
        {'name': mg.name + '.Building', 'id': mg.id + '-Building',  'types': ['Equipment', 'Load', 'DemandResponse']},
        {'name': mg.name + '.Grid',     'id': mg.id + '-Grid',      'types': ['Equipment', 'Grid', 'Substation']}
      ])
    $httpBackend.whenGET( mg.urls.pvs).
      respond([
        {'name': mg.name + '.PVUnit',   'id': mg.id + '-PVUnit',    'types': ['Equipment', 'Generation', 'PV']}
      ])
    $httpBackend.whenGET( mg.urls.esses).
      respond([
        {'name': mg.name + '.ESS',      'id': mg.id + '-ESS',       'types': ['Equipment', 'ESS']}
      ])
    $httpBackend.whenGET( mg.urls.generations).
      respond([
        {'name': mg.name + '.CHP',      'id': mg.id + '-CHP',       'types': ['Equipment', 'Generation', 'CHP']},
        {'name': mg.name + '.PVUnit',   'id': mg.id + '-PVUnit',    'types': ['Equipment', 'Generation', 'PV']}
      ])
    $httpBackend.whenGET( mg.urls.loads).
      respond([
        {'name': mg.name + '.Building', 'id': mg.id + '-Building',  'types': ['Equipment', 'Load', 'DemandResponse']}
      ])
  }
  function whenGETFullModel() {
    var microgridsResponse = microgrids.map( function( mg) {
      return {'entity': {'name': mg.name, 'id': mg.id, 'types': ['Root', 'MicroGrid', 'EquipmentGroup']}, 'children': []}
    })

    $httpBackend.whenGET( microgridsUrl).respond(microgridsResponse)
    // order matters. replaceTreeNodeAtIndexAndPreserveChildren inserts in reverse order.
    microgridsReverse.forEach( function( mg) { whenGETOneMicrogrid( mg)})
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
        'data': { 'label': 'Loading...', 'state': 'microgrids.dashboard', 'sourceUrl': '/models/1/equipment?depth=1&rootTypes=MicroGrid', 'insertLocation': 'REPLACE', 'selected': true, 'children': [
          { 'class': 'NavigationItemSource', 'data': { 'label': 'Equipment',      'state': '.equipments',  'sourceUrl': '/models/1/equipment/$parent/descendants?depth=1', 'insertLocation': 'CHILDREN', 'selected': false, 'children': []}},
          { 'class': 'NavigationItemSource', 'data': { 'label': 'Solar',          'state': '.pvs',         'sourceUrl': '/models/1/equipment/$parent/descendants?depth=0&childTypes=PV', 'insertLocation': 'CHILDREN', 'selected': false, 'children': []}},
          { 'class': 'NavigationItemSource', 'data': { 'label': 'Energy Storage', 'state': '.esses',       'sourceUrl': '/models/1/equipment/$parent/descendants?depth=0&childTypes=ESS', 'insertLocation': 'CHILDREN', 'selected': false, 'children': []}},
          { 'class': 'NavigationItemSource', 'data': { 'label': 'Generation',     'state': '.generations', 'sourceUrl': '/models/1/equipment/$parent/descendants?depth=0&childTypes=Generation', 'insertLocation': 'CHILDREN', 'selected': false, 'children': []}},
          { 'class': 'NavigationItemSource', 'data': { 'label': 'Load',           'state': '.loads',       'sourceUrl': '/models/1/equipment/$parent/descendants?depth=0&childTypes=Load', 'insertLocation': 'CHILDREN', 'selected': false, 'children': []}}
        ]
        }
      },
      { 'class': 'NavigationItem', 'data': { 'label': 'Endpoints', 'state': 'endpoints', 'selected': false, 'children': []}},
      { 'class': 'NavigationItem', 'data': { 'label': 'Events',    'state': 'events',    'selected': false, 'children': []}},
      { 'class': 'NavigationItem', 'data': { 'label': 'Alarms',    'state': 'alarms',    'selected': false, 'children': []}}
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
    var navTree, microgrid1, microgrid2, equipments, pvs, esses, generations, loads,
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

    $httpBackend.expectGET( microgridsUrl)
    microgridsReverse.forEach( function( mg) {
      $httpBackend.expectGET( mg.urls.equipments)
      $httpBackend.expectGET( mg.urls.pvs)
      $httpBackend.expectGET( mg.urls.esses)
      $httpBackend.expectGET( mg.urls.generations)
      $httpBackend.expectGET( mg.urls.loads)
    })
    $httpBackend.flush()
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();

    navTree = scope.navTree
    expect( navTree.length).toBe( 5)
    expect( navTree[0].label).toBe( microgrids[0].name)
    expect( navTree[1].label).toBe( microgrids[1].name)
    expect( navTree[2].label).toBe( 'Endpoints')
    expect( navTree[3].label).toBe( 'Events')
    expect( navTree[4].label).toBe( 'Alarms')

    microgrid1 = navTree[0]
    microgrid2 = navTree[1]
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

    //expect( scope.menuSelect).toHaveBeenCalled()
    //expect( scope.menuSelect.calls.count()).toBe( 1)

    // Expect sorted
    expect( equipments.equipmentChildren[0].name).toBe( microgrids[0].name + '.Building')

  }));

});
