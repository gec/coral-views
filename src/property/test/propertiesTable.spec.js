describe('gb-properties-table', function () {
  var scope, $compile, _subscription,
      subscribeInstance = {};
  var element,
      entityId = 'entity-1',
      propertyCount = 3,
      properties = []


  for( var index = 0; index < propertyCount; index++) {
    properties.push( {
      key: 'key'+index,
      value: index
    })
  }

  function makeSubscriptionId( request, idCounter) {
    var messageKey = Object.keys( request)[0]
    return 'subscription.' + messageKey + '.' + idCounter;
  }

  var authToken = 'some auth token',
      authenticationMock =   {
        isLoggedIn:   function() {
          return true
        },
        getAuthToken: function() {
          return authToken
        },
        getHttpHeaders: function() {
          return {'Authorization': authToken}
        }
      }


  beforeEach(module('greenbus.views.authentication'));
  beforeEach(module('greenbus.views.subscription'));
  beforeEach(module('greenbus.views.property'));
  beforeEach(module('greenbus.views.template/property/propertiesTable.html'));

  beforeEach(function () {
    subscribeInstance = {}
    _subscription = {
      subscribe: function (request, subscriberScope, onSuccess, onError) {
        subscribeInstance = {
          id: makeSubscriptionId( request, 1),
          request: request,
          scope: subscriberScope,
          onSuccess: onSuccess,
          onError: onError
        }

        return subscribeInstance.id;
      }
    };

    _websocketFactory = {}
    module( function ($provide) {
      $provide.value('websocketFactory', _websocketFactory);
      $provide.value('authentication', authenticationMock);
      $provide.value('subscription', _subscription);
      $provide.value('$stateParams', {
        microgridId: entityId,
        navigationElement: {
          id: entityId,
          name: 'name1',      // full entity name
          shortName: 'shortName1',
          equipmentChildren: []
        }
      });

    });

  });

  beforeEach(inject(function ($rootScope, _$compile_) {

    scope = $rootScope;
    $compile = _$compile_;

    element = angular.element( '<gb-properties-table></gb-properties-table>');
    $compile(element)(scope);
    scope.$digest();
  }));


  function findPropertyRows() {
    return element.find('.gb-property')
  }

  function findAlerts() {
    return element.find('div.alert')
  }
  function findAlertCloseButton( alerts, index) {
    return alerts.eq(index).find('button')
  }

  function findAlertText( alerts, index) {
    return alerts.eq(index).find('span.ng-binding').text()
  }

  function findTd( property, tdIndex) {
    return property.find('td').eq(tdIndex)
  }

  it('should start with 0 properties', inject( function () {
    var foundProperties = findPropertyRows(),
        foundAlerts = findAlerts()
    expect( foundProperties.length).toEqual(0)
    expect( foundAlerts.length).toEqual(0)
  }));

  it('should subscribe to properties', inject( function () {
    var request = {
      name: 'SubscribeToProperties',
      entityId: entityId
    }
    expect( subscribeInstance.onSuccess ).toBeDefined()
    expect( subscribeInstance.onError ).toBeDefined()
    expect( subscribeInstance.request ).toEqual( request)
  }));

  it('should have a table row for each property', inject( function () {
    subscribeInstance.onSuccess( subscribeInstance.id, 'properties', properties)
    scope.$digest();
    var foundProperties = findPropertyRows()
    expect( foundProperties.length).toEqual(3)

  }));

  it('should update existing property', inject( function () {
    var notificationProperty = {
      operation: 'MODIFIED',
      value: angular.extend( {}, properties[0], { value: 'updated'})
    }

    subscribeInstance.onSuccess( subscribeInstance.id, 'properties', properties)
    subscribeInstance.onSuccess( subscribeInstance.id, 'notification.property', notificationProperty)
    scope.$digest();

    var foundProperties = findPropertyRows()
    expect( foundProperties.length).toEqual(3)

    var property = foundProperties.eq(0)
    expect( findTd( property, 0).text()).toBe( properties[0].key)
    expect( findTd( property, 1).text()).toBe( 'updated')
  }));

  it('should add new property', inject( function () {
    var newProperty = {
          key: 'newby',      // note: key 'newby' will be sorted last
          value: 'newValue'
        },
        notificationProperty = {
          operation: 'ADDED',
          value: newProperty
        }

    subscribeInstance.onSuccess( subscribeInstance.id, 'properties', properties)
    subscribeInstance.onSuccess( subscribeInstance.id, 'notification.property', notificationProperty)
    scope.$digest();

    var foundProperties = findPropertyRows()
    expect( foundProperties.length).toEqual(4)

    var property = foundProperties.eq(3)
    expect( findTd( property, 0).text()).toBe( newProperty.key)
    expect( findTd( property, 1).text()).toBe( newProperty.value)
  }));

  it('should delete existing property', inject( function () {
    var notificationProperty = {
      operation: 'REMOVED',
      value: properties[2]
    }

    subscribeInstance.onSuccess( subscribeInstance.id, 'properties', properties)
    subscribeInstance.onSuccess( subscribeInstance.id, 'notification.property', notificationProperty)
    scope.$digest();

    var foundProperties = findPropertyRows()
    expect( foundProperties.length).toEqual(2)

    expect( findTd( foundProperties.eq(0), 0).text()).toBe( properties[0].key)
    expect( findTd( foundProperties.eq(1), 0).text()).toBe( properties[1].key)
  }));

  it('should receive error message, show alert, and click to remove alert.', inject( function () {
    var foundAlerts, closeButton,
        errorMessage = 'Some error message.',
        message = {
          error: errorMessage
        }

    subscribeInstance.onError( errorMessage, message)
    scope.$digest();
    foundAlerts = findAlerts()
    expect( foundAlerts.length).toEqual(1)
    expect( findAlertText( foundAlerts, 0)).toBe( errorMessage)

    closeButton = findAlertCloseButton( foundAlerts, 0)
    closeButton.trigger( 'click')
    foundAlerts = findAlerts()
    expect( foundAlerts.length).toEqual(0)

  }));

});
