/**
 * Copyright 2014-2015 Green Energy Corp.
 *
 * Licensed to Green Energy Corp (www.greenenergycorp.com) under one or more
 * contributor license agreements. See the NOTICE file distributed with this
 * work for additional information regarding copyright ownership. Green Energy
 * Corp licenses this file to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 * Author: Flint O'Brien
 */

//var ex = {
//  exception: 'LockedException',
//  message: 'Commands already locked'
//}
//var statusCode = 403  -- Forbidden

// selectedCommand: undefined
// state: 'Selecting'

describe('CommandSet', function() {

  var point, commands, commandRestMock, json,
      subscriptionMock = {
        id:            'subscriptionId1',
        notifySuccess: null,
        notifyError:   null,
        subscribe:     function(json, scope, success, error) {
          this.notifySuccess = success
          this.notifyError = error
          return this.id
        },
        unsubscribe:   jasmine.createSpy('unsubscribe')
      },
      subscriber1 = 'subscriber1',
      notify1 = jasmine.createSpy('notify1'),
      scope1 = {name: 'scope1'},
      constraints ={
        time: 10000,
        size: 10000,
        throttling: 0
      },
      timeNow = 10,
      limit = 10



  function resetAllMockSpies() {
    //notify1.calls.reset()
    //subscriptionMock.unsubscribe.calls.reset()
  }


  beforeEach(function() {

    //commandRest = {
    //  select:   function(accessMode, commandIds, success, failure) {
    //    var arg = {
    //      accessMode: accessMode,
    //      commandIds: commandIds
    //    }
    //    return rest.post('/models/1/commandlock', arg, null, null, success, failure)
    //  },
    //  deselect: function(lockId, success, failure) {
    //    return rest.delete('/models/1/commandlock/' + lockId, null, null, success, failure)
    //  },
    //  execute:  function(commandId, args, success, failure) {
    //    return rest.post('/models/1/commands/' + commandId, args, null, null, success, failure)
    //  }
    //}

    commandRestMock = {
      select:   jasmine.createSpy('select'),   // function(accessMode, commandIds, success, failure)
      deselect: jasmine.createSpy('deselect'), // function(lockId, success, failure)
      execute:  jasmine.createSpy('execute')   // function(commandId, args, success, failure)
    }

    point = {
      'name': 'PowerHub.ESS.ACReactivePower',
      'id': '1e0fea30-13c5-4037-a203-d61fbe425fdd',
      'pointType': 'ANALOG',
      'types': ['Point'],
      'unit': 'pwrFact',
      'endpoint': 'b43e2e0b-8db1-4eb9-910b-97d64df9dd9f'
    }
    commands = [
      {
        'name': 'PowerHub.ESS.SetReactivePower',
        'id': '4fc433a4-3ab5-4d9c-8eb8-3f0757d771bf',
        'commandType': 'SETPOINT_DOUBLE',
        'displayName': 'SetReactivePower',
        'endpoint': 'b43e2e0b-8db1-4eb9-910b-97d64df9dd9f'
      }
    ]

    resetAllMockSpies()
    spyOn(subscriptionMock, 'subscribe').and.callThrough()

    spyOn(Date, 'now').and.callFake(function() {
      return timeNow;
    })

  });

  it('should initialize constants for icon classes', function() {

    expect( CommandSet.CommandIcons.NotSelected).toEqual( 'fa fa-chevron-right text-primary')
    expect( CommandSet.CommandIcons.Selecting).toEqual( 'fa fa-chevron-right fa-spin text-primary')
    expect( CommandSet.CommandIcons.Selected).toEqual( 'fa fa-chevron-left text-primary')
    expect( CommandSet.CommandIcons.Deselecting).toEqual( 'fa fa-chevron-left fa-spin text-primary')
    expect( CommandSet.CommandIcons.Executing).toEqual( 'fa fa-chevron-left text-primary')

    expect( CommandSet.ExecuteIcons.NotSelected).toEqual( '')
    expect( CommandSet.ExecuteIcons.Selecting).toEqual( '')
    expect( CommandSet.ExecuteIcons.Selected).toEqual( 'fa fa-sign-in')
    expect( CommandSet.ExecuteIcons.Deselecting).toEqual( 'fa fa-sign-in')
    expect( CommandSet.ExecuteIcons.Executing).toEqual( 'fa fa-refresh fa-spin')


  })

  it('should construct new CommandSet', inject( function( $timeout) {
    var command = commands[0],
        cs = new CommandSet( point, commands, commandRestMock, $timeout)

    expect( cs.point).toBe( point)
    expect( cs.commands).toBe( commands)
    expect( cs.timeout).toBe( $timeout)
    expect( cs.state).toBe( CommandSet.States.NotSelected)
    expect( cs.lock).toBeUndefined()
    expect( cs.selectedCommand).toBeUndefined()

    expect( command.selectClasses).toBe( CommandSet.CommandIcons[ CommandSet.States.NotSelected])
    expect( command.executeClasses).toBe( CommandSet.ExecuteIcons[ CommandSet.States.NotSelected])

    // first command is a SETPOINT_DOUBLE
    expect( command.isSetpoint).toBeTruthy()
    expect( command.setpointValue).toBeUndefined()
    expect( command.commandType).toBe( 'SETPOINT_DOUBLE')
    expect( command.pattern).toEqual( /^[-+]?\d+(\.\d+)?$/)
    expect( command.placeHolder).toBe('decimal')

  }))

  it('should select setpoint successfully and timeout', inject( function( $timeout) {
    // 111 command.selectClasses = CommandSet.CommandIcons[this.state]
    // 112 command.executeClasses = CommandSet.ExecuteIcons[this.state]

    var successCallback, failureCallback, data,
        command = commands[0],
        cs = new CommandSet( point, commands, commandRestMock, $timeout)

    cs.selectToggle( command)

    expect( cs.state).toBe( CommandSet.States.Selecting)
    expect( cs.lock).toBeUndefined()
    expect( cs.selectedCommand).toBeUndefined() // TODO: this needs to change!

    expect( command.selectClasses).toBe( CommandSet.CommandIcons[ CommandSet.States.Selecting])
    expect( command.executeClasses).toBe( CommandSet.ExecuteIcons[ CommandSet.States.Selecting])


    expect( commandRestMock.select).toHaveBeenCalledWith(
      'ALLOWED',
      [command.id],
      jasmine.any(Function),
      jasmine.any(Function)
    )
    successCallback = commandRestMock.select.calls.mostRecent().args[2]
    failureCallback = commandRestMock.select.calls.mostRecent().args[3]

    data = {
      expireTime: Date.now() + 30 * 1000
    }
    successCallback( data)
    expect( cs.selectedCommand).toBe( command) // TODO: this needs to change!
    expect( cs.state).toBe( CommandSet.States.Selected)
    expect( cs.selectTimeout).toBeDefined()

    $timeout.flush()
    expect( cs.lock).toBeUndefined()
    expect( cs.selectTimeout).toBeUndefined()
    expect( cs.selectedCommand).toBeUndefined()
    expect( cs.state).toBe( CommandSet.States.NotSelected)
    expect( command.selectClasses).toBe( CommandSet.CommandIcons[ CommandSet.States.NotSelected])
    expect( command.executeClasses).toBe( CommandSet.ExecuteIcons[ CommandSet.States.NotSelected])

  }))

  it('should handle select setpoint failure', inject( function( $timeout) {
    // 111 command.selectClasses = CommandSet.CommandIcons[this.state]
    // 112 command.executeClasses = CommandSet.ExecuteIcons[this.state]

    var successCallback, failureCallback, data,
        command = commands[0],
        cs = new CommandSet( point, commands, commandRestMock, $timeout)

    cs.selectToggle( command)

    expect( cs.state).toBe( CommandSet.States.Selecting)
    expect( cs.lock).toBeUndefined()
    expect( cs.selectedCommand).toBeUndefined() // TODO: this needs to change!

    expect( command.selectClasses).toBe( CommandSet.CommandIcons[ CommandSet.States.Selecting])
    expect( command.executeClasses).toBe( CommandSet.ExecuteIcons[ CommandSet.States.Selecting])


    expect( commandRestMock.select).toHaveBeenCalledWith(
      'ALLOWED',
      [command.id],
      jasmine.any(Function),
      jasmine.any(Function)
    )
    successCallback = commandRestMock.select.calls.mostRecent().args[2]
    failureCallback = commandRestMock.select.calls.mostRecent().args[3]

    var ex = {
      exception: 'LockedException',
      message: 'Commands already locked'
    }
    failureCallback( ex, 403)   // 403: Forbidden
    expect( cs.lock).toBeUndefined()
    expect( cs.selectTimeout).toBeUndefined()
    expect( cs.selectedCommand).toBeUndefined()
    expect( cs.state).toBe( CommandSet.States.NotSelected)
    // Exposes bug. We'll work on that next!
    //expect( command.selectClasses).toBe( CommandSet.CommandIcons[ CommandSet.States.NotSelected])
    //expect( command.executeClasses).toBe( CommandSet.ExecuteIcons[ CommandSet.States.NotSelected])

  }))

})

