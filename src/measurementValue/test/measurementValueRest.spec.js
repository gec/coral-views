describe('measurementValueRest', function () {
  var $httpBackend, replyMock

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


  function makeMeasurementFromOverride( overrideValue) {
    return {
      value: overrideValue.value,
      type: overrideValue.valueType,
      unit: 'kW',
      time: Date.now(),
      validity: 'GOOD',
      shortQuality: 'R',
      longQuality: 'Good (replaced)'
    }
  }
  function makeMeasurementFromNis( nisValue) {
    return {
      value: nisValue.value,
      type: nisValue.valueType,
      unit: 'kW',
      time: Date.now(),
      validity: 'GOOD',
      shortQuality: 'N',
      longQuality: 'Good (NIS)'
    }
  }
  function makeMeasurementFromRemove( value, valueType) {
    return {
      value: value,
      type: valueType,
      unit: 'kW',
      time: Date.now(),
      validity: 'GOOD',
      shortQuality: '',
      longQuality: 'Good'
    }
  }

  beforeEach(module('greenbus.views.authentication'));
  beforeEach(module('greenbus.views.rest'));
  beforeEach(module('greenbus.views.measurementValue'));

  beforeEach(function () {
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


  it('on override success, should send a POST request and call successful notify', inject( function ( gbMeasurementValueRest) {

    var pointId = 'id1',
        overrideValue = { value: '10.0', valueType: 'DOUBLE'},
        url = '/models/1/points/' + pointId + '/override',
        reply = {
          pointId: pointId,
          measurement: makeMeasurementFromOverride( overrideValue)
        }

    $httpBackend.when( 'POST', url, overrideValue).respond( reply)
    gbMeasurementValueRest.override( pointId, overrideValue.value, overrideValue.valueType, replyMock, replyMock.success, replyMock.failure)
    $httpBackend.flush()
    expect( replyMock.success).toHaveBeenCalledWith( reply)
    expect( replyMock.failure).not.toHaveBeenCalled()

  }));

  it('on override failure, should send a POST request and call failure notify', inject( function ( gbMeasurementValueRest) {

    var pointId = 'id1',
        overrideValue = { value: '10.0', valueType: 'DOUBLE'},
        url = '/models/1/points/' + pointId + '/override'

    $httpBackend.when( 'POST', url, overrideValue).respond( 403, {})
    gbMeasurementValueRest.override( pointId, overrideValue.value, overrideValue.valueType, replyMock, replyMock.success, replyMock.failure)
    $httpBackend.flush()
    expect( replyMock.success).not.toHaveBeenCalled()
    expect( replyMock.failure).toHaveBeenCalledWith( pointId, {}, 403)

  }));

  it('on NIS success, should send a POST request and call successful notify', inject( function ( gbMeasurementValueRest) {

    var pointId = 'id1',
        nisValue = { value: '10.0', valueType: 'DOUBLE'},
        url = '/models/1/points/' + pointId + '/nis',
        reply = {
          pointId: pointId,
          measurement: makeMeasurementFromNis( nisValue)
        }

    $httpBackend.when( 'POST', url).respond( reply)
    gbMeasurementValueRest.nis( pointId, replyMock, replyMock.success, replyMock.failure)
    $httpBackend.flush()
    expect( replyMock.success).toHaveBeenCalledWith( reply)
    expect( replyMock.failure).not.toHaveBeenCalled()

  }));

  it('on NIS failure, should send a POST request and call failure notify', inject( function ( gbMeasurementValueRest) {

    var pointId = 'id1',
        nisValue = { value: '10.0', valueType: 'DOUBLE'},
        url = '/models/1/points/' + pointId + '/nis'

    $httpBackend.when( 'POST', url).respond( 403, {})
    gbMeasurementValueRest.nis( pointId, replyMock, replyMock.success, replyMock.failure)
    $httpBackend.flush()
    expect( replyMock.success).not.toHaveBeenCalled()
    expect( replyMock.failure).toHaveBeenCalledWith( pointId, {}, 403)

  }));

  it('on remove success, should send a DELETE request and call successful notify', inject( function ( gbMeasurementValueRest) {

    var pointId = 'id1',
        url = '/models/1/points/' + pointId + '/nis',
        reply = {
          pointId: pointId,
          measurement: makeMeasurementFromRemove( '10.0', 'DOUBLE')
        }

    $httpBackend.when( 'DELETE', url).respond( reply)
    gbMeasurementValueRest.removeNis( pointId, replyMock, replyMock.success, replyMock.failure)
    $httpBackend.flush()
    expect( replyMock.success).toHaveBeenCalledWith( reply)
    expect( replyMock.failure).not.toHaveBeenCalled()

    replyMock.success.calls.reset()
    replyMock.failure.calls.reset()
    url = '/models/1/points/' + pointId + '/override'
    $httpBackend.when( 'DELETE', url).respond( reply)
    gbMeasurementValueRest.removeOverride( pointId, replyMock, replyMock.success, replyMock.failure)
    $httpBackend.flush()
    expect( replyMock.success).toHaveBeenCalledWith( reply)
    expect( replyMock.failure).not.toHaveBeenCalled()

  }));

  it('on remove failure, should send a DELETE request and call failure notify', inject( function ( gbMeasurementValueRest) {

    var pointId = 'id1',
        url = '/models/1/points/' + pointId + '/nis'

    $httpBackend.when( 'DELETE', url).respond( 403, {})
    gbMeasurementValueRest.removeNis( pointId, replyMock, replyMock.success, replyMock.failure)
    $httpBackend.flush()
    expect( replyMock.success).not.toHaveBeenCalled()
    expect( replyMock.failure).toHaveBeenCalledWith( pointId, {}, 403)

  }));


});
