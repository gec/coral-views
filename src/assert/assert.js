/**
* Copyright 2013-2014 Green Energy Corp.
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

angular.module('greenbus.views.assert', []).

  factory('assert', [ function(){

    var exports = {}  // public API


    exports.stringNotEmpty = function( s, message) {
      if( typeof s !== 'string' || s === '' || s === undefined || s === null) {
        message = message === undefined ? 'Value ' : message + ' '
        var messageFull = message + JSON.stringify( s) + ' is empty or undefined or not a string'
        console.error( messageFull)
        throw messageFull
      }
    }

    exports.stringEmpty = function( s, message) {
      if( typeof s !== 'string' || s !== '') {
        message =  message === undefined ? 'Value ' : message + ' '
        var messageFull = message + JSON.stringify( s) + ' is not empty or undefined or not a string'
        console.error( messageFull)
        throw messageFull
      }
    }

    exports.equals = function( a, b, message) {
      if( a !== b) {
        message =  message === undefined ? 'Value ' : message + ' '
        var messageFull = message + JSON.stringify( a) + ' is not equal to ' + JSON.stringify( a)
        console.error( messageFull)
        throw messageFull
      }
    }

    /**
     * Public API
     */
    return exports

  }]);
