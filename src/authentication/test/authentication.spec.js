var authTokenName = 'coralAuthToken'
var authTokenValue = 'authTokenValue'

describe('authentication service with authToken cookie ', function() {

  var cookies = [];

  //you need to indicate your module in a test
  beforeEach(module('coral.views.authentication'));
  beforeEach( function() {
    module(function($provide) {
      cookies[authTokenName] = authTokenValue
      $provide.value( '$cookies', cookies)
    })
  });


  describe('authentication tests', function() {

    it('user should be logged in', angular.mock.inject(function(authentication) {
      cookies[authTokenName] = authTokenValue
      expect( authentication.isLoggedIn()).toBe(true);
    }));
  });
});


describe('authentication service log in/out successfully', function() {

  var service, $httpBackend,
    $window = {
      location: {
        href: null
      }
    },
    cookies = [];

  //you need to indicate your module in a test
  beforeEach( module('coral.views.authentication'));
  beforeEach( module(function($provide) {
    $provide.value( '$cookies', cookies)
    $provide.value( '$window', $window)
  }));
  beforeEach( inject(function( $injector) {
    $httpBackend = $injector.get('$httpBackend');
    service = $injector.get('authentication')

    var data = {
      'userName': 'userName',
      'password': 'password'
    }
    var response = {};
    response[ authTokenName] = authTokenValue
    $httpBackend.when( 'POST', '/login').respond( response)
  }));

  afterEach( function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });


  describe('authentication tests', function() {

    it('user should log in and out successfully', angular.mock.inject(function(authentication) {
      expect( authentication.isLoggedIn()).toBe(false);

      authentication.login( 'userName', 'password', 'redirectLocation')
      $httpBackend.flush();

      expect( cookies[authTokenName]).toBe( authTokenValue)
      expect( authentication.isLoggedIn()).toBe(true)
      expect( authentication.getStatus()).toEqual({
        status: authentication.STATE.LOGGED_IN,
        reinitializing: false,
        message: ''
      })
      expect( authentication.getAuthToken()).toBe(authTokenValue)
      expect( authentication.getHttpHeaders()).toEqual( {'Authorization': authTokenValue})
      expect( $window.location.href).toBe( '/#redirectLocation')

      // Logout after successful login
      $httpBackend.expectDELETE('/login').respond( {})
      authentication.logout()
      $httpBackend.flush();
      expect( authentication.isLoggedIn()).toBe( false)
      expect( authentication.getStatus()).toEqual({
        status: authentication.STATE.NOT_LOGGED_IN,
        reinitializing: false,
        message: ''
      })
      expect( $window.location.href).toBe( '/login')

    }));
  });
});

describe('authentication service log in failure', function() {

  var service, $httpBackend, cookies = [];

  //you need to indicate your module in a test
  beforeEach( module('coral.views.authentication'));
  beforeEach( module(function($provide) {
    $provide.value( '$cookies', cookies)
  }));
  beforeEach(inject(function( _$httpBackend_) {
    $httpBackend = _$httpBackend_;

    var data = {
      'userName': 'userName',
      'password': 'password'
    }
    var response = {};
    $httpBackend.expectPOST('/login').respond( 0, response)
  }));

  afterEach( function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });


  describe('authentication tests', function() {

    it('user should log in ', angular.mock.inject(function(authentication) {
      expect( authentication.isLoggedIn()).toBe(false);

      authentication.login( 'userName', 'password', 'redirectLocation')
      $httpBackend.flush();

      expect( cookies[authTokenName]).toBe( undefined)
      expect( authentication.isLoggedIn()).toBe( false)
      expect( authentication.getStatus()).toEqual({
        status: authentication.STATE.NOT_LOGGED_IN,
        reinitializing: false,
        message: 'Application server is not responding. Your network connection is down or the application server appears to be down.'
      })
      expect( authentication.getAuthToken()).toBe( undefined)
      expect( authentication.getHttpHeaders()).toEqual( {})
      //expect( window.location.href).toBe( 'redirectLocation')

    }));
  });
});
