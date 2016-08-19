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
    var buttons = findButtons()
    expect( scope.model).toBe( GBSubscriptionViewState.NO_ITEMS)
    expect( buttons.count).toEqual(3)
    expect( buttons.first).toHaveClass( 'ng-hide')
    expect( buttons.previous).toHaveClass( 'disabled')
    expect( buttons.next).toHaveClass( 'disabled')
  }))

  it('should transition to FIRST_PAGE', inject( function () {
    var buttons = findButtons()
    parentScope.pageState = GBSubscriptionViewState.FIRST_PAGE
    parentScope.$digest()

    expect( scope.model).toBe( GBSubscriptionViewState.FIRST_PAGE)
    expect( buttons.first).toHaveClass( 'ng-hide')
    expect( buttons.previous).toHaveClass( 'disabled')
    expect( buttons.next).not.toHaveClass( 'disabled')
  }))

  it('should click pageNext and go to state PAGED', inject( function () {
    var buttons = findButtons()
    modelNextState = GBSubscriptionViewState.PAGED
    buttons.next.trigger('click')
    parentScope.$digest()
    expect( parentScope.pageNext).toHaveBeenCalled()

    expect( scope.model).toBe( GBSubscriptionViewState.PAGED)
    var bs = element.find('button')
    expect( buttons.first).not.toHaveClass( 'ng-hide')
    expect( buttons.previous).not.toHaveClass( 'disabled')
    expect( buttons.next).not.toHaveClass( 'disabled')
  }))

  it('should click pageNext and go to state LAST_PAGE', inject( function () {
    var buttons = findButtons()
    modelNextState = GBSubscriptionViewState.LAST_PAGE
    buttons.next.trigger('click')
    parentScope.$digest()
    expect( parentScope.pageNext).toHaveBeenCalled()

    expect( scope.model).toBe( GBSubscriptionViewState.LAST_PAGE)
    expect( buttons.first).not.toHaveClass( 'ng-hide')
    expect( buttons.previous).not.toHaveClass( 'disabled')
    expect( buttons.next).toHaveClass( 'disabled')
  }))

  it('should click pageNext, then pagePrevious and go to state PAGED', inject( function () {
    parentScope.pageState = GBSubscriptionViewState.FIRST_PAGE
    parentScope.$digest()

    var buttons = findButtons()
    modelNextState = GBSubscriptionViewState.PAGED
    buttons.next.trigger('click')
    parentScope.$digest()
    expect( parentScope.pageNext).toHaveBeenCalled()

    modelNextState = GBSubscriptionViewState.PAGED
    buttons.previous.trigger('click')
    parentScope.$digest()
    expect( parentScope.pagePrevious).toHaveBeenCalled()

    expect( scope.model).toBe( GBSubscriptionViewState.PAGED)
    expect( buttons.first).not.toHaveClass( 'ng-hide')
    expect( buttons.previous).not.toHaveClass( 'disabled')
    expect( buttons.next).not.toHaveClass( 'disabled')
  }))

  it('should spin pageNext in state PAGING_NEXT, then stop spin on transition to PAGED', inject( function () {
    parentScope.pageState = GBSubscriptionViewState.FIRST_PAGE
    parentScope.$digest()

    var buttons = findButtons()
    modelNextState = GBSubscriptionViewState.PAGING_NEXT
    buttons.next.trigger('click')
    parentScope.$digest()
    expect( parentScope.pageNext).toHaveBeenCalled()

    expect( scope.model).toBe( GBSubscriptionViewState.PAGING_NEXT)
    expect( buttons.first).not.toHaveClass( 'ng-hide')
    expect( buttons.previous).not.toHaveClass( 'disabled')
    expect( buttons.next).toHaveClass( 'disabled')

    var icon = findIcon(buttons.next)
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

    var buttons = findButtons()
    modelNextState = GBSubscriptionViewState.PAGING_PREVIOUS
    buttons.previous.trigger('click')
    parentScope.$digest()
    expect( parentScope.pagePrevious).toHaveBeenCalled()

    expect( scope.model).toBe( GBSubscriptionViewState.PAGING_PREVIOUS)
    expect( buttons.first).not.toHaveClass( 'ng-hide')
    expect( buttons.previous).toHaveClass( 'disabled')
    expect( buttons.next).not.toHaveClass( 'disabled')

    var icon = findIcon(buttons.previous)
    expect( icon).toHaveClass( 'fa-spin')
    expect( icon).toHaveClass( 'fa')
    expect( icon).toHaveClass( 'fa-chevron-left')

    parentScope.pageState = GBSubscriptionViewState.PAGED
    parentScope.$digest()
    expect( icon).not.toHaveClass( 'fa-spin')
  }))


});
