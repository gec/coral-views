describe('gbSelectAll', function () {
  var parentScope, scope, $compile, element,
    itemCount = 3,
    items = [];

  for( var index = 0; index < itemCount; index++) {
    items.push( {
      id: 'id'+index
    })
  }

  beforeEach(module('greenbus.views.selection'));
  beforeEach(module('template/selection/selectAll.html'));

  beforeEach(inject(function ($rootScope, _$compile_) {

    parentScope = $rootScope.$new();
    $compile = _$compile_;

    parentScope.items = items
    parentScope.selectAllChanged = jasmine.createSpy('selectAllChanged')

    element = angular.element( '<gb-select-all model="items" notify="selectAllChanged(state)"></gb-select-all>');
    $compile(element)(parentScope);
    parentScope.$digest();
    scope = element.isolateScope() || element.scope()
  }));


  function findI( ) {
    return element.find('i').eq(0);
  }

  it('should start with select state 0', inject( function () {
    expect( scope.model).toBe( items);
    var foundI = findI()
    expect( foundI).toHaveClass( 'fa-square-o text-muted');
  }))

  it('should change selectAllState with selections', inject( function () {
    var foundI = findI()

    // Select each

    parentScope.selectItem( items[0])
    parentScope.$digest()
    expect( foundI).toHaveClass( 'fa-minus-square-o');
    expect( parentScope.selectAllChanged).toHaveBeenCalledWith( 2)

    parentScope.selectAllChanged.calls.reset()
    parentScope.selectItem( items[1])
    parentScope.$digest()
    expect( foundI).toHaveClass( 'fa-minus-square-o');
    expect( parentScope.selectAllChanged).not.toHaveBeenCalled()

    parentScope.selectAllChanged.calls.reset()
    parentScope.selectItem( items[2])
    parentScope.$digest()
    expect( foundI).toHaveClass( 'fa-check-square-o');
    expect( parentScope.selectAllChanged).toHaveBeenCalledWith( 1)


    // Deselect each

    parentScope.selectAllChanged.calls.reset()
    parentScope.selectItem( items[2])
    parentScope.$digest()
    expect( foundI).toHaveClass( 'fa-minus-square-o');
    expect( parentScope.selectAllChanged).toHaveBeenCalledWith( 2)


    parentScope.selectAllChanged.calls.reset()
    parentScope.selectItem( items[1])
    parentScope.$digest()
    expect( foundI).toHaveClass( 'fa-minus-square-o');
    expect( parentScope.selectAllChanged).not.toHaveBeenCalled()

    parentScope.selectAllChanged.calls.reset()
    parentScope.selectItem( items[0])
    parentScope.$digest()
    expect( foundI).toHaveClass( 'fa-square-o text-muted');
    expect( parentScope.selectAllChanged).toHaveBeenCalledWith( 0)

  }))

  it('should have proper selectAllState with selectAll(), the deselect individually', inject( function () {
    var foundI = findI()

    scope.selectAll()
    expect( parentScope.selectAllChanged).toHaveBeenCalledWith( 1)

    // Deselect each

    parentScope.selectAllChanged.calls.reset()
    parentScope.selectItem( items[2])
    parentScope.$digest()
    expect( foundI).toHaveClass( 'fa-minus-square-o');
    expect( parentScope.selectAllChanged).toHaveBeenCalledWith( 2)


    parentScope.selectAllChanged.calls.reset()
    parentScope.selectItem( items[1])
    parentScope.$digest()
    expect( foundI).toHaveClass( 'fa-minus-square-o');
    expect( parentScope.selectAllChanged).not.toHaveBeenCalled()

    parentScope.selectAllChanged.calls.reset()
    parentScope.selectItem( items[0])
    parentScope.$digest()
    expect( foundI).toHaveClass( 'fa-square-o text-muted');
    expect( parentScope.selectAllChanged).toHaveBeenCalledWith( 0)

  }))

});
