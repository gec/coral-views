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
function CommandSet( scope, point, commands, commandRest, $timeout) {
  // Control & Setpoint States

  this.commands = commands.map( function( c) { return new GbCommand( scope, c, commandRest, $timeout)})
}


//CommandSet.prototype.closeAlert = function( index) {
//  if( this.alerts)
//    this.alerts.splice( index, 1)
//}
//
//CommandSet.prototype.alertCommandResult = function( result) {
//  var alert = { message: 'Successful'}
//  alert.type = result.status === 'SUCCESS' ? 'success' : 'danger'
//  if( result.status !== 'SUCCESS') {
//    alert.message = 'ERROR: ' + result.status
//    if( result.error)
//      alert.message += ',  ' + result.error
//  }
//  this.alerts = [ alert ]
//}
//
//CommandSet.prototype.alertException = function( ex) {
//  var alert = {
//    type: 'danger',
//    message: ex.exception + ': ' + ex.message
//  }
//  this.alerts = [ alert ]
//}
//CommandSet.prototype.alertDanger = function( message) {
//  var alert = {
//    type: 'danger',
//    message: message
//  }
//  this.alerts = [ alert ]
//}

// Used for search. Not sure what else.
CommandSet.prototype.watchStates = function( scope) {
  this.commands.forEach( function( c) {
    scope.watch( c)
    if( control.length === 0 && c.isControl()) {
      control = 'control'
    } else {
      if( setpoint.length === 0 && c.isSetpoint())
        setpoint = 'setpoint'
    }
  })

  return control && setpoint ? control + ',' + setpoint : control + setpoint
}
CommandSet.prototype.getCommandTypes = function() {
  var control = '',
      setpoint = ''

  this.commands.forEach( function( c) {
    if( control.length === 0 && c.isControl()) {
      control = 'control'
    } else {
      if( setpoint.length === 0 && c.isSetpoint())
        setpoint = 'setpoint'
    }
  })

  return control && setpoint ? control + ',' + setpoint : control + setpoint
}


