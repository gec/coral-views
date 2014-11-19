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

angular.module('gec.views.authentication', ['ngCookies']).

  factory('authentication', [ '$rootScope', '$timeout', '$http', '$location', '$cookies', '$window', function( $rootScope, $timeout, $http, $location, $cookies, $window){

    var self = this;


    var STATE = {
      NOT_LOGGED_IN: 'Not logged in',
      LOGIN_FAILED: 'Login failed',
      LOGGING_IN: 'Logging in...',
      LOGGED_IN: 'Logged in'
    }

    var status = {
      status: STATE.NOT_LOGGED_IN,
      reinitializing: true,
      message: ''
    }
    console.log( 'status = ' + status.status)

    var httpConfig = {
      cache: false,
      timeout: 10000 // milliseconds
    }


    var authTokenName = 'coralAuthToken'
    var authToken = $cookies[authTokenName];
    if( authToken && authToken.length > 5) {
      console.log( 'found ' + authTokenName + '=' + authToken)
      // Let's assume, for now, that we already logged in and have a valid authToken.
      setStatus( {
        status: STATE.LOGGED_IN,
        reinitializing: false
      })

    } else {
      console.log( 'no ' + authTokenName)
    }


    function setStatus( s) {
      status = s
      console.log( 'setStatus: ' + status.status)
      $rootScope.$broadcast( 'authentication.status', status);
    }

    function getLoginUri( redirectAfterLogin) {
      if( redirectAfterLogin && redirectAfterLogin.length > 1)
        return '/login?redirectAfterLogin=' + encodeURIComponent( redirectAfterLogin)
      else
        return '/login'
    }


    /**
     * Public API
     */
    return {

      STATE: STATE, // publish STATE enum


      getStatus: function() {
        return status;
      },


      login: function( userName, password, redirectLocation, errorListener) {
        //console.log( 'reef.login ' + userName)
        var data = {
          'userName': userName,
          'password': password
        }
        $http.post( '/login', data).
          success(function(json) {
            //console.log( '/login response: ' + json)
            if( json.error) {
              // Shouldn't get here because should have an HTTP error code for error() or 401 interceptor.
              if( errorListener)
                errorListener( json.error)
            } else {
              authToken = json[authTokenName];
              console.log( 'login successful with ' + authTokenName + '=' + authToken)
              setStatus( {
                status: STATE.LOGGED_IN,
                reinitializing: false,
                message: ''
              })
              $cookies[authTokenName] = authToken
              $cookies.userName = userName
              console.log( 'login success, setting cookie, redirectLocation: "/#' + redirectLocation + '"')
              if( redirectLocation)
                $window.location.href = '/#' + redirectLocation
              else
                $window.location.href = '/#/entity'
            }
          }).
          error(function (json, statusCode, headers, config) {
            // called asynchronously if an error occurs
            // or server returns response with status
            // code outside of the <200, 400) range
            console.log( 'reef.login error ' + config.method + ' ' + config.url + ' ' + statusCode + ' json: ' + JSON.stringify( json));
            var message = json && json.error && json.error.description || 'Unknown login failure';
            if( statusCode === 0) {
              message =  'Application server is not responding. Your network connection is down or the application server appears to be down.';
              setStatus( {
                status: STATE.NOT_LOGGED_IN,
                reinitializing: false,
                message: message
              });
            } else {
              setStatus( {
                status: STATE.NOT_LOGGED_IN,
                reinitializing: false,
                message: message
              });
            }
            if( errorListener)
              errorListener( message)
          });
      },

      logout: function( errorListener) {
        console.log( 'reef.logout')
        httpConfig.headers = {'Authorization': authToken}
        $http['delete']( '/login', httpConfig).  // delete is ECMASCRIPT5
          success(function(json) {
            if( json.error) {
              // Shouldn't get here.
              console.error( 'logout error: ' + json)
              if( errorListener)
                errorListener( json.error)
            } else {
              console.log( 'logout successful')
              setStatus( {
                status: STATE.NOT_LOGGED_IN,
                reinitializing: false,
                message: ''
              })
              authToken = null
              delete $cookies[authTokenName]
              $window.location.href = '/login'
            }
          }).
          error(function (json, statusCode, headers, config) {
            // called asynchronously if an error occurs
            // or server returns response with status
            // code outside of the <200, 400) range
            console.log( 'reef.logout error ' + config.method + ' ' + config.url + ' ' + statusCode + ' json: ' + JSON.stringify( json));
            var message = json && json.error && json.error.description || 'Unknown login failure';
            if( statusCode === 0) {
              message =  'Application server is not responding. Your network connection is down or the application server appears to be down.';
              setStatus( {
                status: 'APPLICATION_SERVER_DOWN',
                reinitializing: false,
                message: message
              });
            } else {
              setStatus( {
                status: 'APPLICATION_REQUEST_FAILURE',
                reinitializing: false,
                message: message
              });
            }
            if( errorListener)
              errorListener( message)
          });
      },


      isLoggedIn: function() {
        return !!( authToken && status.status !== STATE.NOT_LOGGED_IN)
      },

      redirectToLoginPage: function( redirectAfterLogin) {
        console.log( 'AuthenticationService.redirectToLoginPage( redirectAfterLogin = ' + redirectAfterLogin + ')')
        authToken = null
        console.log( 'redirectToLoginPage window.location.href = /login')
        $window.location.href = getLoginUri( redirectAfterLogin)
      },

      getHttpHeaders: function() {
        if( authToken)
          return {'Authorization': authToken}
        else
          return {}
      },

      getAuthToken: function() {
        return authToken
      }

    } // return public API




  }] ). // end factory authentication

  // This http interceptor listens for authentication failures
  factory('authenticationInterceptor', ['$location', '$injector', function($location, $injector) {
    return function(promise) {
      // Intercept failed requests
      return promise.then(null, function(originalResponse) {
        if(originalResponse.status === 401) {

          var redirectLocation = $location.path(); // or $location.url() ?
          console.log( 'authenticationInterceptor: redirectLocation 1 =' + redirectLocation)


          // If we're already on the login page, we don't redirect on failed login.
          if( redirectLocation.indexOf( '/login') !== 0){

            var authentication = $injector.get('authentication')
            authentication.redirectToLoginPage( redirectLocation)
          }

          /*
           // The request bounced because it was not authorized - add a new request to the retry queue
           promise = queue.pushRetryFn('unauthorized-server', function retryRequest() {
           // We must use $injector to get the $http service to prevent circular dependency
           return $injector.get('$http')(originalResponse.config);
           });
           */
        }
        return promise;
      });
    };
  }] ).

  // We have to add the interceptor to the queue as a string because the interceptor depends upon service instances that are not available in the config block.
  config(['$httpProvider', function($httpProvider) {
    $httpProvider.responseInterceptors.push('authenticationInterceptor');
  }] ).


  // The LoginFormController provides the behaviour behind a reusable form to allow users to authenticate.
  // This controller and its template (partials/login.html) are used in a modal dialog box by the authentication service.
  // $modal is from ui-bootstrap
  controller('LoginController', ['$scope', 'authentication', '$modal', function($scope, authentication, $modal) {

    $scope.error = undefined
    $scope.status = authentication.getStatus()
    $scope.userName = ''
    $scope.password = ''
    var mainScope = $scope

    function errorListener( description) {
      $scope.error = description
      openDialog()
    }


    // the dialog is injected in the specified controller
    var ModalController = ['$scope', '$modalInstance', 'userName', 'password', 'error', function($scope, $modalInstance, userName, password, error){
      // private scope just for this controller.
      $scope.userName = userName
      $scope.password = password
      $scope.error = error
      $scope.login = function(){
        // Can only pass one argument.
        // Angular-UI is not right. 'this' is where the scope variables are.
        $modalInstance.close( {userName: this.userName, password: this.password});   // calls then()
      };
    }]


    function openDialog(){
      var modalOptions = {
        backdrop: 'static', // don't close when clicking outside of model.
        keyboard: false, // escape does not close dialog
        templateUrl:  'partials/loginmodal.html',
        controller: ModalController,
        resolve: {
          // Pass these to ModalController
          error: function(){ return angular.copy( $scope.error) },  //TODO: Does this still need copy?
          userName: function(){ return angular.copy( $scope.userName) },
          password: function(){ return angular.copy( $scope.password) }
        }
      };
      var d = $modal.open( modalOptions);
      d.result.then(function( result) {
        // Save the result to the main scope
        mainScope.userName = result.userName
        mainScope.password = result.password
        authentication.login( result.userName, result.password, null, errorListener);
      });
    }

    $scope.openDialog = openDialog
    openDialog()

  }]);
