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


/**
 *
 * @param _point
 * @param _commands
 * @constructor
 */
function CommandSet( _point, _commands, commandRest) {
  // Control & Setpoint States


  this.point = _point
  this.commands = _commands
  this.commandRest = commandRest
  this.state = CommandSet.States.NotSelected
  this.lock = undefined
  this.selectedCommand = undefined
  this.commands.forEach( function( c) {
    c.selectClasses = CommandSet.CommandIcons[ CommandSet.States.NotSelected]
    c.executeClasses = CommandSet.ExecuteIcons[ CommandSet.States.NotSelected]
    c.isSetpoint = c.commandType.indexOf('SETPOINT') === 0
    c.blockClasses = 'fa fa-unlock'
    if( c.isSetpoint) {
      c.setpointValue = undefined

      switch( c.commandType) {
        case 'SETPOINT_INT':
          c.pattern = /^[+-]?\d+$/;
          c.placeHolder = 'int'
          break
        case 'SETPOINT_DOUBLE':
          c.pattern = /^[-+]?\d+(\.\d+)?$/;
          c.placeHolder = 'decimal'
          break
        case 'SETPOINT_STRING':
          c.pattern = undefined;
          c.placeHolder = 'text'
          break
        default:
          break
      }

    }

  })
}

CommandSet.States = {
  NotSelected: 'NotSelected',   // -> Selecting
  Selecting: 'Selecting',       // -> Selected, NotSelected (unauthorized or failure)
  Selected: 'Selected',         // -> Executing, NotSelected, Deselecting (user or timeout)
  Deselecting: 'Deselecting',   // -> Executing, NotSelected (user or timeout)
  Executing: 'Executing'        // -> NotSelected (success or failure)
}

CommandSet.CommandIcons = {
  NotSelected: 'fa fa-chevron-right text-primary',
  Selecting: 'fa fa-chevron-right fa-spin text-primary',
  Selected: 'fa fa-chevron-left text-primary',
  Deselecting: 'fa fa-chevron-left fa-spin text-primary',
  Executing: 'fa fa-chevron-left text-primary'
}
CommandSet.ExecuteIcons = {
  NotSelected: '',
  Selecting: '',
  Selected: 'fa fa-sign-in',
  Deselecting: 'fa fa-sign-in',
  Executing: 'fa fa-refresh fa-spin'
}

/**
 * Called by onClick in template
 * @param command
 */
CommandSet.prototype.selectToggle = function( command) {
  switch( this.state) {
    case CommandSet.States.NotSelected: this.select( command); break;
    case CommandSet.States.Selecting:   break;
    case CommandSet.States.Selected:    this.deselect( command); break;
    case CommandSet.States.Executing:   break;
  }
  this.point.ignoreRowClick = true
}

CommandSet.prototype.setState = function( state, command) {
  console.log( 'setState from ' + this.state + ' to ' + state)
  this.state = state
  if( command) {
    command.selectClasses = CommandSet.CommandIcons[this.state]
    command.executeClasses = CommandSet.ExecuteIcons[this.state]
    console.log( 'setState ' + this.state + ', command.classes ' + command.classes)
  }
}

CommandSet.prototype.select = function( command) {
  var self = this

  if( this.state !== CommandSet.States.NotSelected) {
    console.error( 'CommandSet.select invalid state: ' + this.state)
    return
  }

  self.setState( CommandSet.States.Selecting, command)

  this.commandRest.select( 'ALLOWED', [command.id],
    function( data) {
      self.lock = data
      if( self.lock.expireTime) {
        self.selectedCommand = command
        self.setState( CommandSet.States.Selected, command)

        var delay = self.lock.expireTime - Date.now()
        console.log( 'commandLock delay: ' + delay)
        // It the clock for client vs server is off, we'll use a minimum delay.
        delay = Math.max( delay, 10)
        self.selectTimeout = $timeout(function () {
          delete self.lock;
          delete self.selectTimeout;
          if( self.state === CommandSet.States.Selected || self.state === CommandSet.States.Executing) {
            self.setState( CommandSet.States.NotSelected, self.selectedCommand)
            self.selectedCommand = undefined
          }
        }, delay)
      } else {
        self.deselected()
        self.alertDanger( 'Select failed. ' + data)
      }
    },
    function( ex, statusCode, headers, config) {
      console.log( 'CommandSet.select ' + ex)
      self.alertException( ex)
      self.deselected()
    })
}

CommandSet.prototype.deselected = function() {
  this.setState( CommandSet.States.NotSelected, this.selectedCommand)
  this.selectedCommand = undefined
}


CommandSet.prototype.deselect = function( command) {
  var self = this

  if( this.state !== CommandSet.States.Selected) {
    console.error( 'CommandSet.deselect invalid state: ' + this.state)
    return
  }

  self.setState( CommandSet.States.Deselecting, self.selectedCommand)

  self.commandRest.deselect( self.lock.id,
    function( data) {
      delete self.lock;
      var saveCommand = self.selectedCommand
      self.deselected()
      if( saveCommand !== command) {
        self.select( command)
      }
    },
    function( ex, statusCode, headers, config) {
      console.log( 'CommandSet.deselect ' + ex)
      self.deselected()
      self.alertException( ex)

      var saveCommand = self.selectedCommand
      self.selectedCommand = undefined
      if( saveCommand !== command) {
        self.select( command)
      }
    })
}

function getSetpointInt( value) {
  var n = Number( value)

}
CommandSet.prototype.execute = function( command, commandIndex) {
  var self = this

  if( this.state !== CommandSet.States.Selected) {
    console.error( 'CommandSet.execute invalid state: ' + this.state)
    return
  }

  var args = {
    commandLockId: self.lock.id
  }

  if( command.isSetpoint) {
    if( command.pattern && !command.pattern.test( command.setpointValue)) {
      switch( command.commandType) {
        case 'SETPOINT_INT': self.alertDanger( 'Setpoint needs to be an integer value.'); return;
        case 'SETPOINT_DOUBLE': self.alertDanger( 'Setpoint needs to be a floating point value.'); return;
        default:
          console.error( 'Setpoint has unknown error, "' + command.setpointValue + '" for command type ' + command.commandType);
      }
    }

    switch( command.commandType) {
      case 'SETPOINT_INT':
        args.setpoint = { intValue: Number( command.setpointValue)}
        break
      case 'SETPOINT_DOUBLE':
        args.setpoint = { doubleValue: Number( command.setpointValue)}
        break
      case 'SETPOINT_STRING':
        args.setpoint = { stringValue: command.setpointValue}
        break
      default:
        break
    }
  }

  self.setState( CommandSet.States.Executing, command)


  self.commandRest.execute( command.id,
    function( commandResult) {
      self.alertCommandResult( commandResult)
      self.deselected()
    },
    function( ex, statusCode, headers, config) {
      console.log( 'CommandSet.execute ' + ex)
      self.deselected()
      self.alertException( ex)
    })

  this.point.ignoreRowClick = true
}

CommandSet.prototype.closeAlert = function( index) {
  if( this.alerts)
    this.alerts.splice( index, 1)
  this.point.ignoreRowClick = true
}

CommandSet.prototype.alertCommandResult = function( result) {
  var alert = { message: 'Successful'}
  alert.type = result.status === 'SUCCESS' ? 'success' : 'danger'
  if( result.status !== 'SUCCESS') {
    alert.message = 'ERROR: ' + result.status
    if( result.error)
      alert.message += ',  ' + result.error
  }
  this.alerts = [ alert ]
}

CommandSet.prototype.alertException = function( ex) {
  var alert = {
    type: 'danger',
    message: ex.exception + ': ' + ex.message
  }
  this.alerts = [ alert ]
}
CommandSet.prototype.alertDanger = function( message) {
  var alert = {
    type: 'danger',
    message: message
  }
  this.alerts = [ alert ]
}

CommandSet.prototype.getCommandTypes = function() {
  var control = '',
      setpoint = ''

  this.commands.forEach( function( c) {
    if( control.length === 0 && c.commandType === 'CONTROL') {
      control = 'control'
    } else {
      if( setpoint.length === 0 && c.commandType.indexOf( 'SETPOINT') === 0)
        setpoint = 'setpoint'
    }
  })

  return control && setpoint ? control + ',' + setpoint : control + setpoint
}


