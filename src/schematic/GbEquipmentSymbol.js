/**
 * Copyright 2014-2017 Green Energy Corp.
 *
 * Licensed to Green Energy Corp (www.greenenergycorp.com) under one or more
 * contributor license agreements. See the NOTICE file distributed with this
 * work for additional information regarding copyright ownership. Green Energy
 * Corp licenses this file to you under the Apache License, Version 2.0 (the
 * 'License'); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 * Author: Flint O'Brien
 */

/**
 * @typedef {Object} BoundEquipment
 * @property {number} index The index in the symbol.equipment array
 * @property {string} pointName The principal point name for this symbol. Shows the symbol's state based on measurement status.
 * @property {string[]} controlNames control names from symbol
 * @property {string[]} stateNames state names from symbol
 */


/**
 * GbEquipmentSymbol
 * @param pointName
 * @param symbol Bindings found when parsing SVG
 * @param States
 * @param $timeout
 * @param postAlert
 * @constructor
 */
function gbEquipmentSymbol(pointName, symbol, States, $timeout, postAlert) {
  // Exports will be on $scope in the parent controller.
  var exports = {
    pointName: pointName,
    classes: ''
  }
  var selectTimer, lock, commands,
      state = States.NotSelected
  
  exports.setCommands = function( _commands) {
    commands = _commands
    // TODO: check these commands from GreenBus against the symbol.controlNames found in SVG.
  }

  exports.selectToggle = function( controlName, selectClass, deselectClass) {
    switch( state) {
      case States.NotSelected: select(controlName, selectClass, deselectClass); break;
      case States.Selecting:   break;
      case States.Selected:    deselect(controlName, deselectClass); break;
      case States.Deselecting: break;
      case States.Executing:   break;
    }
  }

  exports.controlExecute = function( controlName) {
    if( state !== States.Selected) {
      console.error( 'gbEquipmentSymbol.controlExecute invalid state: ' + state)
      return
    }
    var command = findCommand(controlName)
    if( ! command) {
      var message = 'Can\'t find command: \'' + controlName + '\' to execute'
      postAlert({ type: 'danger', message: message})
      return
    }

    var args = {
      commandLockId: lock.id
    }

    state = States.Executing
    gbCommandRest.execute(command.id, args,
      function (commandResult) {
        cancelSelectTimer()
        alertCommandResult(commandResult)
        state = States.NotSelected
      },
      function (ex, statusCode, headers, config) {
        console.log('gbEquipmentSymbol.controlExecute ' + JSON.stringify(ex))
        cancelSelectTimer()
        state = States.NotSelected
        alertException(ex, statusCode)
      })
  }

  exports.destroy = function() {
    cancelSelectTimer()
  }



  function cancelSelectTimer() {
    if( selectTimer) {
      $timeout.cancel( selectTimer)
      selectTimer = undefined
    }
  }

  function findCommand(controlName) {
    if( !commands) {
      console.error( 'gbEquipmentSymbol.findCommand: no commands loaded yet')
      return undefined
    }

    var command,
        n = commands.length,
        name = controlName.toLowerCase()
    while(--n >= 0) {
      command = commands[n]
      if( command.name.toLowerCase() === name)
        return command
    }
    console.error( 'gbEquipmentSymbol.findCommand: no command with name "' + controlName + '" found for symbol with pointName ' + pointName)
    return undefined
  }


  function select( controlName, selectClass, deselectClass) {
    if( selectTimer)
      return
    state = States.Selecting
    exports.classes = selectClass

    var command = findCommand(controlName)
    gbCommandRest.select( 'ALLOWED', [command.id],
      function( data) {
        lock = data
        if( lock.expireTime) {
          state = States.Selected

          var delay = lock.expireTime - Date.now()
          console.log( 'commandLock delay: ' + delay)
          // It the clock for client vs server is off, we'll use a minimum delay.
          delay = Math.max( delay, 10)
          selectTimer = $timeout(function () {
            lock = undefined
            selectTimer = undefined
            if( state === States.Selected || state === States.Deselecting || state === States.Executing) {
              state = States.NotSelected
              exports.classes = deselectClass
            }
          }, delay)
        } else {
          lock = undefined
          state = States.NotSelected
          alertDanger( 'Select failed. ' + data)
        }
      },
      function( ex, statusCode, headers, config) {
        console.log( 'gbEquipmentSymbol.select ' + JSON.stringify( ex))
        alertException( ex, statusCode)
        state = States.NotSelected
      })
  }

  function deselect( controlName, deselectClass) {
    exports.classes = deselectClass
    lock = undefined
    if( !selectTimer)
      return
    $timeout.cancel( selectTimer)
    selectTimer = undefined
    state = States.NotSelected
  }


  function alertCommandResult( result) {
    console.log( 'gbEquipmentSymbol.alertCommandResult: result.status "' + result.status + '"')
    if( result.status !== 'SUCCESS') {
      console.log( 'gbEquipmentSymbol.alertCommandResult: result.error "' + result.error + '"')
      var message = result.status
      if( result.error)
        message += ':  ' + result.error
      postAlert({ type: 'danger', message: message})
    }
  }

  function getMessageFromException( ex) {
    if( ! ex)
      return undefined
    var message = ex.message
    if( message === undefined || message === '')
      message = ex.exception
    return message
  }

  function alertException( ex, statusCode) {
    console.log( 'gbEquipmentSymbol.alertException statusCode: ' + statusCode + ', exception: ' + JSON.stringify( ex))
    var message = getMessageFromException( ex)
    postAlert({ type: 'danger', message: message})
  }

  function alertDanger( message) {
    console.log( 'alertDanger message: ' + JSON.stringify( message))
    postAlert({ type: 'danger', message: message})
  }

  return exports
}


