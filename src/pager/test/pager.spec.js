describe('gbPager', function () {
  var parentScope, scope, $compile, element, modelNextState

  var mock = {
    pageFirst: function() {parentScope.pageState = modelNextState},
    pagePrevious: function() {parentScope.pageState = modelNextState},
    pageNext: function() {parentScope.pageState = modelNextState}
  }

  beforeEach(module('greenbus.views.pager'))
  beforeEach(module('greenbus.views.template/pager/pager.html'))

  beforeEach(inject(function ($rootScope, _$compile_) {

    parentScope = $rootScope.$new()
    $compile = _$compile_

    parentScope.pageState = GBSubscriptionViewState.NO_ITEMS
    parentScope.pageFirst = spyOn( mock, 'pageFirst').and.callThrough()
    parentScope.pagePrevious = spyOn( mock, 'pagePrevious').and.callThrough()
    parentScope.pageNext = spyOn( mock, 'pageNext').and.callThrough()

    element = angular.element( '<gb-pager model="pageState" page-first="pageFirst()" page-previous="pagePrevious()" page-next="pageNext()"></gb-pager>')
    $compile(element)(parentScope)
    parentScope.$digest()
    scope = element.isolateScope() || element.scope()
  }))


  function resetMocks() {
    parentScope.pageFirst.calls.reset()
    parentScope.pagePrevious.calls.reset()
    parentScope.pageNext.calls.reset()
  }

  function findButtons( ) {
    var buttons = element.find('button')
    return {
      count: buttons.length,
      first: buttons.eq(0),
      previous: buttons.eq(1),
      next: buttons.eq(2)
    }
  }

  function findIcon( button) {
    return button.find('i')
  }

  it('should start with state NO_ITEMS', inject( function () {
    var button = findButtons()
    expect( scope.model).toBe( GBSubscriptionViewState.NO_ITEMS)
    expect( button.count).toEqual(3)
    expect( button.first).toHaveClass( 'ng-hide')
    expect( button.previous).toHaveClass( 'disabled')
    expect( button.next).toHaveClass( 'disabled')
  }))

  it('should transition to FIRST_PAGE', inject( function () {
    var button = findButtons()
    parentScope.pageState = GBSubscriptionViewState.FIRST_PAGE
    parentScope.$digest()

    expect( scope.model).toBe( GBSubscriptionViewState.FIRST_PAGE)
    expect( button.first).toHaveClass( 'ng-hide')
    expect( button.previous).toHaveClass( 'disabled')
    expect( button.next).not.toHaveClass( 'disabled')
  }))

  it('should click pageNext and go to state PAGED', inject( function () {
    var button = findButtons()
    modelNextState = GBSubscriptionViewState.PAGED
    button.next.trigger('click')
    parentScope.$digest()
    expect( parentScope.pageNext).toHaveBeenCalled()

    expect( scope.model).toBe( GBSubscriptionViewState.PAGED)
    var bs = element.find('button')
    expect( button.first).not.toHaveClass( 'ng-hide')
    expect( button.previous).not.toHaveClass( 'disabled')
    expect( button.next).not.toHaveClass( 'disabled')
  }))

  it('should click pageNext and go to state LAST_PAGE', inject( function () {
    var button = findButtons()
    modelNextState = GBSubscriptionViewState.LAST_PAGE
    button.next.trigger('click')
    parentScope.$digest()
    expect( parentScope.pageNext).toHaveBeenCalled()

    expect( scope.model).toBe( GBSubscriptionViewState.LAST_PAGE)
    expect( button.first).not.toHaveClass( 'ng-hide')
    expect( button.previous).not.toHaveClass( 'disabled')
    expect( button.next).toHaveClass( 'disabled')
  }))

  it('should click pageNext, then pagePrevious and go to state PAGED', inject( function () {
    parentScope.pageState = GBSubscriptionViewState.FIRST_PAGE
    parentScope.$digest()

    var button = findButtons()
    modelNextState = GBSubscriptionViewState.PAGED
    button.next.trigger('click')
    parentScope.$digest()
    expect( parentScope.pageNext).toHaveBeenCalled()

    modelNextState = GBSubscriptionViewState.PAGED
    button.previous.trigger('click')
    parentScope.$digest()
    expect( parentScope.pagePrevious).toHaveBeenCalled()

    expect( scope.model).toBe( GBSubscriptionViewState.PAGED)
    expect( button.first).not.toHaveClass( 'ng-hide')
    expect( button.previous).not.toHaveClass( 'disabled')
    expect( button.next).not.toHaveClass( 'disabled')
  }))

  it('should spin pageNext in state PAGING_NEXT, then stop spin on transition to PAGED', inject( function () {
    parentScope.pageState = GBSubscriptionViewState.FIRST_PAGE
    parentScope.$digest()

    var button = findButtons()
    modelNextState = GBSubscriptionViewState.PAGING_NEXT
    button.next.trigger('click')
    parentScope.$digest()
    expect( parentScope.pageNext).toHaveBeenCalled()

    expect( scope.model).toBe( GBSubscriptionViewState.PAGING_NEXT)
    expect( button.first).not.toHaveClass( 'ng-hide')
    expect( button.previous).not.toHaveClass( 'disabled')
    expect( button.next).toHaveClass( 'disabled')

    var icon = findIcon(button.next)
    expect( icon).toHaveClass( 'fa-spin')
    expect( icon).toHaveClass( 'fa')
    expect( icon).toHaveClass( 'fa-chevron-right')

    parentScope.pageState = GBSubscriptionViewState.PAGED
    parentScope.$digest()
    expect( icon).not.toHaveClass( 'fa-spin')

  }))

  it('should spin pagePrevious in state PAGING_PREVIOUS, then stop spin on transition to PAGED', inject( function () {
    parentScope.pageState = GBSubscriptionViewState.PAGED
    parentScope.$digest()

    var button = findButtons()
    modelNextState = GBSubscriptionViewState.PAGING_PREVIOUS
    button.previous.trigger('click')
    parentScope.$digest()
    expect( parentScope.pagePrevious).toHaveBeenCalled()

    expect( scope.model).toBe( GBSubscriptionViewState.PAGING_PREVIOUS)
    expect( button.first).not.toHaveClass( 'ng-hide')
    expect( button.previous).toHaveClass( 'disabled')
    expect( button.next).not.toHaveClass( 'disabled')

    var icon = findIcon(button.previous)
    expect( icon).toHaveClass( 'fa-spin')
    expect( icon).toHaveClass( 'fa')
    expect( icon).toHaveClass( 'fa-chevron-left')

    parentScope.pageState = GBSubscriptionViewState.PAGED
    parentScope.$digest()
    expect( icon).not.toHaveClass( 'fa-spin')
  }))


});
