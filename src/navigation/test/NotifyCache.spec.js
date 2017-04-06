describe('NotifyCache', function () {

  var v1 = {value: 'v1'},
      k1 = 'key1'

  function isReady( node) { return node.loading !== true}

  beforeEach(module('greenbus.views.navigation'));

  beforeEach(function () {
  });

  it('should store and retrieve existing values', inject( function ( navigation, $rootScope) {
    var gotValue,
        cache = navigation.NotifyCache()

    cache.put( k1, v1)
    cache.get( k1).then(
      function( value) {
        gotValue = value
      }
    )
    expect( gotValue).toBeUndefined()

    $rootScope.$apply();
    expect( gotValue).toBe( v1)

  }));

  it('should store values and resolve retrieval promise when available', inject( function ( navigation, $rootScope) {
    var gotValue,
        cache = navigation.NotifyCache()

    cache.get( k1).then(
      function( value) {
        gotValue = value
      }
    )
    expect( gotValue).toBeUndefined()

    $rootScope.$apply();
    expect( gotValue).toBeUndefined()

    cache.put( k1, v1)
    $rootScope.$apply();
    expect( gotValue).toBe( v1)

  }));

  it('should store values and resolve retrieval promise when value isReady', inject( function ( navigation, $rootScope) {
    var gotValue2, gotValue3,
        cache = navigation.NotifyCache(),
        k2 = 'k2',
        k3 = 'k3',
        v2 = {value: 'value2', loading: true}
        v3 = {value: 'value2', loading: false}

    cache.put( k2, v2)
    cache.get( k2, isReady).then(
      function( value) {
        gotValue2 = value
      }
    )
    cache.get( k3, isReady).then(
      function( value) {
        gotValue3 = value
      }
    )
    $rootScope.$apply();
    expect( gotValue2).toBeUndefined()
    expect( gotValue3).toBeUndefined() // not put yet.

    cache.put( k3, v3)
    $rootScope.$apply();
    expect( gotValue2).toBeUndefined() // still loading
    expect( gotValue3).toBe(v3) // what put and not loading

    v2.loading = false
    cache.notify( k2)
    $rootScope.$apply();
    expect( gotValue2).toBe( v2) // loaded
  }));

});
