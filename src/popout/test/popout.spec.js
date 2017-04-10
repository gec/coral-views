describe('gbPopout', function () {
  var parentScope, scope, $compile, element, mock,
      microgridId = 'some-microgrid-id',
      stateName = 'some-state',
      stateHref = '#/some/url'


  beforeEach(module('greenbus.views.popout'));
  beforeEach(module('greenbus.views.template/popout/popout.html'));

  beforeEach(function () {

    mock = {
      state: {
        href: jasmine.createSpy( 'href').and.returnValue( stateHref),
        current: {
          name: stateName
        }
      },
      stateParams: {
        microgridId: microgridId
      },
      window: {
        open:   jasmine.createSpy( 'open')
      }
    }

    module( function ($provide) {
      $provide.value('$state', mock.state);
      $provide.value('$window', mock.window);
      $provide.value('$stateParams', mock.stateParams);
    });

  });

  function findButton() {
    return element.find('button').eq(0);
  }


  describe('default params', function () {

    beforeEach(inject(function ($rootScope, _$compile_) {

      parentScope = $rootScope.$new();
      $compile = _$compile_;

      // parentScope.items = items
      // parentScope.selectAllChanged = jasmine.createSpy('selectAllChanged')

      element = angular.element( '<gb-popout style="float: right;"></gb-popout>');
      $compile(element)(parentScope);
      parentScope.$digest();
      scope = element.isolateScope() || element.scope()
    }));


    it('should open new tab with default state and params', inject( function () {
      var button = findButton()
      button.trigger('click')

      expect( mock.state.href).toHaveBeenCalledWith( stateName, mock.stateParams);
      expect( mock.window.open).toHaveBeenCalledWith( 'popout/' + stateHref, '_blank', undefined);
    }))

  })

  describe('user state and params', function () {

    beforeEach(inject(function ($rootScope, _$compile_) {

      parentScope = $rootScope.$new();
      $compile = _$compile_;

      parentScope.href = 'custom-href/'
      parentScope.stateHref = '#/state-href'
      parentScope.windowParams = 'window-params'

      element = angular.element( '<gb-popout href="href" state-href="stateHref" window-params="windowParams" style="float: right;"></gb-popout>');
      $compile(element)(parentScope);
      parentScope.$digest();
      scope = element.isolateScope() || element.scope()
    }));


    it('should open new tab with user state and params', inject( function () {
      var button = findButton()
      button.trigger('click')

      expect( mock.state.href).not.toHaveBeenCalled();
      expect( mock.window.open).toHaveBeenCalledWith( 'custom-href/#/state-href', '_blank', 'window-params');
    }))

  })

});
