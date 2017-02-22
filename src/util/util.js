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



angular.module('greenbus.views.util', []).

  /**
   * Filter that returns a number with the specified number
   * of decimal places. If not a number, return 'NaN'.
   *
   * @param number The number or string to be converted.
   * @param decimalPlaces The number of decimal places in the result.
   *                      If undefined, always return the original value.
   */
  filter('toFixed', function( ) {
    return function(number, decimalPlaces) {
      if( number === undefined || number === null) {
        return '-'
      } else if( decimalPlaces === undefined) {
        return number
      } else {
        if( typeof number === 'string')
          number = parseFloat( number)
        return number.toFixed( decimalPlaces)
      }
    };
  }).

  /**
   * Filter that returns a number with the specified number
   * of decimal places or the original string. If not a number, return
   * the original string.
   *
   * @param number The number or string to be converted.
   * @param decimalPlaces The number of decimal places in the result.
   *                      If undefined, always return the original value.
   */
  filter('toFixedOrString', function( ) {
    return function(numberOrString, decimalPlaces) {
      if( numberOrString === undefined || numberOrString === null) {
        return '-'
      } else if( decimalPlaces === undefined) {
        return numberOrString
      } else if( typeof numberOrString === 'string') {
        var parsedNumber = parseFloat( numberOrString)
        if( isNaN(parsedNumber))
          return numberOrString
        else
          return parsedNumber.toFixed( decimalPlaces)
      } else {
        return numberOrString.toFixed( decimalPlaces)
      }
    };
  })


