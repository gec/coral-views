/*global describe beforeEach it expect */

describe('authentication.controller', function() {
  var loginController,
      scope = {};

  var authenticationMock = {
    userName:         null,
    password:         null,
    redirectLocation: null,
    errorListener:    null,
    getStatus:        function() { return 'some status' },
    login:            function(userName, password, redirectLocation, errorListener) {
      this.userName = userName
      this.password = password
      this.redirectLocation = redirectLocation
      this.errorListener = errorListener
    }
  }
  var modalMock = {
    result:          null,
    modalOptions:    'mOpts',
    modalController: null,
    handlePromise:   null,
    privateScope:    {},
    open:            function(modalOptions) {
      this.modalOptions = modalOptions
      var r = modalOptions.resolve
      return {
        result: {
          then: function(handlePromise) {
            modalMock.handlePromise = handlePromise
            this.modalController = new modalOptions.controller[5](modalMock.privateScope, modalMock, r.userName(), r.password(), r.error())
          }
        }
      }
    },
    close:           function(result) {
      modalMock.result = result
      modalMock.handlePromise(result)
    },

    clickLoginWith: function(userName, password) {
      this.privateScope.userName = userName
      this.privateScope.password = password
      this.privateScope.login()
    }
  }

  beforeEach(function() {
    module('coral.views.authentication');
    spyOn(modalMock, 'open').andCallThrough()
    spyOn(modalMock, 'close').andCallThrough()
    spyOn(authenticationMock, 'login').andCallThrough()
    inject(function($rootScope, $controller) {
      scope = $rootScope.$new();
      loginController = $controller('LoginController', {
        $scope:         scope,
        authentication: authenticationMock,
        $modal:         modalMock
      });
    });
  });

  it('should open modal dialog, handle login click, and authenticate successfully', function() {
    expect(scope.status).toBe('some status')
    expect(modalMock.open).toHaveBeenCalled()
    expect(modalMock.modalOptions.templateUrl).toBe('partials/loginmodal.html')

    modalMock.clickLoginWith('userName1', 'password1')
    expect(modalMock.close).toHaveBeenCalled()
    expect(authenticationMock.login).toHaveBeenCalledWith('userName1', 'password1', null, jasmine.any(Function))
  })

  it('should handle authentication error and show user name, password, and error', function() {

    scope.error = 'some error'
    modalMock.clickLoginWith('userName1', 'password1')
    expect(modalMock.close).toHaveBeenCalled()
    expect(authenticationMock.login).toHaveBeenCalledWith('userName1', 'password1', null, jasmine.any(Function))
    expect(modalMock.privateScope.error).toBeUndefined()

    authenticationMock.errorListener('some error')
    expect(modalMock.open.callCount).toEqual(2)
    expect(modalMock.privateScope.error).toBe('some error')
    expect(modalMock.privateScope.userName).toBe('userName1')
    expect(modalMock.privateScope.password).toBe('password1')
  })
});
