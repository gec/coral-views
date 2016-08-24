describe('gb-points-table', function () {
  var scope, $compile, _equipment, _$q, pointsDefer, getPointsDefer;
  var element,
      entityId = 'entity-1',
      pointCount = 3,
      pointTypes = [ 'STATUS', 'ANALOG', 'COUNTER'],
      points = [],
      points2 = []


  for( var index = 0; index < pointCount; index++) {
    points.push( {
      name: 'point.'+index,
      id: 'id-' + index,
      pointType:  pointTypes[ index % pointTypes.length],
      types: [ 'Point', 'Type' + index],
      unit: 'unit' + index,
      endpoint: 'endpoint-id-' + index
    })
    var index2 = index + pointCount
    points2.push( {
      name: 'point.'+index2,
      id: 'id-' + index2,
      pointType:  pointTypes[ index2 % pointTypes.length],
      types: [ 'Point', 'Type' + index2],
      unit: 'unit' + index2,
      endpoint: 'endpoint-id-' + index2
    })
  }

  beforeEach(module('greenbus.views.measurement'))  // for filters: pointTypeImage, pointTypeText
  beforeEach(module('greenbus.views.equipment'))
  beforeEach(module('greenbus.views.pager'))
  beforeEach(module('greenbus.views.template/pager/pager.html'))
  beforeEach(module('greenbus.views.point'))
  beforeEach(module('greenbus.views.template/point/pointsTable.html'))

  beforeEach(function() {

    _equipment = {
      // Not used in current tests. Getting points form parentScope.pointsPromise below.
      getPoints: function (collapsePointsToArray, limit, startAfterId, ascending) {
        getPointsDefer = _$q.defer()
        return getPointsDefer.promise
      }
    }

    spyOn( _equipment, 'getPoints').and.callThrough()

    module( function ($provide) {
      $provide.value('equipment', _equipment)
      $provide.value('$stateParams', {
        microgridId: entityId,
        navigationElement: {
          id: entityId,
          name: 'name1',      // full entity name
          shortName: 'shortName1',
          equipmentChildren: []
        },
      })
  
    })
  
  });
  
  beforeEach(inject(function ($rootScope, _$compile_, $q) {
  
    parentScope = $rootScope
    $compile = _$compile_
    _$q = $q

    pointsDefer = $q.defer()
    parentScope.pointsPromise = pointsDefer.promise

    element = angular.element( '<gb-points-table  points-promise="pointsPromise" page-size="3"></gb-points-table>');
    $compile(element)(parentScope)
    parentScope.$digest()
    // No isolateScope() until after parentScope.$digest(). Possibly because of points-promise parameter?
    scope = element.isolateScope() || element.scope()
  }));
  
  
  function findPointRows() {
    return element.find('.gb-point')
  }
  
  function findTd( point, tdIndex) {
    return point.find('td').eq(tdIndex)
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


  it('should get points from points-promise', inject( function(equipment) {
    var foundPoints, foundAlerts

    foundPoints = findPointRows()
    expect( foundPoints.length).toEqual(0)
    // Using pointsDefer instead of equipment.geCurrentPoints
    expect( equipment.getPoints.calls.count()).toBe(0)

    pointsDefer.resolve( {data: points})
    scope.$digest()

    foundPoints = findPointRows()
    foundAlerts = findAlerts()
    expect( foundPoints.length).toEqual(3)
    expect( foundAlerts.length).toEqual(0)
  }))
  
  it('should fail on points-promise and show alert', inject( function(equipment) {
    var foundPoints, foundAlerts, closeButton,
        someStatusText = 'Some status message.'

    foundPoints = findPointRows()
    expect( foundPoints.length).toEqual(0)
    // Using pointsDefer instead of equipment.geCurrentPoints
    expect( equipment.getPoints.calls.count()).toBe(0)

    pointsDefer.reject( {statusText: someStatusText})
    scope.$digest()

    foundPoints = findPointRows()
    foundAlerts = findAlerts()
    expect( foundPoints.length).toEqual(0)
    expect( foundAlerts.length).toEqual(1)
    expect( findAlertText( foundAlerts, 0)).toBe( someStatusText)

    closeButton = findAlertCloseButton( foundAlerts, 0)
    closeButton.trigger( 'click')
    foundAlerts = findAlerts()
    expect( foundAlerts.length).toEqual(0)
  }))

  it('should handle pageNext, then pagePrevious', inject( function(equipment) {
    var foundPoints, point

    // Controller already called equipment.getPoints and received the promise.
    // Fill page one with points.
    pointsDefer.resolve( {data: points})
    scope.$digest()

    var button = findPagerButtons()

    button.next.trigger('click')
    getPointsDefer.resolve( {data: points2})
    scope.$digest()
    foundPoints = findPointRows()
    expect( foundPoints.length).toEqual(3)

    point = foundPoints.eq(0)
    expect( findTd( point, 0).text()).toEqual( 'point.3')

    // Previous should come from cache.
    button.previous.trigger('click')
    foundPoints = findPointRows()
    expect( foundPoints.length).toEqual(3)
    point = foundPoints.eq(0)
    expect( findTd( point, 0).text()).toEqual( 'point.0')

  }))


});
