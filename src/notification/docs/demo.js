angular.module('greenbus.views.demo').controller('NotificationDemoCtrl', function ($rootScope, $scope, rest, subscription) {

  $scope.restStatusNotLoggedIn = function() {
    $rootScope.$broadcast('rest.status', {
      status:         rest.STATUS.NOT_LOGGED_IN,
      reinitializing: true,
      description:    'Not logged in.'
    });
  }

  $scope.restStatusApplicationServerDown = function() {
    $rootScope.$broadcast('rest.status', {
      status:         rest.STATUS.APPLICATION_SERVER_DOWN,
      reinitializing: false,
      description:    'Application server is not responding. Your network connection is down or the application server appears to be down.'
    });
  }

  $scope.restStatusUp = function() {
    $rootScope.$broadcast('rest.status', {
      status:         rest.STATUS.UP,
      reinitializing: false,
      description:    ''
    });
  }

  $scope.restStatusUp = function() {
    $rootScope.$broadcast('rest.status', {
      status:         rest.STATUS.UP,
      reinitializing: false,
      description:    ''
    });
  }

  $scope.subscriptionStatusUnopened = function() {
    $rootScope.$broadcast('subscription.status', {
      status: subscription.STATUS.UNOPENED,
      description: 'WebSocket unopened'
    });
  }

  $scope.subscriptionStatusOpening = function() {
    $rootScope.$broadcast('subscription.status', {
      status: subscription.STATUS.OPENING,
      description: 'Initializing WebSocket for subscription services.'
    });
  }

  $scope.subscriptionStatusClosed = function() {
    $rootScope.$broadcast('subscription.status', {
      status: subscription.STATUS.CLOSED,
      description: 'WebSocket closed. Your network connection is down or the application server appears to be down.'
    });
  }

  $scope.subscriptionStatusUp = function() {
    $rootScope.$broadcast('subscription.status', {
      status: subscription.STATUS.UP,
      description: ''
    });
  }

});