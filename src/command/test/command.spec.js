describe('gb-command', function () {
  var gbCommandRest, element, parentScope, scope, $compile, command,
      timeNow = 10  // returned from Date.now() spy callFake

  beforeEach(module('greenbus.views.command'));
  beforeEach(module('greenbus.views.template/command/command.html'));

  beforeEach(function () {

    gbCommandRest = {
      select:   jasmine.createSpy('select'),   // function(accessMode, commandIds, success, failure)
      deselect: jasmine.createSpy('deselect'), // function(lockId, success, failure)
      execute:  jasmine.createSpy('execute')   // function(commandId, args, success, failure)
    }

    module( function ($provide) {
      $provide.value('gbCommandRest', gbCommandRest);
    });

    spyOn(Date, 'now').and.callFake(function() {
      return timeNow;
    })

  });

  beforeEach(inject(function ($rootScope, _$compile_) {

    $compile = _$compile_
    parentScope = $rootScope.$new()

    command = {
      'name': 'PowerHub.ESS.SetReactivePower',
      'id': '4fc433a4-3ab5-4d9c-8eb8-3f0757d771bf',
      'commandType': 'SETPOINT_DOUBLE',
      'displayName': 'SetReactivePower',
      'endpoint': 'b43e2e0b-8db1-4eb9-910b-97d64df9dd9f'
    }
    parentScope.command = command

    element = angular.element( '<gb-command model="command"></gb-command>')
    $compile(element)(parentScope)
    // Controller hasn't run.
    parentScope.$digest()
    // Controller has run and all scope variables are available.
    scope = element.isolateScope() || element.scope()
  }));

  afterEach( function() {
  });

  function findLabelText() {
    return element[0].children[0].textContent
  }

  function findButtonToolbar() {
    return angular.element( element[0].children[1].children[0])
  }

  function findSelectButton( buttonToolbar) {
    return angular.element( buttonToolbar[0].children[0].children[0])
  }

  function findExecuteButton( buttonToolbar) {
    return angular.element( buttonToolbar[0].children[1])
  }

  function findSetpointInput( buttonToolbar) {
    return angular.element( buttonToolbar[0].children[1].children[0])
  }

  function findSetpointButton( buttonToolbar) {
    return angular.element( buttonToolbar[0].children[1].children[1])
  }

  function findButtonIcon( button) {
    return angular.element( button[0].children[0])
  }

  function findText( elem) {
    return elem[0].textContent
  }

  it('should create setpoint', inject( function (gbCommandEnums) {
    var selectButton, icon,
        buttonToolbar = findButtonToolbar()

    expect( findLabelText()).toEqual(command.displayName);

    selectButton = findSelectButton( buttonToolbar)
    icon = findButtonIcon( selectButton)
    expect( icon).toHaveClass( gbCommandEnums.CommandIcons.NotSelected)
  }))

  it('should create setpoint', inject( function (gbCommandEnums) {
    var selectButton, icon,
        buttonToolbar = findButtonToolbar()

    expect( findLabelText()).toEqual(command.displayName);

    selectButton = findSelectButton( buttonToolbar)
    icon = findButtonIcon( selectButton)
    expect( icon).toHaveClass( gbCommandEnums.CommandIcons.NotSelected)

    // select, setpoint-hidden, error-icon
    expect( buttonToolbar[0].children.length).toBe( 3)

  }))

  it('should select setpoint', inject( function (gbCommandEnums) {
    var selectButton, input, execute,
        buttonToolbar = findButtonToolbar()

    // select, setpoint-hidden, error-icon
    expect( buttonToolbar[0].children.length).toBe( 3)

    selectButton = findSelectButton( buttonToolbar)
    // setpoint is hidden
    expect( buttonToolbar[0].children[1].style.opacity).toEqual('0')
    selectButton.trigger( 'click')
    expect( buttonToolbar[0].children.length).toBe( 3)

    // setpoint is still hidden waiting on select response from server
    expect( buttonToolbar[0].children[1].style.opacity).toEqual('0')

    
    input = findSetpointInput( buttonToolbar)
    expect( findText( input)).toEqual( '')
    execute = findSetpointButton( buttonToolbar)  // chilren: span, i


  }))


});
