describe('gb-notification', function () {
  var scope, $compile, element, rest, subscription

  var authToken = 'some auth token'
  var mock = {

    authentication:   {
      isLoggedIn:   function() {return true},
      getAuthToken: function() { return authToken}
    },
    websocket:        {
      send:  function( m) {},
      close: function() {}
    },
    websocketFactory: function(url) {
      return mock.websocket
    },
    location:         {
      protocol: function() { return 'http' },
      host:     function() { return 'localhost' },
      port:     function() { return 9000 },
      path:     function() { return '' }
    }
  }

  beforeEach(module('greenbus.views.rest'));
  beforeEach(module('greenbus.views.subscription'));
  beforeEach(module('greenbus.views.notification'));
  beforeEach(module('greenbus.views.template/notification/notification.html'));
  beforeEach(function() {
    module(function($provide) {
      $provide.value('authentication', mock.authentication)
      $provide.value('$location', mock.location)
    })

    // override the default websocketFactory
    angular.module('greenbus.views.subscription').
      factory('websocketFactory', function($window) {
        return mock.websocketFactory
      })
  });

  
  
  


  beforeEach(inject(function ($rootScope, _$compile_) {

    scope = $rootScope;
    $compile = _$compile_;

    element = angular.element( '<gb-notification></gb-notification>');
  }));


  function initGbNotificationElement() {
    $compile(element)(scope);
    scope.$digest();
    return findNotifications();
  }

  function findNotifications() {
    return element.find('.gb-notification-message');
  }

  describe('subscription notifications', function() {

    it('should start with 0 events', inject( function () {
      var notifications = initGbNotificationElement();
      expect( notifications.length).toEqual(0);
    }));

    it('should show webSocket OPENING', inject( function (subscription) {
      var notifications = initGbNotificationElement();

      scope.$broadcast('subscription.status', {
        status: subscription.STATUS.OPENING,
        description: 'Initializing WebSocket for subscription services.'
      });
      scope.$digest()

      notifications = findNotifications()
      expect( notifications.length).toEqual(1)
      expect( notifications.eq(0).text()).toBe('Initializing WebSocket for subscription services.')
    }));

    it('should show webSocket CLOSED', inject( function (subscription) {
      var notifications = initGbNotificationElement(),
          description = 'description'
      expect( notifications.length).toEqual(0);

      scope.$broadcast('subscription.status', {
        status: subscription.STATUS.CLOSED,
        description: description
      });
      scope.$digest()

      notifications = findNotifications()
      expect( notifications.length).toEqual(1)
      expect( notifications.eq(0).text()).toBe( description)
    }));

    it('should show webSocket CLOSED', inject( function (subscription) {
      var notifications = initGbNotificationElement(),
          description = 'description'

      scope.$broadcast('subscription.status', {
        status: subscription.STATUS.CLOSED,
        description: description
      });
      scope.$digest()

      notifications = findNotifications()
      expect( notifications.length).toEqual(1)
      expect( notifications.eq(0).text()).toBe( description)
    }));

    it('should show webSocket UP', inject( function (subscription) {
      var notifications = initGbNotificationElement()

      scope.$broadcast('subscription.status', {
        status: subscription.STATUS.UP,
        description: ''
      });
      scope.$digest()

      notifications = findNotifications()
      expect( notifications.length).toEqual(0)
    }));
  });

  describe('rest notifications', function() {

    it('should start with 0 events', inject( function () {
      var notifications = initGbNotificationElement();
      expect( notifications.length).toEqual(0);
    }));

    it('should show rest NOT_LOGGED_IN', inject( function (rest) {
      var notifications = initGbNotificationElement(),
          description = 'description'

      scope.$broadcast('rest.status', {
        status: rest.STATUS.NOT_LOGGED_IN,
        description: description
      });
      scope.$digest()

      notifications = findNotifications()
      expect( notifications.length).toEqual(1)
      expect( notifications.eq(0).text()).toBe(description)
    }));

    it('should show rest APPLICATION_SERVER_DOWN', inject( function (rest) {
      var notifications = initGbNotificationElement(),
          description = 'description'
      expect( notifications.length).toEqual(0);

      scope.$broadcast('rest.status', {
        status: rest.STATUS.APPLICATION_SERVER_DOWN,
        description: description
      });
      scope.$digest()

      notifications = findNotifications()
      expect( notifications.length).toEqual(1)
      expect( notifications.eq(0).text()).toBe( description)
    }));

    it('should show rest APPLICATION_REQUEST_FAILURE', inject( function (rest) {
      var notifications = initGbNotificationElement(),
          description = 'description'

      scope.$broadcast('rest.status', {
        status: rest.STATUS.APPLICATION_REQUEST_FAILURE,
        description: description
      });
      scope.$digest()

      notifications = findNotifications()
      expect( notifications.length).toEqual(1)
      expect( notifications.eq(0).text()).toBe( description)
    }));

    it('should show rest UP', inject( function (rest) {
      var notifications = initGbNotificationElement()

      scope.$broadcast('rest.status', {
        status: rest.STATUS.UP,
        description: ''
      });
      scope.$digest()

      notifications = findNotifications()
      expect( notifications.length).toEqual(0)
    }));
  });
  describe('rest & subscription notifications', function() {

    it('should show rest NOT_LOGGED_IN and subscription CLOSED', inject( function (rest, subscription) {
      var notifications = initGbNotificationElement(),
          description1 = 'description1',
          description2 = 'description2'

      scope.$broadcast('rest.status', {
        status: rest.STATUS.NOT_LOGGED_IN,
        description: description1
      });
      scope.$broadcast('subscription.status', {
        status: subscription.STATUS.CLOSED,
        description: description2
      });
      scope.$digest()

      notifications = findNotifications()
      expect( notifications.length).toEqual(2)
      expect( notifications.eq(0).text()).toBe(description1)
      expect( notifications.eq(1).text()).toBe(description2)

      scope.$broadcast('rest.status', {
        status: rest.STATUS.UP,
        description: ''
      });
      scope.$broadcast('subscription.status', {
        status: subscription.STATUS.UP,
        description: ''
      });
      scope.$digest()

      notifications = findNotifications()
      expect( notifications.length).toEqual(0)

    }));

  });



});
