describe('gb-measurements', function () {
  var parentScope, scope, $compile, $httpBackend, $q, pointsDefer, getPointsDefer,
      subscribeInstance = {};
  var element,
      measurements = [];

  var equipmentId = 'equipmentId',
      points = [
        {'name': 'MG1.Device1.Status', 'id': 'Device1.Status', 'pointType': 'STATUS', 'types': ['UtilityBreakerStatus', 'BreakerStatus', 'Point'], 'unit': 'status', 'endpoint': 'someEndpointUuid' },
        {'name': 'MG1.Device0.Status', 'id': 'Device0.Status', 'pointType': 'STATUS', 'types': ['Imported', 'CustomerBreakerStatus', 'BreakerStatus', 'Point'], 'unit': 'status', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
        {'name': 'MG1.Device2.kW_tot', 'id': 'Device2.kW_tot', 'pointType': 'ANALOG', 'types': ['Imported', 'DemandPower', 'Point'], 'unit': 'kW', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6' },
        {'name': 'MG1.Device3.Load', 'id': 'Device3.Load', 'pointType': 'ANALOG', 'types': ['Imported', 'LoadPower', 'Point'], 'unit': 'kW', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
        {'name': 'MG1.Device4.DR', 'id': 'Device4.DR', 'pointType': 'COUNTER', 'types': ['Point', 'DemandResponseStage', 'Imported'], 'unit': 'Stage', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'}
      ],
      points2 = [
        {'name': 'MG1.Device11.Status', 'id': 'Device11.Status', 'pointType': 'STATUS', 'types': ['UtilityBreakerStatus', 'BreakerStatus', 'Point'], 'unit': 'status', 'endpoint': 'someEndpointUuid' },
        {'name': 'MG1.Device10.Status', 'id': 'Device10.Status', 'pointType': 'STATUS', 'types': ['Imported', 'CustomerBreakerStatus', 'BreakerStatus', 'Point'], 'unit': 'status', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
        {'name': 'MG1.Device12.kW_tot', 'id': 'Device12.kW_tot', 'pointType': 'ANALOG', 'types': ['Imported', 'DemandPower', 'Point'], 'unit': 'kW', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6' },
        {'name': 'MG1.Device13.Load', 'id': 'Device13.Load', 'pointType': 'ANALOG', 'types': ['Imported', 'LoadPower', 'Point'], 'unit': 'kW', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
        {'name': 'MG1.Device14.DR', 'id': 'Device14.DR', 'pointType': 'COUNTER', 'types': ['Point', 'DemandResponseStage', 'Imported'], 'unit': 'Stage', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'}
      ],
      commands = {
        'Device0.Status': [  // for MG1.Device0.Status
          {'name': 'MG1.Device0.Close0', 'id': 'a1b8f486-f476-4095-8700-f25719ce41cd', 'commandType': 'CONTROL', 'displayName': 'Close0', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
          {'name': 'MG1.Device0.Trip0', 'id': '11aaf3b1-9777-4617-841f-564308752822', 'commandType': 'CONTROL', 'displayName': 'Trip0', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'}
        ],
        'Device1.Status': [ // for MG1.Device1.Status
          {'name': 'MG1.Device1.Close', 'id': '88305576-1c98-49fb-993f-233d2e137af8', 'commandType': 'CONTROL', 'displayName': 'Close', 'endpoint': '73a3da76-14f7-40e3-b0bb-455af8ee066b'},
          {'name': 'MG1.Device1.Trip', 'id': '02715339-51f9-4f7c-8898-b8261849220e', 'commandType': 'CONTROL', 'displayName': 'Trip', 'endpoint': '73a3da76-14f7-40e3-b0bb-455af8ee066b'}
        ]
      }


  function makeSubscriptionId( request, idCounter) {
    return 'subscription.' + request.name + '.' + idCounter;
  }

  var authToken = 'some auth token'
  var mocks = {
    authentication: {
      isLoggedIn:   function() { return true },
      getAuthToken: function() { return authToken },
      getHttpHeaders: function() { return {'Authorization': authToken} }
    },
    request: {
      push: jasmine.createSpy('requestPush')
    },
    subscription: {
      subscribe: function (request, subscriberScope, onMessage, onError) {
        subscribeInstance = {
          id: makeSubscriptionId( request, 1),
          request: request,
          scope: subscriberScope,
          onMessage: onMessage,
          onError: onError
        }

        return subscribeInstance.id;
      },
      unsubscribe: function( subscriptionId) { }
    },
    equipment: {
      // Not used in current tests. Getting points form parentScope.pointsPromise below.
      getPoints: function (collapsePointsToArray, limit, startAfterId, ascending) {
        getPointsDefer = $q.defer()
        return getPointsDefer.promise
      }
    }
  }


  beforeEach(module('greenbus.views.authentication'));
  beforeEach(module('greenbus.views.rest'));
  beforeEach(module('greenbus.views.equipment'));
  beforeEach(module('greenbus.views.subscription'));
  beforeEach(module('greenbus.views.request'));
  beforeEach(module('greenbus.views.selection'));
  beforeEach(module('greenbus.views.point'));
  beforeEach(module('greenbus.views.measurement'));
  beforeEach(module('greenbus.views.template/measurement/measurements.html'));
  beforeEach(module('greenbus.views.template/selection/selectAll.html'));
  beforeEach(module('greenbus.views.template/pager/pager.html'));

  beforeEach(function () {
    subscribeInstance = {}
    spyOn( mocks.subscription, 'subscribe').and.callThrough()
    spyOn( mocks.subscription, 'unsubscribe').and.callThrough()

    _websocketFactory = {}
    module( function ($provide) {
      $provide.value('websocketFactory', _websocketFactory);
      $provide.value('authentication', mocks.authentication);
      $provide.value('subscription', mocks.subscription);
      $provide.value('equipment', mocks.equipment);
      $provide.value('request', mocks.request);
      $provide.value('navigation', {});
      //$provide.value('$routeParams', {}); // no $routeParams.navId, depth, or equipmentIds
      $provide.value('$stateParams', {
        microgridId: 'abc',
        navigationElement: {
          id: equipmentId,
          name: 'name',      // full entity name
          shortName: 'shortName',
          equipmentChildren: []
        },
      });
    });

  });

  beforeEach( inject(function( $injector) {
    $httpBackend = $injector.get('$httpBackend')
    $httpBackend.whenGET( '/models/1/points?equipmentIds=' + equipmentId + '&depth=9999').respond( points)
    $httpBackend.whenPOST( '/models/1/points/commands').respond( commands)
  }))


  beforeEach(inject(function ($rootScope, _$compile_, _$q_) {

    parentScope = $rootScope.$new();
    $compile = _$compile_;
    $q = _$q_

    // Mock equipment wrapper pointsPromise
    pointsDefer = $q.defer()
    parentScope.pointsPromise = pointsDefer.promise

    element = angular.element( '<gb-measurements points-promise="pointsPromise" page-size="5"></gb-measurements>');
    $compile(element)(parentScope);
    parentScope.$digest();
    // No isolateScope() until after parentScope.$digest(). Possibly because of points-promise parameter?
    scope = element.isolateScope() || element.scope()
  }));


  function findPointTrs() {
    return element.find('.gb-point');
  }

  function findTd( pointRow, tdIndex) {
    return pointRow.find('td').eq(tdIndex);
  }

  function findCheckboxDivForOneTr( pointTr) {
    var td = pointTr.find('td').eq(0)
    return td.find('div').eq(0);
  }

  function findCheckboxDivsForAllPointTrs( pointTrs) {
    var checkboxDivs = []
    for( var i = 0; i < points.length; i++)
      checkboxDivs[i] = findCheckboxDivForOneTr( pointTrs.eq(i))
    return checkboxDivs
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

  function findPagerButtons() {
    var pager = element.find('.gb-pager')
    var buttons = pager.find('button')
    return {
      count: buttons.length,
      first: buttons.eq(0),
      previous: buttons.eq(1),
      next: buttons.eq(2)
    }
  }


  it('should create multiple sorted points', inject( function () {
    pointsDefer.resolve( {data: points})
    $httpBackend.flush();
    parentScope.$digest();

    var foundPointTrs = findPointTrs()
    expect( foundPointTrs.length).toEqual(5);

    expect( scope.pointsFiltered[0].name).toBe( points[1].name)
    expect( scope.pointsFiltered[1].name).toBe( points[0].name)
    expect( scope.pointsFiltered[2].name).toBe( points[2].name)
    expect( scope.pointsFiltered[3].name).toBe( points[3].name)
    expect( scope.pointsFiltered[4].name).toBe( points[4].name)

    expect( scope.pointsFiltered[0].commands).toBeDefined()
    expect( scope.pointsFiltered[1].commands).toBeDefined()
    expect( scope.pointsFiltered[2].commands).not.toBeDefined()
    expect( scope.pointsFiltered[3].commands).not.toBeDefined()
    expect( scope.pointsFiltered[4].commands).not.toBeDefined()
  }));

  it('should select/deselect all points when selectAll is clicked', inject( function () {
    pointsDefer.resolve( {data: points})
    $httpBackend.flush();
    parentScope.$digest();

    var selectAll = element.find('*[ng-click="selectAll()"]')
    expect(selectAll).toBeDefined()

    selectAll.trigger('click');
    expect(scope.selectAllState).toBe(1);
    expect( scope.pointsFiltered[0]._checked).toBe(1)
    expect( scope.pointsFiltered[1]._checked).toBe(1)
    expect( scope.pointsFiltered[2]._checked).toBe(1)
    expect( scope.pointsFiltered[3]._checked).toBe(1)
    expect( scope.pointsFiltered[4]._checked).toBe(1)

    selectAll.trigger('click');
    expect(scope.selectAllState).toBe(0);
    expect( scope.pointsFiltered[0]._checked).toBe(0)
    expect( scope.pointsFiltered[1]._checked).toBe(0)
    expect( scope.pointsFiltered[2]._checked).toBe(0)
    expect( scope.pointsFiltered[3]._checked).toBe(0)
    expect( scope.pointsFiltered[4]._checked).toBe(0)
  }));

  it('should display selected buttons when some points are selected', inject( function () {
    pointsDefer.resolve( {data: points})
    $httpBackend.flush()
    parentScope.$digest()

    var foundPointTrs = findPointTrs(),
        selectAll = element.find('*[ng-click="selectAll()"]'),
        addSelectedPointsButton = element.find('*[ng-click="chartAddSelectedPoints()"]')

    expect(addSelectedPointsButton).toHaveClass('ng-hide')

    selectAll.trigger('click')
    expect(scope.selectAllState).toBe(1)
    expect(addSelectedPointsButton).not.toHaveClass('ng-hide')

    selectAll.trigger('click')
    expect(scope.selectAllState).toBe(0);
    expect(addSelectedPointsButton).toHaveClass('ng-hide')

    // Select one individually
    var checkboxes = findCheckboxDivsForAllPointTrs( foundPointTrs)
    checkboxes[0].trigger('click')
    expect(scope.selectAllState).toBe(2);
    expect(addSelectedPointsButton).not.toHaveClass('ng-hide')

    // Select the rest
    checkboxes[1].trigger('click')
    checkboxes[2].trigger('click')
    checkboxes[3].trigger('click')
    expect(scope.selectAllState).toBe(2);
    expect(addSelectedPointsButton).not.toHaveClass('ng-hide')
    checkboxes[4].trigger('click')
    expect(scope.selectAllState).toBe(1);
    expect(addSelectedPointsButton).not.toHaveClass('ng-hide')

    // Deselect one individually
    checkboxes[4].trigger('click')
    expect(scope.selectAllState).toBe(2);
    expect(addSelectedPointsButton).not.toHaveClass('ng-hide')
    // Deselect all
    checkboxes[3].trigger('click')
    checkboxes[2].trigger('click')
    checkboxes[1].trigger('click')
    expect(scope.selectAllState).toBe(2);
    expect(addSelectedPointsButton).not.toHaveClass('ng-hide')
    checkboxes[0].trigger('click')
    expect(scope.selectAllState).toBe(0);
    expect(addSelectedPointsButton).toHaveClass('ng-hide')

  }));

  it('should show alert when no points found', inject( function () {
    var foundPointTrs, foundAlerts

    pointsDefer.resolve( {data: []})
    scope.$digest()
    //$httpBackend.flush(); No points, so no requests to flush.
    parentScope.$digest();

    foundPointTrs = findPointTrs()
    expect( foundPointTrs.length).toEqual(0);

    foundAlerts = findAlerts()
    expect( foundAlerts.length).toBe( 1)
    expect( findAlertText( foundAlerts, 0)).toBe( 'No points found.')
  }));

  it('should show alert when pointsPromise resolves with error', inject( function () {
    var foundPointTrs, foundAlerts,
        someStatusText = 'Some status message.'

    pointsDefer.reject( {statusText: someStatusText})
    scope.$digest()
    //$httpBackend.flush(); No points, so no requests to flush.
    parentScope.$digest();

    foundPointTrs = findPointTrs()
    expect( foundPointTrs.length).toEqual(0);

    foundAlerts = findAlerts()
    expect( foundAlerts.length).toBe( 1)
    expect( findAlertText( foundAlerts, 0)).toBe( someStatusText)
  }));

  it('should show alert when measurement subscription sends an error message', inject( function () {
    var foundPointTrs, foundAlerts,
        someStatusText = 'Some status message.',
        errorMessage = 'Some error message.',
        message = {
          error: errorMessage
        }


    pointsDefer.resolve( {data: points})
    scope.$digest()
    $httpBackend.flush();
    parentScope.$digest();

    foundPointTrs = findPointTrs()
    expect( foundPointTrs.length).toEqual(5);

    foundAlerts = findAlerts()
    expect( foundAlerts.length).toBe( 0)

    subscribeInstance.onError( errorMessage, message)
    scope.$digest();

    foundAlerts = findAlerts()
    expect( foundAlerts.length).toBe( 1)
    expect( findAlertText( foundAlerts, 0)).toBe( errorMessage)

    closeButton = findAlertCloseButton( foundAlerts, 0)
    closeButton.trigger( 'click')
    foundAlerts = findAlerts()
    expect( foundAlerts.length).toEqual(0)

  }));


  it('should subscribe to points', inject( function (subscription) {
    var subscriptionId

    pointsDefer.resolve( {data: points})
    $httpBackend.flush();
    parentScope.$digest();

    expect( subscription.subscribe.calls.count()).toEqual(1)
    expect( subscription.unsubscribe).not.toHaveBeenCalled()
    subscription.subscribe.calls.reset()
    subscription.unsubscribe.calls.reset()
    subscriptionId = subscribeInstance.id

    var button = findPagerButtons()

    button.next.trigger('click')
    getPointsDefer.resolve( {data: points2})
    scope.$digest()
    expect( subscription.unsubscribe).toHaveBeenCalledWith(subscriptionId)
    expect( subscription.subscribe).toHaveBeenCalled()
    subscription.subscribe.calls.reset()
    subscription.unsubscribe.calls.reset()
    subscriptionId = subscribeInstance.id

    button.previous.trigger('click')
    getPointsDefer.resolve( {data: points2})
    scope.$digest()
    expect( subscription.unsubscribe).toHaveBeenCalledWith(subscriptionId)
    expect( subscription.subscribe).toHaveBeenCalled()
    subscription.subscribe.calls.reset()
    subscription.unsubscribe.calls.reset()
    subscriptionId = subscribeInstance.id

    button.next.trigger('click')
    expect( subscription.unsubscribe).toHaveBeenCalledWith(subscriptionId)
    expect( subscription.subscribe).toHaveBeenCalled()
    subscription.subscribe.calls.reset()
    subscription.unsubscribe.calls.reset()
    subscriptionId = subscribeInstance.id

    button.first.trigger('click')
    expect( subscription.unsubscribe).toHaveBeenCalledWith(subscriptionId)
    expect( subscription.subscribe).toHaveBeenCalled()

  }));


//  it('should handle subscribe messages that are updates (single alarm)', inject( function () {
//    subscribeInstance.onMessage( subscribeInstance.id, 'measurements', measurements[0])
//    parentScope.$digest();
//    subscribeInstance.onMessage( subscribeInstance.id, 'measurements', angular.extend( {}, measurements[0]))
//    parentScope.$digest();
//    var foundPoints = findPoints()
//    expect( foundPoints.length).toEqual(1);
//  }));
//
//  it('should handle subscribe messages that are updates (array of measurements)', inject( function () {
//    subscribeInstance.onMessage( subscribeInstance.id, 'measurements', measurements)
//    parentScope.$digest();
//
//    var updates = measurements.map( function( a) { return copyAlarmWithState( a, 'UNACK_SILENT')})
//    subscribeInstance.onMessage( subscribeInstance.id, 'measurements', updates)
//    parentScope.$digest();
//    var foundPoints = findPoints()
//    expect( foundPoints.length).toEqual(3);
//  }));
//

});

describe( 'gb-measurements setPoint tests', function() {
  it('should show setPoint icon')
  it('should setPoint controls when setPoint icon is clicked')
  it('should open setPoint with unselected')
  it('should select setPoint successfully')
  it('should select setPoint forbidden')
  it('should select setPoint already selected')
})
