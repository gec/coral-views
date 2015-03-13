describe('request', function () {

  var authToken = 'some auth token'
  var mock = {
    rootScope:        {
      $broadcast: jasmine.createSpy('$broadcast'),
      $apply:     function(aFunction) { aFunction() }
    }
  }

  function resetAllMockSpies() {
    mock.rootScope.$broadcast.calls.reset()
  }

  //you need to indicate your module in a test
  beforeEach(module('greenbus.views.request'));

  beforeEach(function() {
    resetAllMockSpies()
    module(function($provide) {
      $provide.value('$rootScope', mock.rootScope)
    })

    spyOn(mock.rootScope, '$apply').and.callThrough()
  });


  it('should push request and broadcast on $rootScope', inject(function(request) {
    var pop,
        data = {a: 1, b: 2}

    request.push( 'requestA', data)
    expect(mock.rootScope.$broadcast).toHaveBeenCalledWith('requestA')

    pop = request.pop( 'requestA')
    expect( pop).toEqual( data)

    pop = request.pop( 'requestA')
    expect( pop).toBeUndefined()

  }));

  it('should push request with no data and broadcast on $rootScope', inject(function(request) {
    var pop

    request.push( 'requestA')
    expect(mock.rootScope.$broadcast).toHaveBeenCalledWith('requestA')

    pop = request.pop( 'requestA')
    expect( pop).toEqual( null)

    pop = request.pop( 'requestA')
    expect( pop).toBeUndefined()

  }));

  it('should push multiple requests and broadcast on $rootScope', inject(function(request) {
    var pop,
        data1 = {a: 1, b: 1},
        data2 = {a: 2, b: 2},
        data3 = {a: 3, b: 3}

    request.push( 'requestA', data1)
    expect(mock.rootScope.$broadcast).toHaveBeenCalledWith('requestA')
    request.push( 'requestB', data3)
    expect(mock.rootScope.$broadcast).toHaveBeenCalledWith('requestB')
    request.push( 'requestA', data2)
    expect(mock.rootScope.$broadcast).toHaveBeenCalledWith('requestA')

    pop = request.pop( 'requestA')
    expect( pop).toEqual( data2)
    pop = request.pop( 'requestA')
    expect( pop).toEqual( data1)
    pop = request.pop( 'requestA')
    expect( pop).toBeUndefined()

    pop = request.pop( 'requestB')
    expect( pop).toEqual( data3)
    pop = request.pop( 'requestB')
    expect( pop).toBeUndefined()
    
  }));


});
