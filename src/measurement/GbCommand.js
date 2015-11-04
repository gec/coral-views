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
function GbCommand( command, commandRest, $timeout) {

  this.command = command
  this.commandRest = commandRest
  this.timeout = $timeout
  this.state = GbCommand.States.NotSelected
  this.lock = undefined
  this.alerts = []

  this.selectClasses = GbCommand.CommandIcons[ GbCommand.States.NotSelected]
  this.executeClasses = GbCommand.ExecuteIcons[ GbCommand.States.NotSelected]
  this.isSetpointType = this.command.commandType.indexOf('SETPOINT') === 0
  if( this.isSetpointType) {
    //this.setpointValue = undefined

    switch( this.command.commandType) {
      case 'SETPOINT_INT':
        this.pattern = /^[+-]?\d+$/;
        this.placeHolder = 'int'
        break
      case 'SETPOINT_DOUBLE':
        this.pattern = /^[-+]?\d+(\.\d+)?$/;
        this.placeHolder = 'decimal'
        break
      case 'SETPOINT_STRING':
        this.pattern = undefined;
        this.placeHolder = 'text'
        break
      default:
        break
    }

  }


}

GbCommand.States = {
  NotSelected: 'NotSelected',   // -> Selecting
  Selecting: 'Selecting',       // -> Selected, NotSelected (unauthorized or failure)
  Selected: 'Selected',         // -> Executing, NotSelected, Deselecting (user or timeout)
  Deselecting: 'Deselecting',   // -> Executing, NotSelected (user or timeout)
  Executing: 'Executing'        // -> NotSelected (success or failure)
}

GbCommand.CommandIcons = {
  NotSelected: 'fa fa-chevron-right text-primary',
  Selecting: 'fa fa-chevron-right fa-spin text-primary',
  Selected: 'fa fa-chevron-left text-primary',
  Deselecting: 'fa fa-chevron-left fa-spin text-primary',
  Executing: 'fa fa-chevron-left text-primary'
}
GbCommand.ExecuteIcons = {
  NotSelected: '',
  Selecting: '',
  Selected: 'fa fa-sign-in',
  Deselecting: 'fa fa-sign-in',
  Executing: 'fa fa-refresh fa-spin'
}

GbCommand.prototype.isSetpoint = function( ) { return this.isSetpointType}
GbCommand.prototype.isControl = function( ) { return ! this.isSetpointType}


/**
 * Called by onClick in template
 * @param command
 */
GbCommand.prototype.selectToggle = function( ) {
  switch( this.state) {
    case GbCommand.States.NotSelected: this.select(); break;
    case GbCommand.States.Selecting:   break;
    case GbCommand.States.Selected:    this.deselect(); break;
    case GbCommand.States.Executing:   break;
  }
}

GbCommand.prototype.setState = function( state) {
  console.log( 'setState from ' + this.state + ' to ' + state)
  this.state = state
  this.selectClasses = GbCommand.CommandIcons[this.state]
  this.executeClasses = GbCommand.ExecuteIcons[this.state]
  console.log( 'GbCommand.setState ' + this.command.name + ' ' + this.state + ', selectClasses ' + this.selectClasses + ', executeClasses ' + this.executeClasses)
}

GbCommand.prototype.select = function() {
  var self = this

  if( this.state !== GbCommand.States.NotSelected) {
    console.error( 'GbCommand.select invalid state: ' + this.state)
    return
  }

  this.setState( GbCommand.States.Selecting)

  this.commandRest.select( 'ALLOWED', [this.command.id],
    function( data) {
      self.lock = data
      if( self.lock.expireTime) {
        self.setState( GbCommand.States.Selected)

        var delay = self.lock.expireTime - Date.now()
        console.log( 'commandLock delay: ' + delay)
        // It the clock for client vs server is off, we'll use a minimum delay.
        delay = Math.max( delay, 10)
        self.selectTimeout = self.timeout(function () {
          delete self.lock;
          delete self.selectTimeout;
          if( self.state === GbCommand.States.Selected || self.state === GbCommand.States.Deselecting || self.state === GbCommand.States.Executing)
            self.setState( GbCommand.States.NotSelected)
        }, delay)
      } else {
        delete self.lock;
        self.deselected()
        self.alertDanger( 'Select failed. ' + data)
      }
    },
    function( ex, statusCode, headers, config) {
      console.log( 'GbCommand.select ' + ex)
      self.alertException( ex)
      self.deselected()
    })
}

GbCommand.prototype.deselected = function() {
  this.setState( GbCommand.States.NotSelected)
}


GbCommand.prototype.deselect = function() {
  var self = this

  if( this.state !== GbCommand.States.Selected) {
    console.error( 'GbCommand.deselect invalid state: ' + this.state)
    return
  }

  this.setState( GbCommand.States.Deselecting)

  self.commandRest.deselect( self.lock.id,
    function( data) {
      delete self.lock;
      if( self.state === GbCommand.States.Deselecting)
        self.setState( GbCommand.States.NotSelected)
    },
    function( ex, statusCode, headers, config) {
      console.log( 'GbCommand.deselect ' + ex)
      if( self.state === GbCommand.States.Deselecting)
        self.setState( GbCommand.States.Selected)
      self.alertException( ex)
    })
}

GbCommand.prototype.execute = function() {
  var self = this

  if( this.state !== GbCommand.States.Selected) {
    console.error( 'GbCommand.execute invalid state: ' + this.state)
    return
  }

  var args = {
    commandLockId: self.lock.id
  }

  if( this.isSetpointType) {
    if( this.pattern && !this.pattern.test( this.setpointValue)) {
      switch( this.command.commandType) {
        case 'SETPOINT_INT': self.alertDanger( 'Setpoint needs to be an integer value.'); return;
        case 'SETPOINT_DOUBLE': self.alertDanger( 'Setpoint needs to be a floating point value.'); return;
        default:
          console.error( 'Setpoint has unknown error, "' + this.setpointValue + '" for command type ' + this.command.commandType);
      }
    }

    switch( this.command.commandType) {
      case 'SETPOINT_INT':
        args.setpoint = { intValue: Number( this.setpointValue)}
        break
      case 'SETPOINT_DOUBLE':
        args.setpoint = { doubleValue: Number( this.setpointValue)}
        break
      case 'SETPOINT_STRING':
        args.setpoint = { stringValue: this.setpointValue}
        break
      default:
        console.error( 'Setpoint has unknown type, "' + this.setpointValue + '" for command type ' + this.command.commandType);
        break
    }
  }

  self.setState( GbCommand.States.Executing)


  self.commandRest.execute( this.command.id, args,
    function( commandResult) {
      self.alertCommandResult( commandResult)
      self.deselected()
    },
    function( ex, statusCode, headers, config) {
      console.log( 'GbCommand.execute ' + ex)
      self.deselected()
      self.alertException( ex)
    })
}

GbCommand.prototype.closeAlert = function( index) {
  if( this.alerts)
    this.alerts.splice( index, 1)
}

GbCommand.prototype.alertCommandResult = function( result) {
  var alert = { message: this.command.displayName + ' Successful'}
  alert.type = result.status === 'SUCCESS' ? 'success' : 'danger'
  if( result.status !== 'SUCCESS') {
    alert.message = this.command.displayName + ' ERROR: ' + result.status
    if( result.error)
      alert.message += ',  ' + result.error
  }
  this.alerts = [ alert ]
}

GbCommand.prototype.alertException = function( ex) {
  var alert = {
    type: 'danger',
    message: this.command.displayName + ' ' + ex.exception + ': ' + ex.message
  }
  this.alerts = [ alert ]
}
GbCommand.prototype.alertDanger = function( message) {
  var alert = {
    type: 'danger',
    message: this.command.displayName + ' ' + message
  }
  this.alerts = [ alert ]
}



