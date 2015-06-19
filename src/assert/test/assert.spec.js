describe('assert', function () {

  //you need to indicate your module in a test
  beforeEach(module('greenbus.views.assert'));

  it('stringNotEmpty', inject(function(assert) {
    expect( function() { assert.stringNotEmpty('')}).toThrow()
    expect( function() { assert.stringNotEmpty()}).toThrow()
    expect( function() { assert.stringNotEmpty(null)}).toThrow()

    expect( function() { assert.stringNotEmpty('', 'My value')}).toThrow()
    expect( function() { assert.stringNotEmpty(undefined, 'My value')}).toThrow()
    expect( function() { assert.stringNotEmpty(null, 'My value')}).toThrow()

    expect( function() { assert.stringNotEmpty('something')}).not.toThrow()

  }));

  it('stringEmpty', inject(function(assert) {
    expect( function() { assert.stringEmpty('something')}).toThrow()
    expect( function() { assert.stringEmpty()}).toThrow()
    expect( function() { assert.stringEmpty(null)}).toThrow()

    expect( function() { assert.stringEmpty('')}).not.toThrow()

  }));


});
