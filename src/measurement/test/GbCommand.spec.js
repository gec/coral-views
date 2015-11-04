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

describe('GbCommand', function() {

  var point, command, commandRestMock,
      timeNow = 10  // returned from Date.now() spy callFake


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
    command = {
      'name': 'PowerHub.ESS.SetReactivePower',
      'id': '4fc433a4-3ab5-4d9c-8eb8-3f0757d771bf',
      'commandType': 'SETPOINT_DOUBLE',
      'displayName': 'SetReactivePower',
      'endpoint': 'b43e2e0b-8db1-4eb9-910b-97d64df9dd9f'
    }


    resetAllMockSpies()

    spyOn(Date, 'now').and.callFake(function() {
      return timeNow;
    })

  });

  it('should initialize constants for icon classes', function() {

    expect( GbCommand.CommandIcons.NotSelected).toEqual( 'fa fa-chevron-right text-primary')
    expect( GbCommand.CommandIcons.Selecting).toEqual( 'fa fa-chevron-right fa-spin text-primary')
    expect( GbCommand.CommandIcons.Selected).toEqual( 'fa fa-chevron-left text-primary')
    expect( GbCommand.CommandIcons.Deselecting).toEqual( 'fa fa-chevron-left fa-spin text-primary')
    expect( GbCommand.CommandIcons.Executing).toEqual( 'fa fa-chevron-left text-primary')

    expect( GbCommand.ExecuteIcons.NotSelected).toEqual( '')
    expect( GbCommand.ExecuteIcons.Selecting).toEqual( '')
    expect( GbCommand.ExecuteIcons.Selected).toEqual( 'fa fa-sign-in')
    expect( GbCommand.ExecuteIcons.Deselecting).toEqual( 'fa fa-sign-in')
    expect( GbCommand.ExecuteIcons.Executing).toEqual( 'fa fa-refresh fa-spin')


  })

  it('should construct new GbCommand', inject( function( $timeout) {
    var c = new GbCommand( command, commandRestMock, $timeout)

    expect( c.timeout).toBe( $timeout)
    expect( c.state).toBe( GbCommand.States.NotSelected)
    expect( c.lock).toBeUndefined()

    expect( c.selectClasses).toBe( GbCommand.CommandIcons[ GbCommand.States.NotSelected])
    expect( c.executeClasses).toBe( GbCommand.ExecuteIcons[ GbCommand.States.NotSelected])

    // first command is a SETPOINT_DOUBLE
    expect( c.isSetpointType).toBeTruthy()
    expect( c.setpointValue).toBeUndefined()
    expect( c.command.commandType).toBe( 'SETPOINT_DOUBLE')
    expect( c.pattern).toEqual( /^[-+]?\d+(\.\d+)?$/)
    expect( c.placeHolder).toBe('decimal')

  }))

  it('should select setpoint successfully and timeout', inject( function( $timeout) {
    // 111 c.selectClasses = GbCommand.CommandIcons[this.state]
    // 112 c.executeClasses = GbCommand.ExecuteIcons[this.state]

    var successCallback, failureCallback, data,
        c = new GbCommand( command, commandRestMock, $timeout)

    c.selectToggle( command)

    expect( c.state).toBe( GbCommand.States.Selecting)
    expect( c.lock).toBeUndefined()
    expect( c.selectClasses).toBe( GbCommand.CommandIcons[ GbCommand.States.Selecting])
    expect( c.executeClasses).toBe( GbCommand.ExecuteIcons[ GbCommand.States.Selecting])


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
    expect( c.state).toBe( GbCommand.States.Selected)
    expect( c.selectTimeout).toBeDefined()

    $timeout.flush()
    expect( c.lock).toBeUndefined()
    expect( c.selectTimeout).toBeUndefined()
    expect( c.state).toBe( GbCommand.States.NotSelected)
    expect( c.selectClasses).toBe( GbCommand.CommandIcons[ GbCommand.States.NotSelected])
    expect( c.executeClasses).toBe( GbCommand.ExecuteIcons[ GbCommand.States.NotSelected])

  }))

  it('should handle select setpoint failure', inject( function( $timeout) {
    // 111 c.selectClasses = GbCommand.CommandIcons[this.state]
    // 112 c.executeClasses = GbCommand.ExecuteIcons[this.state]

    var successCallback, failureCallback, data,
        c = new GbCommand( command, commandRestMock, $timeout)

    c.selectToggle()

    expect( c.state).toBe( GbCommand.States.Selecting)
    expect( c.lock).toBeUndefined()
    expect( c.selectClasses).toBe( GbCommand.CommandIcons[ GbCommand.States.Selecting])
    expect( c.executeClasses).toBe( GbCommand.ExecuteIcons[ GbCommand.States.Selecting])


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
    expect( c.lock).toBeUndefined()
    expect( c.selectTimeout).toBeUndefined()
    expect( c.state).toBe( GbCommand.States.NotSelected)
    expect( c.selectClasses).toBe( GbCommand.CommandIcons[ GbCommand.States.NotSelected])
    expect( c.executeClasses).toBe( GbCommand.ExecuteIcons[ GbCommand.States.NotSelected])

  }))

})

