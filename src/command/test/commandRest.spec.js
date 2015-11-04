describe('gbCommandRest', function () {
  var $httpBackend, replyMock, command,
      accessMode = 'ALLOWED'

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



  beforeEach(module('greenbus.views.authentication'));
  beforeEach(module('greenbus.views.rest'));
  beforeEach(module('greenbus.views.command'));

  beforeEach(function () {

    command = {
      'name': 'PowerHub.ESS.SetReactivePower',
      'id': '4fc433a4-3ab5-4d9c-8eb8-3f0757d771bf',
      'commandType': 'SETPOINT_DOUBLE',
      'displayName': 'SetReactivePower',
      'endpoint': 'b43e2e0b-8db1-4eb9-910b-97d64df9dd9f'
    }


    module( function ($provide) {
      $provide.value('authentication', authenticationMock)
    });

    replyMock = jasmine.createSpyObj('replyMock', ['success', 'failure'])

  });

  beforeEach( inject(function( $injector) {
    $httpBackend = $injector.get('$httpBackend')
  }))

  afterEach( function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });


  it('on select success, should send a POST request and call successful notify', inject( function ( gbCommandRest) {

    var url = '/models/1/commandlock',
        args = {
          accessMode: accessMode,
          commandIds: [command.id]
        },
        reply = {
          'id': '85',
          'accessMode': accessMode,
          'expireTime': Date.now() + 30 * 1000,
          'commandIds': [command.id]
        }

    $httpBackend.when( 'POST', url, args).respond( reply)
    gbCommandRest.select( accessMode, [command.id], replyMock.success, replyMock.failure)
    $httpBackend.flush()
    expect( replyMock.success).toHaveBeenCalledWith( reply)
    expect( replyMock.failure).not.toHaveBeenCalled()

  }));

  it('on select failure, should send a POST request and call failure notify', inject( function ( gbCommandRest) {

    var url = '/models/1/commandlock',
        args = {
          accessMode: accessMode,
          commandIds: [command.id]
        },
        reply = {
          'exception':'LockedException',
          'message':'Commands already locked'
        }

    $httpBackend.when( 'POST', url, args).respond( 403, reply)
    gbCommandRest.select( accessMode, [command.id], replyMock.success, replyMock.failure)
    $httpBackend.flush()
    expect( replyMock.success).not.toHaveBeenCalled()
    expect( replyMock.failure).toHaveBeenCalledWith( reply, 403, jasmine.any(Function),jasmine.any(Object))

  }));


});
