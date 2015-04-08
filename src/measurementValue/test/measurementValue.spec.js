describe('gb-measurement-value', function () {
  var gbMeasurementValueRest, point, currentMeasurement, element, parentScope, scope, $compile

  beforeEach(module('greenbus.views.measurementValue'));
  beforeEach(module('greenbus.views.template/measurementValue/measurementValue.html'));

  beforeEach(function () {

    gbMeasurementValueRest = {
      override: function( pointId, value, valueType, callee, success, failure) {
        gbMeasurementValueRest.overrideArgs = {
          pointId: pointId,
          value: value,
          valueType: valueType,
          callee: callee,
          success: success,
          failure: failure
        }
      },
      nis: function( pointId, callee, success, failure) {
        gbMeasurementValueRest.nisArgs = {
          pointId: pointId,
          callee: callee,
          success: success,
          failure: failure
        }
      },
      removeOverride: function( pointId, callee, success, failure) {
        gbMeasurementValueRest.removeOverrideArgs = {
          pointId: pointId,
          callee: callee,
          success: success,
          failure: failure
        }
      },
      removeNis: function( pointId, callee, success, failure) {
        gbMeasurementValueRest.removeNisArgs = {
          pointId: pointId,
          callee: callee,
          success: success,
          failure: failure
        }
      }
    }
    
    
    module( function ($provide) {
      $provide.value('gbMeasurementValueRest', gbMeasurementValueRest);
    });

  });

  beforeEach(inject(function ($rootScope, _$compile_) {

    $compile = _$compile_
    parentScope = $rootScope.$new()

    currentMeasurement = {
      'value':        'closed',
      'type':         'STRING',
      'unit':         'status',
      'time':         1417724070142,
      'validity':     'GOOD',
      'shortQuality': 'N',
      'longQuality':  'Good'
    }
    point = {
      'name':      'bkr',
      'id':        'id1',
      'pointType': 'STATUS',
      'types':     ['Imported', 'CustomerBreakerStatus', 'BreakerStatus', 'Point'],
      'unit':      'status',
      'endpoint':  '22',
      currentMeasurement: currentMeasurement
    }
    parentScope.point = point

    element = angular.element( '<gb-measurement-value model="point"></gb-measurement-value>')
    $compile(element)(parentScope)
    // Controller hasn't run.
    parentScope.$digest()
    // Controller has run and all scope variables are available.
    scope = element.isolateScope() || element.scope()
  }));

  afterEach( function() {
  });

  function findInnerSpan() {
    // Skip the error icon and go for index 1.
    return angular.element( element[0].children[1])
  }

  function findInput( innerSpan) {
    return innerSpan.find('input');
  }
  function findText( elem) {
    return elem[0].textContent
  }

  function getButtonsInEditMode( innerSpan) {
    var override, nis, remove
    override = innerSpan.find( 'button.gb-btn-override')
    nis = innerSpan.find( 'button.gb-btn-nis')
    remove = innerSpan.find( 'a')

    override = override.length > 0 ? angular.element( override) : undefined
    nis = nis.length > 0 ? angular.element( nis) : undefined
    remove = remove.length > 0 ? angular.element( remove) : undefined

    return {
      override: override,
      nis: nis,
      remove: remove
    }
  }

  it('should start as view only value', inject( function () {
    var innerSpan = findInnerSpan()
    expect( findText( innerSpan)).toEqual(currentMeasurement.value);
  }))

  it('should switch to edit mode, copy value, and select value', inject( function () {
    var input, innerSpan
    element.trigger( 'click')
    expect( scope.editing).toBeDefined()

    innerSpan = findInnerSpan()
    input = findInput( innerSpan)
    expect( input[0].value).toEqual(currentMeasurement.value);

    expect( input[0].selectionStart).toBe( 0)
    expect( input[0].selectionEnd).toBe( currentMeasurement.value.length)
  }))

  it('from quality Good, edit mode should have Replace and NIS', inject( function () {
    var innerSpan, buttons

    currentMeasurement.shortQuality = ''
    element.trigger( 'click')

    innerSpan = findInnerSpan()
    buttons = getButtonsInEditMode( innerSpan)
    expect( buttons.override).toBeDefined()
    expect( buttons.nis).toBeDefined()
    expect( buttons.remove).toBeUndefined()

    expect( buttons.override).not.toHaveClass('disabled');
    expect( buttons.nis).not.toHaveClass('disabled');
  }))

  it('from quality Replaced, edit mode should have Replace, NIS, and Remove', inject( function () {
    var innerSpan, buttons

    currentMeasurement.shortQuality = 'R'
    element.trigger( 'click')

    innerSpan = findInnerSpan()
    buttons = getButtonsInEditMode( innerSpan)
    expect( buttons.override).toBeDefined()
    expect( buttons.nis).toBeDefined()
    expect( buttons.remove).toBeDefined()

    expect( buttons.override).not.toHaveClass('disabled');
    expect( buttons.nis).not.toHaveClass('disabled');
    expect( buttons.remove).not.toHaveClass('disabled');
  }))

  it('from quality NIS, edit mode should have Replace, NIS, and Remove', inject( function () {
    var innerSpan, buttons

    currentMeasurement.shortQuality = 'N'
    element.trigger( 'click')

    innerSpan = findInnerSpan()
    buttons = getButtonsInEditMode( innerSpan)
    expect( buttons.override).toBeDefined()
    expect( buttons.nis).toBeDefined()
    expect( buttons.remove).toBeDefined()

    expect( buttons.override).not.toHaveClass('disabled');
    expect( buttons.nis).toHaveClass('disabled');
    expect( buttons.remove).not.toHaveClass('disabled');
  }))

  it('replace should be successful', inject( function () {
    var innerSpan, buttons, input

    currentMeasurement.shortQuality = ''
    element.trigger( 'click')
    innerSpan = findInnerSpan()
    buttons = getButtonsInEditMode( innerSpan)


    input = findInput( innerSpan)
    input[0].value = 'newValue'
    scope.$digest()
    buttons.override.trigger( 'click')

    //expect( buttons.override).not.toHaveClass('disabled');
    //expect( buttons.nis).toHaveClass('disabled');
    //expect( buttons.remove).not.toHaveClass('disabled');
  }))

  it('inputOnBlur() should not exit edit mode until it\'s clear a button was not clicked', inject( function ($timeout) {
    var innerSpan, buttons, input

    currentMeasurement.shortQuality = ''
    element.trigger( 'click')

    scope.inputOnBlur()
    expect( scope.editing).toBeDefined()

    $timeout.flush()
    expect( scope.editing).toBeUndefined()

  }))


});
