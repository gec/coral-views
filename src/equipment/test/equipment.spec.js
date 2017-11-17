describe('equipment', function () {
  var $httpBackend

  var microgridId = 'aa2b27a1-87d4-4c6b-b964-47902fc475b6',
      microgrid = {
        'entity':      {
          'name':  'Zone1',
          'id':    microgridId,
          'types': ['EquipmentGroup', 'Equipment', 'MicroGrid', 'Zone1']
        },
        'children': []
      },
      resources = [
        { 'name': 'Zone1.Load3', 'id': '3736147d-ea52-45aa-989e-4c4c67247634', 'types': ['Equipment', 'Load', 'Zone1']},
        { 'name': 'Zone1.Load2', 'id': 'b979d52f-3230-4663-835e-9844045ab279', 'types': ['Equipment', 'Load', 'Zone1']},
        { 'name': 'Zone1.Load1', 'id': 'e95b4c77-e7bc-4e09-b232-40d0d17681ec', 'types': ['Equipment', 'Load', 'Zone1']}
      ],
      resourcePoints = {
        '3736147d-ea52-45aa-989e-4c4c67247634': [{ 'name': 'Zone1.Load3.kW', 'id': '4b5aed52-86b5-4175-8a90-f595f1d60b4c', 'pointType': 'ANALOG', 'types': ['Point', 'LoadPower', 'FreqControl'], 'unit': 'kW', 'endpoint':  'a97e0861-0362-4526-b05c-e1e16f4c4d56'}],
        'e95b4c77-e7bc-4e09-b232-40d0d17681ec': [{ 'name': 'Zone1.Load1.kW', 'id': '238daeff-d411-44b6-b3a7-e199ef4a62ac', 'pointType': 'ANALOG', 'types': ['Point', 'LoadPower', 'FreqControl'], 'unit': 'kW', 'endpoint':  'a97e0861-0362-4526-b05c-e1e16f4c4d56'}],
        'b979d52f-3230-4663-835e-9844045ab279': [{ 'name': 'Zone1.Load2.kW', 'id': '0c1702b7-3770-4e11-970d-9f209ac69252', 'pointType': 'ANALOG', 'types': ['Point', 'LoadPower', 'FreqControl'], 'unit': 'kW', 'endpoint':  'a97e0861-0362-4526-b05c-e1e16f4c4d56'}]
      },
      resourceIds = resources.map( function( r) { return r.id}),
      equipmentIdsQueryString = queryParameterFromArrayOrString( 'equipmentIds', resourceIds),
      pointTypesQueryString = queryParameterFromArrayOrString( 'pointTypes', 'LoadPower')

  function queryParameterFromArrayOrString(parameter, arrayOrString) {
    var parameterEqual = parameter + '='
    var query = ''
    if( angular.isArray(arrayOrString) ) {
      arrayOrString.forEach(function(value, index) {
        if( index === 0 )
          query = parameterEqual + value
        else
          query = query + '&' + parameterEqual + value
      })
    } else {
      if( arrayOrString && arrayOrString.length > 0 )
        query = parameterEqual + arrayOrString
    }
    return query
  }

  var authToken = 'some auth token'
  var mocks = {
    authentication: {
      isLoggedIn:   function() { return true },
      getAuthToken: function() { return authToken },
      getHttpHeaders: function() { return {'Authorization': authToken} }
    }
  }


  beforeEach(module('greenbus.views.authentication'));
  beforeEach(module('greenbus.views.rest'));
  beforeEach(module('greenbus.views.equipment'));

  beforeEach(function () {

    mocks.reply = jasmine.createSpyObj('mocks.reply', ['success', 'failure'])

    module( function ($provide) {
      $provide.value('authentication', mocks.authentication);
    });


  });

  beforeEach( inject(function( $injector) {
    $httpBackend = $injector.get('$httpBackend')
  }))

  afterEach( function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });


  it('on getEquipmentsWithTypesAnd success, should send a GET request and call successful notify', inject( function ( equipment) {
    var result

    $httpBackend.whenGET( '/models/1/equipment/' + microgridId + '/descendants?depth=0&childTypes=Load').respond(resources)
    result = equipment.getEquipmentsWithTypesAnd( microgridId, [equipment.ET.LOAD], mocks.reply, mocks.reply.success, mocks.reply.failure)
    $httpBackend.flush()
    expect( result).toBeTruthy()
    expect( mocks.reply.success).toHaveBeenCalledWith( resources)
    expect( mocks.reply.failure).not.toHaveBeenCalled()

  }));

  it('on getEquipmentsWithTypesAnd request failure, should send a GET request and call failure notify', inject( function ( equipment) {
    var result

    $httpBackend.whenGET( '/models/1/equipment/' + microgridId + '/descendants?depth=0&childTypes=Load').respond(403, {})
    result = equipment.getEquipmentsWithTypesAnd( microgridId, [equipment.ET.LOAD], mocks.reply, mocks.reply.success, mocks.reply.failure)
    $httpBackend.flush()
    expect( result).toBeTruthy()
    expect( mocks.reply.success).not.toHaveBeenCalled()
    expect( mocks.reply.failure).toHaveBeenCalledWith({}, 403)

  }));

  it('on getEquipmentsWithTypesAnd invalid microgridId, should not send request, not call success or failure, and return false', inject( function ( equipment) {
    var result

    result = equipment.getEquipmentsWithTypesAnd( undefined, [equipment.ET.LOAD], mocks.reply, mocks.reply.success, mocks.reply.failure)
    $httpBackend.verifyNoOutstandingRequest();
    expect( result).toBeFalsy()
    expect( mocks.reply.success).not.toHaveBeenCalled()
    expect( mocks.reply.failure).not.toHaveBeenCalled()

    result = equipment.getEquipmentsWithTypesAnd( '', [equipment.ET.LOAD], mocks.reply, mocks.reply.success, mocks.reply.failure)
    $httpBackend.verifyNoOutstandingRequest();
    expect( result).toBeFalsy()
    expect( mocks.reply.success).not.toHaveBeenCalled()
    expect( mocks.reply.failure).not.toHaveBeenCalled()

  }));

  it('on getEquipmentPointsMapFromEquipmentsAndPointTypes success, should send a GET request and call successful notify', inject( function ( equipment) {
    var result

    $httpBackend.whenGET( '/models/1/points?' + equipmentIdsQueryString + '&' + pointTypesQueryString).respond( resourcePoints)
    result = equipment.getEquipmentPointsMapFromEquipmentsAndPointTypes( resources, [equipment.PT.LOAD], mocks.reply, mocks.reply.success, mocks.reply.failure)
    $httpBackend.flush()
    expect( result).toBeTruthy()
    expect( mocks.reply.success).toHaveBeenCalledWith( resourcePoints)
    expect( mocks.reply.failure).not.toHaveBeenCalled()

  }));

  it('on getEquipmentPointsMapFromEquipmentsAndPointTypes failure, should send a GET request and call failure notify', inject( function ( equipment) {
    var result

    $httpBackend.whenGET( '/models/1/points?' + equipmentIdsQueryString + '&' + pointTypesQueryString).respond( 403, {})
    result = equipment.getEquipmentPointsMapFromEquipmentsAndPointTypes( resources, [equipment.PT.LOAD], mocks.reply, mocks.reply.success, mocks.reply.failure)
    $httpBackend.flush()
    expect( result).toBeTruthy()
    expect( mocks.reply.success).not.toHaveBeenCalled()
    expect( mocks.reply.failure).toHaveBeenCalledWith({}, 403)

  }));

  it('on getEquipmentPointsMapFromEquipmentsAndPointTypes invalid resources array, should not send request, not call success or failure, and return false', inject( function ( equipment) {
    var result

    result = equipment.getEquipmentPointsMapFromEquipmentsAndPointTypes( undefined, [equipment.PT.LOAD], mocks.reply, mocks.reply.success, mocks.reply.failure)
    $httpBackend.verifyNoOutstandingRequest();
    expect( result).toBeFalsy()
    expect( mocks.reply.success).not.toHaveBeenCalled()
    expect( mocks.reply.failure).not.toHaveBeenCalled()

    result = equipment.getEquipmentPointsMapFromEquipmentsAndPointTypes( [], [equipment.PT.LOAD], mocks.reply, mocks.reply.success, mocks.reply.failure)
    $httpBackend.verifyNoOutstandingRequest();
    expect( result).toBeFalsy()
    expect( mocks.reply.success).not.toHaveBeenCalled()
    expect( mocks.reply.failure).not.toHaveBeenCalled()

  }));

});

