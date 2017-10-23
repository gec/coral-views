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

  function findEnumeratedValues(div) {
    var btnGroup = div.children('div.btn-group')
    if( btnGroup.length > 0) {
      var dropDownButton = btnGroup.children('button.dropdown-toggle'),
          list = btnGroup.children('ul'),
          listItems = list.children('li')
      return {
        dropDownButton: dropDownButton,
        list: list,
        listItems: listItems
      }
    } else {
      return undefined
    }
  }

  function findSetpointElements( buttonToolbar) {
    var div, result
    div = angular.element( buttonToolbar[0].children[1])
    result = {
      div: div,
      input: angular.element( div.children( 'input')),
      button: angular.element( div.children( 'button')),
      enumeratedValues: findEnumeratedValues(div)
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
    return elem[0].textContent.trim()
  }

  describe('setpoint', function () {

    beforeEach(inject(function ($rootScope, _$compile_, $sniffer) {

      $compile = _$compile_
      parentScope = $rootScope.$new()

      command = {
        'name': 'PowerHub.ESS.SetReactivePower',
        'id': '4fc433a4-3ab5-4d9c-8eb8-3f0757d771bf',
        'commandType': 'SETPOINT_INT',
        'displayName': 'SetReactivePower',
        'endpoint': 'b43e2e0b-8db1-4eb9-910b-97d64df9dd9f',
        'metadata': {
          'integerLabels': {
            '0': 'zero',
            '1': 'one',
            '2': 'two'
          }
        }
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
      changeSetpointValueTo = function(inputElement, value) {
        inputElement.val(value);
        inputElement.trigger($sniffer.hasEvent('input') ? 'input' : 'change');
        scope.$digest();
      }
    }));


    it('should select/execute enumerated setpoint successfully', inject( function (gbCommandEnums) {
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

      expect( setpoint.buttonIcon).toHaveClass( 'fa')
      expect( setpoint.buttonIcon).toHaveClass( 'fa-sign-in')
      expect( setpoint.buttonIcon).not.toHaveClass( 'fa-spin')


      expect(setpoint.enumeratedValues.listItems.length).toBe(3)
      setpoint.enumeratedValues.dropDownButton.trigger( 'click')
      setpoint.enumeratedValues.listItems.eq(1).children('a').trigger( 'click')
      expect(findText(setpoint.enumeratedValues.dropDownButton)).toEqual('one')
      expect( scope.setpoint.value).toEqual( '1')
      expect( scope.selectedEnumeratedValue.id).toEqual( '1')
      expect( scope.selectedEnumeratedValue.label).toEqual( 'one')

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
          setpoint: {intValue: 1}
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


  })

});
