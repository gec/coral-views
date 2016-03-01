describe('gb-points-table', function () {
  var scope, $compile, _equipment, pointsDefer, getCurrentPointsDefer;
  var element,
      entityId = 'entity-1',
      pointCount = 3,
      pointTypes = [ 'STATUS', 'ANALOG', 'COUNTER']
      points = []


  for( var index = 0; index < pointCount; index++) {
    points.push( {
      name: 'point.'+index,
      id: 'id-' + index,
      pointType:  pointTypes[ index % pointTypes.length],
      types: [ 'Point', 'Type' + index],
      unit: 'unit' + index,
      endpoint: 'endpoint-id-' + index
    })
  }

  beforeEach(module('greenbus.views.measurement'));  // for filters: pointTypeImage, pointTypeText
  beforeEach(module('greenbus.views.equipment'));
  beforeEach(module('greenbus.views.point'));
  beforeEach(module('greenbus.views.template/point/pointsTable.html'));

  beforeEach(function() {

    _equipment = {
      getCurrentPoints: function (collapsePointsToArray) {
        getCurrentPointsDefer = $q.defer()
        return getCurrentPointsDefer.promise
      }
    }

    spyOn( _equipment, 'getCurrentPoints').and.callThrough()

    module( function ($provide) {
      $provide.value('equipment', _equipment);
      $provide.value('$stateParams', {
        microgridId: entityId,
        navigationElement: {
          id: entityId,
          name: 'name1',      // full entity name
          shortName: 'shortName1',
          equipmentChildren: []
        },
      });
  
    });
  
  });
  
  beforeEach(inject(function ($rootScope, _$compile_, $q) {
  
    parentScope = $rootScope;
    $compile = _$compile_;

    pointsDefer = $q.defer()
    parentScope.pointsPromise = pointsDefer.promise //$q.when( {data: points})

    element = angular.element( '<gb-points-table  points-promise="pointsPromise"></gb-points-table>');
    $compile(element)(parentScope);
    parentScope.$digest();
    // No isolateScope() until after parentScope.$digest(). Possibly because of points-promise parameter?
    scope = element.isolateScope() || element.scope()
  }));
  
  
  function findPointRows() {
    return element.find('.gb-point');
  }
  
  function findTd( point, tdIndex) {
    return point.find('td').eq(tdIndex);
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


  it('should get points from points-promise', inject( function(equipment) {
    var foundPoints, foundAlerts

    foundPoints = findPointRows()
    expect( foundPoints.length).toEqual(0);
    // Using pointsDefer instead of equipment.geCurrentPoints
    expect( equipment.getCurrentPoints.calls.count()).toBe(0)

    pointsDefer.resolve( {data: points})
    scope.$digest()

    foundPoints = findPointRows()
    foundAlerts = findAlerts()
    expect( foundPoints.length).toEqual(3);
    expect( foundAlerts.length).toEqual(0);
  }))
  
  it('should fail on points-promise and show alert', inject( function(equipment) {
    var foundPoints, foundAlerts, closeButton,
        someStatusText = 'Some status message.'

    foundPoints = findPointRows()
    expect( foundPoints.length).toEqual(0);
    // Using pointsDefer instead of equipment.geCurrentPoints
    expect( equipment.getCurrentPoints.calls.count()).toBe(0)

    pointsDefer.reject( {statusText: someStatusText})
    scope.$digest()

    foundPoints = findPointRows()
    foundAlerts = findAlerts()
    expect( foundPoints.length).toEqual(0);
    expect( foundAlerts.length).toEqual(1);
    expect( findAlertText( foundAlerts, 0)).toBe( someStatusText)

    closeButton = findAlertCloseButton( foundAlerts, 0)
    closeButton.trigger( 'click')
    foundAlerts = findAlerts()
    expect( foundAlerts.length).toEqual(0)
  }))

});
