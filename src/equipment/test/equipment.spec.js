describe('gb-measurements', function () {
  var parentScope, scope, $compile;
  var element,
      equipmentId = 'equipment-id-1',
      equipmentChildren = []

  beforeEach(module('greenbus.views.equipment'));
  beforeEach(module('greenbus.views.template/equipment/equipment.html'));

  beforeEach(function () {
    module( function ($provide) {
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

  beforeEach(inject(function ($rootScope, _$compile_) {

    parentScope = $rootScope.$new();
    $compile = _$compile_;

    element = angular.element( '<gb-equipment></gb-equipment>');
    $compile(element)(parentScope);
    scope = element.isolateScope() || element.scope()
  }));


  function findTabs() {
    return element.find('tab');
  }


  it('no equipmentChildren should create two tabs - Measurements, Properties', inject( function () {
    scope.$digest();

    var tabs = findTabs()
    expect( tabs.length).toEqual(2);

  }));

  it('multiple equipmentChildren should only create Measurements tab', inject( function () {
    equipmentChildren.splice( 0, 0, {})
    scope.$digest();

    var tabs = findTabs()
    expect( tabs.length).toEqual(1);

    var measurementsTab = element.find('*[heading="Measurements"]')
    expect(measurementsTab.length).toBe(1)

    var propertiesTab = element.find('*[heading="Properties"]')
    expect(propertiesTab.length).toBe(0)

  }));


});

