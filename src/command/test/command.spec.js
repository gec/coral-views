describe('gb-command', function () {
  var gbCommandRest, element, parentScope, scope, $compile, changeInputValueTo, command,
      accessMode = 'ALLOWED',
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


  afterEach( function() {
  });

  function findLabelText() {
    return element[0].children[0].textContent
  }

  function findButtonToolbar() {
    return angular.element( element[0].children[1].children[0])
  }

  function findSelectElements( buttonToolbar) {
    var button = angular.element( buttonToolbar[0].children[0].children[0]),
        icon = findButtonIcon( button)
    return {
      button: button,
      icon: icon
    }
  }

  function findControlElements( buttonToolbar) {
    var button = angular.element( buttonToolbar[0].children[1]),
        buttonIcon = findButtonIcon( button)
    return {
      button: button,
      buttonIcon: buttonIcon
    }
  }

  function findSetpointElements( buttonToolbar) {
    var div, result
    div = angular.element( buttonToolbar[0].children[1])
    result = {
      div: div,
      input: angular.element( div.children( 'input')),
      button: angular.element( div.children( 'button'))
    }
    result.buttonIcon = findButtonIcon( result.button)
    return result // angular.element( buttonToolbar[0].children[1])
  }

  function findErrorIcon( buttonToolbar) {
    return angular.element( buttonToolbar[0].children[2])
  }

  function findButtonIcon( button) {
    return angular.element( button.find('i'))
  }

  function findText( elem) {
    return elem[0].textContent
  }

  describe('setpoint', function () {

    beforeEach(inject(function ($rootScope, _$compile_, $sniffer) {

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

      // See:
      // http://www.scimedsolutions.com/articles/45-testing-an-angularjs-app-using-karma-and-jasmine
      // https://github.com/angular-ui/bootstrap/blob/master/src/typeahead/test/typeahead.spec.js
      changeSetpointValueTo = function(element, value) {
        var inputEl = element // element.find('input');
        //inputEl.triggerHandler('focus')
        inputEl.val(value);
        inputEl.trigger($sniffer.hasEvent('input') ? 'input' : 'change');
        scope.$digest();
        //// TODO: I give up! The model is not being updated during tests.
        //if( scope.setpoint.value !== value)
        //  scope.setpoint.value = value
        //inputEl.triggerHandler('blur')
      }
    }));



    it('should select/execute setpoint successfully', inject( function (gbCommandEnums) {
      var select, successCallback, failureCallback,
          buttonToolbar = findButtonToolbar(),
          setpoint = findSetpointElements( buttonToolbar),
          errorIcon = findErrorIcon( buttonToolbar),
          selectReply = {
            'id': '85',
            'accessMode': accessMode,
            'expireTime': Date.now() + 30 * 1000,
            'commandIds': [command.id]
          },
          executeReply = {
            'status':'SUCCESS',
            'error':''
          }


      // select, setpoint div (hidden), replyError icon (hidden)
      expect( buttonToolbar[0].children.length).toBe( 3)
      expect( setpoint.div).toHaveClass('ng-hide')  // setpoint is hidden

      select = findSelectElements( buttonToolbar)
      expect( select.icon).toHaveClass( 'fa')
      expect( select.icon).toHaveClass( 'fa-chevron-right')
      expect( select.icon).toHaveClass( 'text-primary')
      expect( select.icon).not.toHaveClass( 'fa-spin')
      expect( errorIcon).toHaveClass('ng-hide')


      // click issues select request to server
      select.button.trigger( 'click')
      expect( select.icon).toHaveClass( 'fa')
      expect( select.icon).toHaveClass( 'fa-chevron-right')
      expect( select.icon).toHaveClass( 'text-primary')
      expect( select.icon).toHaveClass( 'fa-spin')       // spinning
      // setpoint is still hidden waiting on select response from server
      expect( setpoint.div).toHaveClass('ng-hide')
      expect( errorIcon).toHaveClass('ng-hide')

      expect( gbCommandRest.select).toHaveBeenCalledWith(
        accessMode,
        [command.id],
        jasmine.any(Function),
        jasmine.any(Function)
      )
      successCallback = gbCommandRest.select.calls.mostRecent().args[2]
      failureCallback = gbCommandRest.select.calls.mostRecent().args[3]

      successCallback( selectReply)
      scope.$digest()
      expect( select.icon).toHaveClass( 'fa')
      expect( select.icon).toHaveClass( 'fa-chevron-left')
      expect( select.icon).toHaveClass( 'text-primary')
      expect( select.icon).not.toHaveClass( 'fa-spin')   // not spinning
      expect( setpoint.div).not.toHaveClass('ng-hide')   // visible
      expect( errorIcon).toHaveClass('ng-hide')

      expect( findText( setpoint.input)).toEqual( '')
      expect( setpoint.buttonIcon).toHaveClass( 'fa')
      expect( setpoint.buttonIcon).toHaveClass( 'fa-sign-in')
      expect( setpoint.buttonIcon).not.toHaveClass( 'fa-spin')

      changeSetpointValueTo( setpoint.input, '1.0')
      expect( scope.setpoint.value).toEqual( '1.0')

      setpoint.button.trigger( 'click')
      expect( setpoint.buttonIcon).toHaveClass( 'fa')
      expect( setpoint.buttonIcon).toHaveClass( 'fa-refresh')
      expect( setpoint.buttonIcon).toHaveClass( 'fa-spin')
      expect( setpoint.div).not.toHaveClass('ng-hide')   // visible
      expect( errorIcon).toHaveClass('ng-hide')
      expect( gbCommandRest.execute).toHaveBeenCalledWith(
        command.id,
        {
          commandLockId: selectReply.id,
          setpoint: {doubleValue: 1.0}
        },
        jasmine.any(Function),
        jasmine.any(Function)
      )
      successCallback = gbCommandRest.execute.calls.mostRecent().args[2]
      failureCallback = gbCommandRest.execute.calls.mostRecent().args[3]

      successCallback( executeReply)
      scope.$digest()

      // Go back to not selected
      expect( select.icon).toHaveClass( 'fa')
      expect( select.icon).toHaveClass( 'fa-chevron-right')
      expect( select.icon).toHaveClass( 'text-primary')
      expect( select.icon).not.toHaveClass( 'fa-spin')
      expect( setpoint.div).toHaveClass('ng-hide')
      expect( errorIcon).toHaveClass('ng-hide')

    }))

    it('should select, then deselect setpoint successfully', inject( function (gbCommandEnums) {
      var select, successCallback, failureCallback,
          buttonToolbar = findButtonToolbar(),
          setpoint = findSetpointElements( buttonToolbar),
          errorIcon = findErrorIcon( buttonToolbar),
          selectReply = {
            'id': '85',
            'accessMode': accessMode,
            'expireTime': Date.now() + 30 * 1000,
            'commandIds': [command.id]
          },
          deselectReply = {
            'id': '93',
            'accessMode': 'ALLOWED',
            'expireTime': 1446769516043,
            'commandIds': ['4fc433a4-3ab5-4d9c-8eb8-3f0757d771bf']
          }


      select = findSelectElements( buttonToolbar)
      // click issues select request to server
      select.button.trigger( 'click')
      successCallback = gbCommandRest.select.calls.mostRecent().args[2]
      failureCallback = gbCommandRest.select.calls.mostRecent().args[3]
      successCallback( selectReply)

      // deselect and go back to not selected
      select.button.trigger( 'click')
      scope.$digest()
      expect( select.icon).toHaveClass( 'fa')
      expect( select.icon).toHaveClass( 'fa-chevron-left')
      expect( select.icon).toHaveClass( 'text-primary')
      expect( select.icon).toHaveClass( 'fa-spin')        // spinning
      expect( setpoint.div).not.toHaveClass('ng-hide')    // visible
      expect( errorIcon).toHaveClass('ng-hide')
      expect( gbCommandRest.deselect).toHaveBeenCalledWith(
        selectReply.id,
        jasmine.any(Function),
        jasmine.any(Function)
      )
      successCallback = gbCommandRest.deselect.calls.mostRecent().args[1]
      failureCallback = gbCommandRest.deselect.calls.mostRecent().args[2]
      successCallback( deselectReply)
      scope.$digest()

      expect( select.icon).toHaveClass( 'fa')
      expect( select.icon).toHaveClass( 'fa-chevron-right')
      expect( select.icon).toHaveClass( 'text-primary')
      expect( select.icon).not.toHaveClass( 'fa-spin')
      expect( setpoint.div).toHaveClass('ng-hide')
      expect( errorIcon).toHaveClass('ng-hide')

    }))

    it('should select setpoint and fail execute', inject( function (gbCommandEnums) {
      var select, successCallback, failureCallback,
          buttonToolbar = findButtonToolbar(),
          setpoint = findSetpointElements( buttonToolbar),
          errorIcon = findErrorIcon( buttonToolbar),
          selectReply = {
            'id': '85',
            'accessMode': accessMode,
            'expireTime': Date.now() + 30 * 1000,
            'commandIds': [command.id]
          },
          executeReply = {
            'exception': 'org.totalgrid.reef.client.exception.ReefServiceException',
            'message': 'Command execute request unknown failure. Response timeout from front end connection.'
          }

      select = findSelectElements( buttonToolbar)
      // click issues select request to server
      select.button.trigger( 'click')
      successCallback = gbCommandRest.select.calls.mostRecent().args[2]
      failureCallback = gbCommandRest.select.calls.mostRecent().args[3]

      successCallback( selectReply)
      scope.$digest()

      changeSetpointValueTo( setpoint.input, '1.0')
      expect( scope.setpoint.value).toEqual( '1.0')

      setpoint.button.trigger( 'click')
      successCallback = gbCommandRest.execute.calls.mostRecent().args[2]
      failureCallback = gbCommandRest.execute.calls.mostRecent().args[3]

      failureCallback( executeReply, 500, {}, {})
      scope.$digest()

      // Go back to not selected
      expect( select.icon).toHaveClass( 'fa')
      expect( select.icon).toHaveClass( 'fa-chevron-right')
      expect( select.icon).toHaveClass( 'text-primary')
      expect( select.icon).not.toHaveClass( 'fa-spin')
      expect( setpoint.div).toHaveClass('ng-hide')

      expect( errorIcon).not.toHaveClass('ng-hide')
      expect( scope.replyError).toEqual( executeReply.message)
    }))

    it('should fail to select setpoint', inject( function (gbCommandEnums) {
      var select, successCallback, failureCallback,
          buttonToolbar = findButtonToolbar(),
          setpoint = findSetpointElements( buttonToolbar),
          errorIcon = findErrorIcon( buttonToolbar),
          selectReply = {
            'exception': 'LockedException',
            'message': 'Commands already locked'
          }

      select = findSelectElements( buttonToolbar)
      // click issues select request to server
      select.button.trigger( 'click')
      successCallback = gbCommandRest.select.calls.mostRecent().args[2]
      failureCallback = gbCommandRest.select.calls.mostRecent().args[3]

      failureCallback( selectReply, 403, {}, {})
      scope.$digest()

      // Go back to not selected
      expect( select.icon).toHaveClass( 'fa')
      expect( select.icon).toHaveClass( 'fa-chevron-right')
      expect( select.icon).toHaveClass( 'text-primary')
      expect( select.icon).not.toHaveClass( 'fa-spin')
      expect( setpoint.div).toHaveClass('ng-hide')

      expect( errorIcon).not.toHaveClass('ng-hide')
      expect( scope.replyError).toEqual( selectReply.message)
    }))

    it('should create setpoint with label', inject( function (gbCommandEnums) {
      var select, setpoint,
          buttonToolbar = findButtonToolbar()

      expect( findLabelText()).toEqual(command.displayName);

      select = findSelectElements( buttonToolbar)
      expect( select.icon).toHaveClass( gbCommandEnums.CommandIcons.NotSelected)

      // select, setpoint div (hidden), replyError icon (hidden)
      expect( buttonToolbar[0].children.length).toBe( 3)
      setpoint = findSetpointElements( buttonToolbar)
      expect( setpoint.div).toHaveClass('ng-hide')  // setpoint is hidden

    }))
  })






  describe('control', function () {

    beforeEach(inject(function ($rootScope, _$compile_, $sniffer) {

      $compile = _$compile_
      parentScope = $rootScope.$new()

      command = {
        'name': 'Microgrid1.breaker',
        'id': '4fc433a4-3ab5-4d9c-8eb8-3f0757d771bf',
        'commandType': 'CONTROL',
        'displayName': 'Open',
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



    it('should select/execute control successfully', inject( function (gbCommandEnums) {
      var select, successCallback, failureCallback,
          buttonToolbar = findButtonToolbar(),
          control = findControlElements( buttonToolbar),
          errorIcon = findErrorIcon( buttonToolbar),
          selectReply = {
            'id': '85',
            'accessMode': accessMode,
            'expireTime': Date.now() + 30 * 1000,
            'commandIds': [command.id]
          },
          executeReply = {
            'status':'SUCCESS',
            'error':''
          }


      // select, control div (hidden), replyError icon (hidden)
      expect( buttonToolbar[0].children.length).toBe( 3)
      expect( control.button).toHaveClass('ng-hide')  // control is hidden

      select = findSelectElements( buttonToolbar)
      expect( select.icon).toHaveClass( 'fa')
      expect( select.icon).toHaveClass( 'fa-chevron-right')
      expect( select.icon).toHaveClass( 'text-primary')
      expect( select.icon).not.toHaveClass( 'fa-spin')
      expect( errorIcon).toHaveClass('ng-hide')


      // click issues select request to server
      select.button.trigger( 'click')
      expect( select.icon).toHaveClass( 'fa')
      expect( select.icon).toHaveClass( 'fa-chevron-right')
      expect( select.icon).toHaveClass( 'text-primary')
      expect( select.icon).toHaveClass( 'fa-spin')       // spinning
      // control is still hidden waiting on select response from server
      expect( control.button).toHaveClass('ng-hide')
      expect( errorIcon).toHaveClass('ng-hide')

      expect( gbCommandRest.select).toHaveBeenCalledWith(
        accessMode,
        [command.id],
        jasmine.any(Function),
        jasmine.any(Function)
      )
      successCallback = gbCommandRest.select.calls.mostRecent().args[2]
      failureCallback = gbCommandRest.select.calls.mostRecent().args[3]

      successCallback( selectReply)
      scope.$digest()
      expect( select.icon).toHaveClass( 'fa')
      expect( select.icon).toHaveClass( 'fa-chevron-left')
      expect( select.icon).toHaveClass( 'text-primary')
      expect( select.icon).not.toHaveClass( 'fa-spin')   // not spinning
      expect( control.button).not.toHaveClass('ng-hide')   // visible
      expect( errorIcon).toHaveClass('ng-hide')

      expect( control.buttonIcon).toHaveClass( 'fa')
      expect( control.buttonIcon).toHaveClass( 'fa-sign-in')
      expect( control.buttonIcon).not.toHaveClass( 'fa-spin')


      control.button.trigger( 'click')
      expect( control.buttonIcon).toHaveClass( 'fa')
      expect( control.buttonIcon).toHaveClass( 'fa-refresh')
      expect( control.buttonIcon).toHaveClass( 'fa-spin')
      expect( control.button).not.toHaveClass('ng-hide')   // visible
      expect( errorIcon).toHaveClass('ng-hide')
      expect( gbCommandRest.execute).toHaveBeenCalledWith(
        command.id,
        {
          commandLockId: selectReply.id
        },
        jasmine.any(Function),
        jasmine.any(Function)
      )
      successCallback = gbCommandRest.execute.calls.mostRecent().args[2]
      failureCallback = gbCommandRest.execute.calls.mostRecent().args[3]

      successCallback( executeReply)
      scope.$digest()

      // Go back to not selected
      expect( select.icon).toHaveClass( 'fa')
      expect( select.icon).toHaveClass( 'fa-chevron-right')
      expect( select.icon).toHaveClass( 'text-primary')
      expect( select.icon).not.toHaveClass( 'fa-spin')
      expect( control.button).toHaveClass('ng-hide')
      expect( errorIcon).toHaveClass('ng-hide')

    }))




    it('should select, then deselect control successfully', inject( function (gbCommandEnums) {
      var select, successCallback, failureCallback,
          buttonToolbar = findButtonToolbar(),
          control = findControlElements( buttonToolbar),
          errorIcon = findErrorIcon( buttonToolbar),
          selectReply = {
            'id': '85',
            'accessMode': accessMode,
            'expireTime': Date.now() + 30 * 1000,
            'commandIds': [command.id]
          },
          deselectReply = {
            'id': '93',
            'accessMode': 'ALLOWED',
            'expireTime': 1446769516043,
            'commandIds': ['4fc433a4-3ab5-4d9c-8eb8-3f0757d771bf']
          }


      select = findSelectElements( buttonToolbar)
      // click issues select request to server
      select.button.trigger( 'click')
      successCallback = gbCommandRest.select.calls.mostRecent().args[2]
      failureCallback = gbCommandRest.select.calls.mostRecent().args[3]
      successCallback( selectReply)

      // deselect and go back to not selected
      select.button.trigger( 'click')
      scope.$digest()
      expect( select.icon).toHaveClass( 'fa')
      expect( select.icon).toHaveClass( 'fa-chevron-left')
      expect( select.icon).toHaveClass( 'text-primary')
      expect( select.icon).toHaveClass( 'fa-spin')        // spinning
      expect( control.button).not.toHaveClass('ng-hide')    // visible
      expect( errorIcon).toHaveClass('ng-hide')
      expect( gbCommandRest.deselect).toHaveBeenCalledWith(
        selectReply.id,
        jasmine.any(Function),
        jasmine.any(Function)
      )
      successCallback = gbCommandRest.deselect.calls.mostRecent().args[1]
      failureCallback = gbCommandRest.deselect.calls.mostRecent().args[2]
      successCallback( deselectReply)
      scope.$digest()

      expect( select.icon).toHaveClass( 'fa')
      expect( select.icon).toHaveClass( 'fa-chevron-right')
      expect( select.icon).toHaveClass( 'text-primary')
      expect( select.icon).not.toHaveClass( 'fa-spin')
      expect( control.button).toHaveClass('ng-hide')
      expect( errorIcon).toHaveClass('ng-hide')

    }))

    it('should select control and fail execute', inject( function (gbCommandEnums) {
      var select, successCallback, failureCallback,
          buttonToolbar = findButtonToolbar(),
          control = findControlElements( buttonToolbar),
          errorIcon = findErrorIcon( buttonToolbar),
          selectReply = {
            'id': '85',
            'accessMode': accessMode,
            'expireTime': Date.now() + 30 * 1000,
            'commandIds': [command.id]
          },
          executeReply = {
            'exception': 'org.totalgrid.reef.client.exception.ReefServiceException',
            'message': 'Command execute request unknown failure. Response timeout from front end connection.'
          }

      select = findSelectElements( buttonToolbar)
      // click issues select request to server
      select.button.trigger( 'click')
      successCallback = gbCommandRest.select.calls.mostRecent().args[2]
      failureCallback = gbCommandRest.select.calls.mostRecent().args[3]

      successCallback( selectReply)
      scope.$digest()

      control.button.trigger( 'click')
      successCallback = gbCommandRest.execute.calls.mostRecent().args[2]
      failureCallback = gbCommandRest.execute.calls.mostRecent().args[3]

      failureCallback( executeReply, 500, {}, {})
      scope.$digest()

      // Go back to not selected
      expect( select.icon).toHaveClass( 'fa')
      expect( select.icon).toHaveClass( 'fa-chevron-right')
      expect( select.icon).toHaveClass( 'text-primary')
      expect( select.icon).not.toHaveClass( 'fa-spin')
      expect( control.button).toHaveClass('ng-hide')

      expect( errorIcon).not.toHaveClass('ng-hide')
      expect( scope.replyError).toEqual( executeReply.message)
    }))

    it('should fail to select control', inject( function (gbCommandEnums) {
      var select, successCallback, failureCallback,
          buttonToolbar = findButtonToolbar(),
          control = findControlElements( buttonToolbar),
          errorIcon = findErrorIcon( buttonToolbar),
          selectReply = {
            'exception': 'LockedException',
            'message': 'Commands already locked'
          }

      select = findSelectElements( buttonToolbar)
      // click issues select request to server
      select.button.trigger( 'click')
      successCallback = gbCommandRest.select.calls.mostRecent().args[2]
      failureCallback = gbCommandRest.select.calls.mostRecent().args[3]

      failureCallback( selectReply, 403, {}, {})
      scope.$digest()

      // Go back to not selected
      expect( select.icon).toHaveClass( 'fa')
      expect( select.icon).toHaveClass( 'fa-chevron-right')
      expect( select.icon).toHaveClass( 'text-primary')
      expect( select.icon).not.toHaveClass( 'fa-spin')
      expect( control.button).toHaveClass('ng-hide')

      expect( errorIcon).not.toHaveClass('ng-hide')
      expect( scope.replyError).toEqual( selectReply.message)
    }))

    it('should create control with label', inject( function (gbCommandEnums) {
      var select, control,
          buttonToolbar = findButtonToolbar()

      expect( findLabelText()).toEqual(command.displayName);

      select = findSelectElements( buttonToolbar)
      expect( select.icon).toHaveClass( gbCommandEnums.CommandIcons.NotSelected)

      // select, control div (hidden), replyError icon (hidden)
      expect( buttonToolbar[0].children.length).toBe( 3)
      control = findControlElements( buttonToolbar)
      expect( control.button).toHaveClass('ng-hide')  // control is hidden

    }))
  })



});
