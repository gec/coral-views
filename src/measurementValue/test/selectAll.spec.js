describe('gbSelectAll', function () {
  var parentScope, scope, $compile, element,
    itemCount = 3,
    items = [];

  beforeEach(module('greenbus.views.selection'));
  beforeEach(module('greenbus.views.template/selection/selectAll.html'));

  beforeEach(inject(function ($rootScope, _$compile_) {

    items = []
    for( var index = 0; index < itemCount; index++) {
      items.push( {
        id: 'id'+index
      })
    }

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

  it('should have proper selectAllState with selectAll(), then deselect individually', inject( function () {
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

  it('should not change selectAllState on selectAll() with empty model', inject( function () {
    var foundI = findI()

    scope.model = []

    scope.selectAll()
    expect( parentScope.selectAllChanged).not.toHaveBeenCalled()

  }))

  it('should have proper selectAllState with selectAll(), then deselect and remove model items individually', inject( function () {
    var foundI = findI()

    scope.selectAll()
    expect( parentScope.selectAllChanged).toHaveBeenCalledWith( 1)
    parentScope.selectAllChanged.calls.reset()

    // Deselect each

    parentScope.selectItem( items[2], 0)
    parentScope.items.splice(2, 1)
    parentScope.$digest()
    expect( foundI).toHaveClass( 'fa-minus-square-o');
    expect( parentScope.selectAllChanged).toHaveBeenCalledWith( 2)


    parentScope.selectAllChanged.calls.reset()
    parentScope.selectItem( items[1], 0)
    parentScope.items.splice(1, 1)
    parentScope.$digest()
    expect( foundI).toHaveClass( 'fa-minus-square-o');
    expect( parentScope.selectAllChanged).not.toHaveBeenCalled()

    parentScope.selectAllChanged.calls.reset()
    parentScope.selectItem( items[0], 0)
    parentScope.items.splice(0, 1)
    parentScope.$digest()
    expect( foundI).toHaveClass( 'fa-square-o text-muted');
    expect( parentScope.selectAllChanged).toHaveBeenCalledWith( 0)

  }))


});
