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


angular.module('greenbus.views.command', []).

  factory('gbCommandRest', ['rest', function( rest) {

    var exports = {}

    exports.select = function(accessMode, commandIds, success, failure) {
      var arg = {
        accessMode: accessMode,
        commandIds: commandIds
      }
      return rest.post('/models/1/commandlock', arg, null, null, success, failure)
    }

    exports.deselect = function(lockId, success, failure) {
      return rest.delete('/models/1/commandlock/' + lockId, null, null, success, failure)
    }

    exports.execute = function(commandId, args, success, failure) {
      return rest.post('/models/1/commands/' + commandId, args, null, null, success, failure)
    }

    return exports
  }]).

  factory('gbCommandEnums', function() {

    return {
      States: {
        NotSelected: 'NotSelected',   // -> Selecting
        Selecting: 'Selecting',       // -> Selected, NotSelected (unauthorized or failure)
        Selected: 'Selected',         // -> Executing, NotSelected, Deselecting (user or timeout)
        Deselecting: 'Deselecting',   // -> Executing, NotSelected (user or timeout)
        Executing: 'Executing'        // -> NotSelected (success or failure)
      },
      CommandIcons: {
        NotSelected: 'fa fa-chevron-right text-primary',
        Selecting:   'fa fa-chevron-right text-primary fa-spin',
        Selected:    'fa fa-chevron-left text-primary',
        Deselecting: 'fa fa-chevron-left text-primary fa-spin',
        Executing:   'fa fa-chevron-left text-primary'
      },
      ExecuteIcons: {
        NotSelected: '',
        Selecting:   '',
        Selected:    'fa fa-sign-in',
        Deselecting: 'fa fa-sign-in',
        Executing:   'fa fa-refresh fa-spin'
      }

    }
  }).

  controller( 'gbCommandController', ['$scope', 'gbCommandRest', 'gbCommandEnums', '$timeout', function( $scope, gbCommandRest, gbCommandEnums, $timeout) {
    var selectTimer, lock,
        States = gbCommandEnums.States,
        CommandIcons = gbCommandEnums.CommandIcons,
        ExecuteIcons = gbCommandEnums.ExecuteIcons

    // $scope.model holds the command as returned from the server.
    $scope.replyError = undefined
    $scope.state = States.NotSelected
    $scope.isSelected = false

    $scope.selectClasses = CommandIcons[ States.NotSelected]
    $scope.executeClasses = ExecuteIcons[ States.NotSelected]
    $scope.isSetpointType = $scope.model.commandType.indexOf('SETPOINT') === 0
    if( $scope.isSetpointType) {
      $scope.setpoint = { value: ''} // MUST be an object for input text for 2-way binding with <input/>!!!

      switch( $scope.model.commandType) {
        case 'SETPOINT_INT':
          $scope.pattern = /^[+-]?\d+$/;
          $scope.placeHolder = 'int'
          break
        case 'SETPOINT_DOUBLE':
          $scope.pattern = /^[-+]?\d+(\.\d+)?$/;
          $scope.placeHolder = 'decimal'
          break
        case 'SETPOINT_STRING':
          $scope.pattern = undefined;
          $scope.placeHolder = 'text'
          break
        default:
          break
      }

    }

    /**
     * Called by onClick in template
     * @param command
     */
    $scope.selectToggle = function( ) {
      switch( $scope.state) {
        case States.NotSelected: $scope.select(); break;
        case States.Selecting:   break;
        case States.Selected:    $scope.deselect(); break;
        case States.Executing:   break;
      }
    }

    function setState( state) {
      console.log( 'setState from ' + $scope.state + ' to ' + state)
      $scope.state = state
      $scope.isSelected = state === States.Selected || state === States.Deselecting || state === States.Executing
      $scope.selectClasses = CommandIcons[$scope.state]
      $scope.executeClasses = ExecuteIcons[$scope.state]
      console.log( 'gbCommandController.setState ' + $scope.model.name + ' ' + $scope.state + ', selectClasses ' + $scope.selectClasses + ', executeClasses ' + $scope.executeClasses)
    }
    
    function cancelSelectTimer() {
      if( selectTimer) {
        $timeout.cancel( selectTimer)
        selectTimer = undefined
      }
    }

    $scope.select = function() {

      if( $scope.state !== States.NotSelected) {
        console.error( 'gbCommandController.select invalid state: ' + $scope.state)
        return
      }

      setState( States.Selecting)

      gbCommandRest.select( 'ALLOWED', [$scope.model.id],
        function( data) {
          lock = data
          if( lock.expireTime) {
            setState( States.Selected)

            var delay = lock.expireTime - Date.now()
            console.log( 'commandLock delay: ' + delay)
            // It the clock for client vs server is off, we'll use a minimum delay.
            delay = Math.max( delay, 10)
            selectTimer = $timeout(function () {
              lock = undefined
              selectTimer = undefined
              if( $scope.state === States.Selected || $scope.state === States.Deselecting || $scope.state === States.Executing)
                setState( States.NotSelected)
            }, delay)
          } else {
            lock = undefined
            deselected()
            alertDanger( 'Select failed. ' + data)
          }
        },
        function( ex, statusCode, headers, config) {
          console.log( 'gbCommandController.select ' + JSON.stringify( ex))
          alertException( ex)
          deselected()
        })
    }

    function deselected() {
      setState( States.NotSelected)
    }


    $scope.deselect = function() {

      if( $scope.state !== States.Selected) {
        console.error( 'gbCommandController.deselect invalid state: ' + $scope.state)
        return
      }

      setState( States.Deselecting)

      gbCommandRest.deselect( lock.id,
        function( data) {
          lock = undefined
          cancelSelectTimer()
          if( $scope.state === States.Deselecting)
            setState( States.NotSelected)
        },
        function( ex, statusCode, headers, config) {
          console.log( 'gbCommandController.deselect ' + JSON.stringify( ex))
          if( $scope.state === States.Deselecting)
            setState( States.Selected)
          alertException( ex)
        })
    }

    $scope.execute = function() {
      console.log( 'gbCommandController.execute state: ' + $scope.state)

      if( $scope.state !== States.Selected) {
        console.error( 'gbCommandController.execute invalid state: ' + $scope.state)
        return
      }

      var args = {
        commandLockId: lock.id
      }

      if( $scope.isSetpointType) {
        if( $scope.setpoint.value === undefined) {
          console.error( 'gbCommandController.execute ERROR: setpoint value is undefined')
          return
        }

        if( $scope.pattern && !$scope.pattern.test( $scope.setpoint.value)) {
          console.error( 'gbCommandController.execute ERROR: setpoint value is invalid "' + $scope.setpoint.value + '"')
          switch( $scope.model.commandType) {
            case 'SETPOINT_INT': alertDanger( 'Setpoint needs to be an integer value.'); return;
            case 'SETPOINT_DOUBLE': alertDanger( 'Setpoint needs to be a floating point value.'); return;
            default:
              console.error( 'Setpoint has unknown error, "' + $scope.setpoint.value + '" for command type ' + $scope.model.commandType);
          }
        }

        switch( $scope.model.commandType) {
          case 'SETPOINT_INT':
            args.setpoint = { intValue: Number( $scope.setpoint.value)}
            break
          case 'SETPOINT_DOUBLE':
            args.setpoint = { doubleValue: Number( $scope.setpoint.value)}
            break
          case 'SETPOINT_STRING':
            args.setpoint = { stringValue: $scope.setpoint.value}
            break
          default:
            console.error( 'Setpoint has unknown type, "' + $scope.setpoint.value + '" for command type ' + $scope.model.commandType);
            break
        }
      }

      setState( States.Executing)

      gbCommandRest.execute( $scope.model.id, args,
        function( commandResult) {
          cancelSelectTimer()
          alertCommandResult( commandResult)
          deselected()
        },
        function( ex, statusCode, headers, config) {
          console.log( 'gbCommandController.execute ' + JSON.stringify( ex))
          cancelSelectTimer()
          deselected()
          alertException( ex)
        })
    }

    function alertCommandResult( result) {
      console.log( 'alertCommandResult: result.status "' + result.status + '"')
      if( result.status !== 'SUCCESS') {
        console.log( 'alertCommandResult: result.error "' + result.error + '"')
        var message = result.status
        if( result.error)
          message += ':  ' + result.error
        $scope.replyError = message
      }
    }

    function alertException( ex) {
      console.error( 'gbCommandController.alertException ' + JSON.stringify( ex))
      var message = ex.message
      if( message === undefined || message === '')
        message = ex.exception
      $scope.replyError = message
    }

    function alertDanger( message) {
      console.error( 'alertDanger message: ' + JSON.stringify( message))
      $scope.replyError = message
    }


    $scope.$on( '$destroy', function( event ) {
      cancelSelectTimer()
    })

  }]).

  directive( 'gbCommand', function(){
    return {
      restrict: 'E', // Element name
      // The template HTML will replace the directive.
      replace: true,
      scope: {
             model : '='
      },
      templateUrl: 'greenbus.views.template/command/command.html',
      controller: 'gbCommandController'
    }
  })
