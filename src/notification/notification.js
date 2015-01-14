/**
 * Copyright 2014-2015 Green Energy Corp.
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

angular.module('greenbus.views.notification', ['greenbus.views.rest', 'greenbus.views.subscription']).

/**
 * Control notification messages on top of screen. The current notifications are a reflection of the rest service (HTTP requests)
 * and subscription service (WebSocket).
 *
 *
 * rest      | subscription      | message
 * ------------------------------------------------------------------
 * INIT      | INIT              | Initializing services... (rest, subscription)
 * UP        | INIT              | Initializing services... (subscription)
 * UP        | UP                | -
 *
 *
 * Initializing services... (rest, subscription)
 * Initializing services... (rest)
 * Not logged in. Redirecting to login page...
 * Application server is not responding.  (rest, subscription)
 * Service failure... (subscription
 */
  controller( 'gbNotificationController', [ '$scope', 'rest', 'subscription',
    function( $scope, rest, subscription) {

      var restStatus = rest.getStatus(),
          subscriptionStatus = subscription.getStatus(),
          greenbusStatus = {
            status: 'UP', // let's assume UP until we hear otherwise.
            reinitializing: false,
            description: ''
          }

      $scope.notifications = []

      function makeNotifications() {
        $scope.notifications = []
        if( restStatus.status !== rest.STATUS.UP)
          $scope.notifications.push( restStatus.description)
        if( subscriptionStatus.status !== subscription.STATUS.UP && subscriptionStatus.status !== subscription.STATUS.UNOPENED)
          $scope.notifications.push( subscriptionStatus.description)
        if( greenbusStatus.status !== 'UP')
          $scope.notifications.push( greenbusStatus.description)
      }

      $scope.$on( 'rest.status', function( event, status) {
        restStatus = status;
        //if( restStatus.status !== 'UP')
        makeNotifications()
      })

      $scope.$on( 'subscription.status', function( event, status) {
        subscriptionStatus = status;
        //if( subscriptionStatus.status !== 'UP')
        makeNotifications()
      })

      $scope.$on( 'greenbus.status', function( event, status) {
        greenbusStatus = status;
        //if( greenbusStatus.status !== 'UP')
        makeNotifications()
      })

    }]).

  directive( 'gbNotification', function(){
    return {
      restrict: 'E', // Element name
      // The template HTML will replace the directive.
      replace: true,
      transclude: true,
      scope: true,
      templateUrl: 'template/notification/notification.html',
      controller: 'gbNotificationController'
    }
  })


