/**
 * Copyright 2014-2016 Green Energy Corp.
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


angular.module('greenbus.views.pager', []).

controller( 'gbPagerController', ['$scope', function( $scope) {
  var self = this

}]).

directive( 'gbPager', function(){
  return {
    restrict: 'E', // Element name
    // The template HTML will replace the directive.
    replace: true,
    scope: {
      model  : '=', // GBSubscriptionViewState
      pageFirst: '&',
      pagePrevious: '&',
      pageNext: '&'
    },
    templateUrl: 'greenbus.views.template/pager/pager.html',
    controller: 'gbPagerController'
  }
}).

filter('pagePreviousClass', function() {
  return function(model) {
    return model === GBSubscriptionViewState.FIRST_PAGE || model === GBSubscriptionViewState.PAGING_PREVIOUS || model === GBSubscriptionViewState.NO_ITEMS || model === undefined ? 'btn btn-default disabled' : 'btn btn-default'
  };
}).
filter('pageNextClass', function() {
  return function(model) {
    return model === GBSubscriptionViewState.LAST_PAGE || model === GBSubscriptionViewState.PAGING_NEXT || model === GBSubscriptionViewState.NO_ITEMS || model === undefined ? 'btn btn-default disabled' : 'btn btn-default'
  };
}).
filter('pagingIcon', function() {
  return function(model, direction) {
    var spin = (direction === 'right' && model === GBSubscriptionViewState.PAGING_NEXT) || (direction === 'left' && model === GBSubscriptionViewState.PAGING_PREVIOUS)
    return spin ? 'fa fa-spin fa-chevron-' + direction : 'fa fa-chevron-' + direction
  };
})




