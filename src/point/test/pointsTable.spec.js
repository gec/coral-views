describe('gb-points-table', function () {
  var scope, $compile, _equipment;
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
        return {
          then: function( f1, f2) {
            f1( {data: points})
          }
        }
      }
    }

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

    parentScope.pointsPromise = $q.when( {data: points})

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
  
  it('should start with 0 points', inject( function () {
    var foundPoints = findPointRows()
    expect( foundPoints.length).toEqual(0);
  }));
  
  //it('should create one point', inject( function () {
  //  subscribeInstance.onSuccess( subscribeInstance.id, 'point', points[0])
  //  scope.$digest();
  //
  //  var foundPoints = findPointRows()
  //  expect( foundPoints.length).toEqual(1);
  //
  //  var point = foundPoints.eq(0)
  //  expect( findTd( point, 0).text()).toBe( points[0].key);
  //  expect( findTd( point, 1).text()).toBe(points[0].value.toString());
  //}));
  //
  //it('should create multiple points', inject( function () {
  //  subscribeInstance.onSuccess( subscribeInstance.id, 'points', points)
  //  scope.$digest();
  //  var foundPoints = findPointRows()
  //  expect( foundPoints.length).toEqual(3);
  //
  //}));

});
