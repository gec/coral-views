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
 */



angular.module('greenbus.views.rest', ['greenbus.views.authentication']).
  factory('rest', ['$rootScope', '$timeout', '$http', '$q', '$location', 'authentication', function($rootScope, $timeout, $http, $q, $location, authentication) {

    var self = this;
    var retries = {
      initialize: 0,
      get:        0
    }

    var STATUS = {
      NOT_LOGGED_IN: 'NOT_LOGGED_IN',
      APPLICATION_SERVER_DOWN: 'APPLICATION_SERVER_DOWN',
      APPLICATION_REQUEST_FAILURE: 'APPLICATION_REQUEST_FAILURE',
      UP: 'UP'
    }
    var status = {
      status:         STATUS.NOT_LOGGED_IN,
      reinitializing: true,
      description:    'Initializing connection to server...'
    }
    console.log('status = ' + status.status)

    var httpConfig = {
      cache:   false,
      timeout: 10000 // milliseconds
    }
    var redirectLocation = $location.path();
    console.log('CoralRest: redirectLocation 1 =' + redirectLocation)
    if( redirectLocation.length === 0 )
      redirectLocation = '/'
    console.log('CoralRest: redirectLocation 2 =' + redirectLocation)


    if( authentication.isLoggedIn() ) {
      console.log('rest: authentication.isLoggedIn()')
      // Let's assume, for now, that we already logged in and have a valid authToken.
      setStatus({
        status:         STATUS.UP,
        reinitializing: false,
        description:    ''
      })

    } else {
      console.log('rest: ! authentication.isLoggedIn()')
    }


    function handleConnectionStatus(json) {
      setStatus(json);

      if( status.status === STATUS.UP && redirectLocation )
        $location.path(redirectLocation)
    }

    function setStatus(s) {
      if( status.status !== s.status || status.description !== s.description ||  status.reinitializing !== s.reinitializing) {
        status = s
        console.log('rest.setStatus: ' + status.status + ' - ' + status.description)
        $rootScope.$broadcast('rest.status', status);
      }
    }


    function isString(obj) {
      return Object.prototype.toString.call(obj) == '[object String]'
    }

    function notifyHttpRequestFailure(json, statusCode, headers, config) {
      //   0 Server down
      // 401 Unauthorized


      console.error('HTTP Request error ' + config.method + ' ' + config.url + ' ' + statusCode + ' json: ' + JSON.stringify(json));
      if( statusCode === 0 ) {
        setStatus({
          status:         STATUS.APPLICATION_SERVER_DOWN,
          reinitializing: false,
          description:    'Request to server timed out.'
          //description:    'Application server is not responding. Your network connection is down or the application server appears to be down.'
        });
      } else if( statusCode == 401 ) {
        setStatus({
          status:         STATUS.NOT_LOGGED_IN,
          reinitializing: true,
          description:    'Not logged in.'
        });
        redirectLocation = $location.url(); // save the current url so we can redirect the user back
        authentication.redirectToLoginPage(redirectLocation)
      } else if( statusCode === 404 || statusCode === 500 || (isString(json) && json.length === 0) ) {
        setStatus({
          status:         STATUS.APPLICATION_REQUEST_FAILURE,
          reinitializing: false,
          description:    'Application server responded with status ' + statusCode
        });
      } else {
        setStatus(json);
      }

      // 404 means it's an internal error and the page will never be found so no use retrying.
      if( statusCode != 404 ) {
        console.error('coralRest error if( statusCode != 404)')
      }
    }

    function getStatus() {
      return status
    }

    function get(url, name, scope, successListener, failureListener) {
      return getDo(url, name, scope, successListener, failureListener, $q.defer())
    }
    function getDo(url, name, scope, successListener, failureListener, deferred) {

      if( scope)
        scope.loading = true;
      //console.log( 'rest.get ' + url + ' retries:' + retries.get);


      if( !authentication.isLoggedIn() ) {
        console.log('self.get if( !authentication.isLoggedIn())')
        redirectLocation = $location.url() // save the current url so we can redirect the user back
        console.log('CoralRest.get: saving redirectLocation: ' + redirectLocation)
        authentication.redirectToLoginPage(redirectLocation)
        deferred.reject( {data: undefined, status: 'Not logged in. Redirecting to login'})
        return deferred.promise
      }

      // Register for controller.$destroy event and kill any retry tasks.
      if( scope)
        scope.$on('$destroy', function(event) {
          //console.log( 'rest.get destroy ' + url + ' retries:' + retries.get);
          if( scope.task ) {
            console.log('rest.get destroy task' + url + ' retries:' + retries.get);
            $timeout.cancel(scope.task);
            scope.task = null;
            retries.get = 0;
          }
        });

      if( status.status !== STATUS.UP ) {
        console.log('self.get ( status.status != "UP")')
        retries.get++;
        var delay = retries.get < 5 ? 1000 : 10000

        if( scope) {
          scope.task = $timeout(function() {
            self.getDo(url, name, scope, successListener, failureListener, deferred);
          }, delay);
          deferred.notify( 'Status is ' + status.status + '. Retrying in ' + (delay / 1000) + ' seconds')
        } else
          deferred.reject( {data: undefined, status: status.status})

        return deferred.promise;
      }

      retries.get = 0;

      httpConfig.headers = authentication.getHttpHeaders()


      // encodeURI because objects like point names can have percents in them.
      $http.get(encodeURI(url), httpConfig).then(
        function( response) { requestSuccess( response, deferred, name, scope, successListener, failureListener) },
        function( error) { requestFailure( error, deferred, failureListener) }
      )

      return deferred.promise
    }


    function post(url, data, name, scope, successListener, failureListener) {
      var deferred = $q.defer()

      httpConfig.headers = authentication.getHttpHeaders()

      // encodeURI because objects like point names can have percents in them.
      $http.post(url, data, httpConfig).then(
        function( response) { requestSuccess( response, deferred, name, scope, successListener, failureListener) },
        function( error) { requestFailure( error, deferred, failureListener) }
      )

      return deferred.promise
    }


    function _delete(url, name, scope, successListener, failureListener) {
      var deferred = $q.defer()

      httpConfig.headers = authentication.getHttpHeaders()

      // encodeURI because objects like point names can have percents in them.
      $http.delete(url, httpConfig).then(
        function( response) { requestSuccess( response, deferred, name, scope, successListener, failureListener) },
        function( error) { requestFailure( error, deferred, failureListener) }
      )

      return deferred.promise
    }


    function requestSuccess( response, deferred, name, scope, successListener, failureListener) {
      if( response.status === 0) {
        requestFailure( response, deferred, failureListener)
        return
      }

      var json = response.data
      if( scope) {
        if( name !== undefined)
          scope[name] = json;
        scope.loading = false;
      }

      // If the get worked, the service must be up.
      if( status.status != STATUS.UP ) {
        setStatus({
          status:         STATUS.UP,
          reinitializing: false,
          description:    ''
        });
      }

      if( successListener )
        successListener(json)

      deferred.resolve( {data: json})
    }

    function statusTextNotDefined( statusText) {
      return ! angular.isDefined( statusText) || ! angular.isString( statusText) || statusText.length === 0
    }

    function requestFailure( responseOrError, deferred, failureListener) {
      // error.status
      //   0 Request timed out. Network down or server down.
      // 400 Bad Request - request is malformed or missing required fields.
      // 401 Unauthorized
      // 403 Forbidden - Logged in, but don't have permissions to complete request, resource already locked, etc.
      // 404 Not Found - Server has not found anything matching the Request-URI
      // 408 Request Timeout
      // 500 Internal Server Error
      //
      // If the browser timed out the $http request $http can return status=0 in the success function.
      // Device select/command may have timed out or network or server could be down.
      // Example success response with status=0:
      // response: {
      //   config: { timeout: 10000, cache: false, data: Object, headers: Object, method: "POST", url: "/models/1/commandlock"},
      //   data: null,
      //   headers: function( name) {},
      //   status: 0,
      //   statusText: ""
      // }

      if( responseOrError.status === 0) {
        if( statusTextNotDefined( responseOrError.statusText))
          responseOrError.statusText =  'Request timed out (status = 0)'

        if( responseOrError.data === undefined || responseOrError.data === null)
          responseOrError.data = { exception: responseOrError.statusText}
      }

      if( failureListener )
        failureListener(responseOrError.data, responseOrError.status, responseOrError.headers, responseOrError.config)

      if( responseOrError.status === 401 || responseOrError.status === 0 )
        notifyHttpRequestFailure(responseOrError.data, responseOrError.status, responseOrError.headers, responseOrError.config)

      deferred.reject( responseOrError)
    }


    function queryParameterFromArrayOrString(parameter, arrayOrString) {
      var parameterEqual = parameter + '='
      var query = ''
      if( angular.isArray(arrayOrString) ) {
        arrayOrString.forEach(function(value, index) {
          if( index === 0 )
            query = parameterEqual + value
          else
            query = query + '&' + parameterEqual + value
        })
      } else {
        if( arrayOrString && arrayOrString.length > 0 )
          query = parameterEqual + arrayOrString
      }
      return query
    }


    /**
     * Public API
     */
    return {
      STATUS: STATUS,
      getStatus: getStatus,
      get: get,
      post: post,
      delete: _delete,
      queryParameterFromArrayOrString: queryParameterFromArrayOrString
    }

  }]).


  config(['$httpProvider', function($httpProvider) {


    // If the application server goes down and a user clicks the left sidebar, Angular will try to load the partial page and get a 404.
    // We need to catch this event to put up a message.
    //

    var interceptor = ['$q', '$injector', '$rootScope', '$location', function($q, $injector, $rootScope, $location) {

      function success(response) {
        return response;
      }

      function error(response) {
        var httpStatus = response.status;
        if( httpStatus == 401 ) {
          // Ignore httpStatus == 401. Let authentication.interceptor pick it up.
          return response
        } else if( (httpStatus === 404 || httpStatus === 0 ) && response.config.url.indexOf('.html') ) {

          var status = {
            status:         'APPLICATION_SERVER_DOWN',
            reinitializing: false,
            description:    'Application server is not responding. Your network connection is down or the application server appears to be down. HTTP Status: ' + httpStatus
          };

          //var $rootScope = $rootScope || $injector.get('$rootScope');
          $rootScope.$broadcast('rest.status', status);

          return response;
        } else {
          return $q.reject(response);
        }
      }

      return function(promise) {
        return promise.then(success, error);
      }
    }];

    $httpProvider.responseInterceptors.push(interceptor);
  }]);

