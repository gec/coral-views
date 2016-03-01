describe('gbCharts', function () {
  var parentScope, scope, $compile, $httpBackend,
      element, svgOneMeasurement, svgOneEquipmentSymbol,
      subscriptions = [],
      measurements = [],
      REQUEST_ADD_CHART = 'gb-chart.addChart',
      historyConstraints = {
        time: 1000 * 60 * 60 * 2, // 2 hours
        size: 60 * 60 * 2 * 10, // 2 hours of 10 measurements per second data
        throttling: 5000
      }


  var equipmentId = 'equipmentId',
      points = [
        {'name': 'MG1.Device2.kW_tot', 'id': 'Device2.kW_tot', 'pointType': 'ANALOG', 'types': ['Imported', 'DemandPower', 'Point'], 'unit': 'kW', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6' },
        {'name': 'MG1.Device1.Status', 'id': 'Device1.Status', 'pointType': 'STATUS', 'types': ['UtilityBreakerStatus', 'BreakerStatus', 'Point'], 'unit': 'status', 'endpoint': 'someEndpointUuid' },
        {'name': 'MG1.Device0.Status', 'id': 'Device0.Status', 'pointType': 'STATUS', 'types': ['Imported', 'CustomerBreakerStatus', 'BreakerStatus', 'Point'], 'unit': 'status', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
        {'name': 'MG1.Device3.Load', 'id': 'Device3.Load', 'pointType': 'ANALOG', 'types': ['Imported', 'LoadPower', 'Point'], 'unit': 'kW', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
        {'name': 'MG1.Device4.DR', 'id': 'Device4.DR', 'pointType': 'COUNTER', 'types': ['Point', 'DemandResponseStage', 'Imported'], 'unit': 'Stage', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'}
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

  svgOneMeasurement  =
    '<?xml version="1.0"?>' +
    '<svg  xmlns="http://www.w3.org/2000/svg" xmlns:tgs="http://www.totalgrid.org" xmlns:xlink="http://www.w3.org/1999/xlink" style="background-color:black;" preserveAspectRatio="xMidYMid meet" viewBox="0 0 1500.0 587.5">' +
      '<g id="svgContent">' +
        '<g tgs:schematic-type="point" name="' + points[0].name + '" tgs:point-name="' + points[0].name + '" id="' + points[0].name + '">' +
          '<use class="quality-display" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#quality_invalid" y="78" x="257" id="svg_550"></use>' +
          '<text class="data-label" x="277" y="92" id="svg_551">48 kW</text>' +
        '</g>' +
      '</g>' +
    '</svg>'
  svgOneMeasurementMeasurementDecimals3  =
    '<?xml version="1.0"?>' +
    '<svg  xmlns="http://www.w3.org/2000/svg" xmlns:tgs="http://www.totalgrid.org" xmlns:xlink="http://www.w3.org/1999/xlink" tgs:measurement-decimals="3" style="background-color:black;" preserveAspectRatio="xMidYMid meet" viewBox="0 0 1500.0 587.5">' +
      '<g id="svgContent">' +
        '<g tgs:schematic-type="point" name="' + points[0].name + '" tgs:point-name="' + points[0].name + '" id="' + points[0].name + '">' +
          '<use class="quality-display" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#quality_invalid" y="78" x="257" id="svg_550"></use>' +
          '<text class="data-label" x="277" y="92" id="svg_551">48 kW</text>' +
        '</g>' +
      '</g>' +
    '</svg>'
  svgOneEquipmentSymbol =
    '<?xml version="1.0"?>' +
    '<svg  xmlns="http://www.w3.org/2000/svg" xmlns:tgs="http://www.totalgrid.org" xmlns:xlink="http://www.w3.org/1999/xlink" style="background-color:black;" preserveAspectRatio="xMidYMid meet" viewBox="0 0 1500.0 587.5">' +
      '<g id="svgContent">' +
        '<svg preserveAspectRatio="xMaxYMax" class="symbol" tgs:schematic-type="equipment-symbol" id="svg_619" x="484" y="404" tgs:point-name="' + points[1].name + '" tgs:symbol-type="circuitbreaker">' +
          '<g tgs:state="OPEN" display="none" id="svg_622">' +
          ' <rect x="2" y="2" width="30" height="30" fill="#00FF00" id="svg_623"/>' +
          '</g>' +
          '<g tgs:state="CLOSED" id="svg_620">' +
            '<rect x="2" y="2" width="30" height="30" fill="#A40000" id="svg_621"/>' +
          '</g>' +
        '</svg>' +
      '</g>' +
    '</svg>'


  function makeSubscriptionId( request, idCounter) {
    return 'subscription.' + request.name + '.' + idCounter;
  }

  var authToken = 'some auth token'
  var mock = {
    authentication: {
      isLoggedIn:   function() { return true },
      getAuthToken: function() { return authToken },
      getHttpHeaders: function() { return {'Authorization': authToken} }
    },
    //subscription: {}, // defined in beforeEach
    measurement: {}, // defined in beforeEach
    request: {
      push: jasmine.createSpy('requestPush')
    }
  }

  function indexOfSubscriber( subscribers, subscriber) {
    var s
    for(var i = 0; i < subscribers.length; i++ ) {
      s = subscribers[i]
      if(s.subscriber === subscriber && s.point === point ) {
        return i
      }
    }
    return -1
  }
  function deletePointSubscriber( subscriptions, point, subscriber) {
    var s,
        i = subscriptions.length
    while( i-- >= 0 ) {
      s = subscriptions[i]
      if(s.subscriber === subscriber && s.point === point ) {
        subscriptions.splice(i, 1);
      }
    }
  }

  function MeasurementHistoryMock( point) {
    this.point = point
    this.subscribers = []
    this.measurements = d3.trait.murts.dataStore()
      .x(MeasurementHistory_murtsAccess.x)
      .y(MeasurementHistory_murtsAccess.y)
    console.log( '========================= MeasurementHistoryMock constructor ' + point.id)
  }
  MeasurementHistoryMock.prototype.subscribe = function( subscriberScope, constraints, subscriber, onMessage, onError) {
    console.log( '========================= MeasurementHistoryMock subscribe 1 ' + this.point.id)
    var now = Date.now(),
        json = {
          name: 'SubscribeToMeasurementHistory',
          'pointId':  this.point.id,
          'timeFrom': now - constraints.time,
          'limit':    constraints.size
        }
    console.log( '========================= MeasurementHistoryMock subscribe 2 ' + this.point.id)
    this.subscribers[this.subscribers.length] = {
      id: makeSubscriptionId(json, 1),  // TODO: need something other than 1 to handle tests of multiple subscriptions
      scope: subscriberScope,
      constraints: constraints,
      subscriber: subscriber,  // the chart
      onMessage: onMessage,
      onError: onError,
    }
    return this.measurements
  }
  MeasurementHistoryMock.prototype.unsubscribe = function( subscriber) {
    this.removeSubscriber( subscriber)
    //TODO: ? check for no subscribers and reset MERTS data store?
  }
  MeasurementHistoryMock.prototype.removeSubscriber = function( subscriber) {
    var s,
        i = this.subscribers.length

    while( i > 0 ) {
      i--
      s = this.subscribers[i]
      if( s.subscriber === subscriber ) {
        this.subscribers.splice(i, 1);
      }
    }
  }

  function getMeasurementHistory( point) {
    var measurementHistory = mock.measurementHistoryMap[ point.id]
    if( measurementHistory === undefined) {
      console.log( '========================= getMeasurementHistory new')
      measurementHistory = new MeasurementHistoryMock( point)
      mock.measurementHistoryMap[ point.id] = measurementHistory
    }
    return measurementHistory
  }

  beforeEach(module('greenbus.views.request'));
  beforeEach(module('greenbus.views.rest'));
  beforeEach(module('greenbus.views.measurement'));
  beforeEach(module('greenbus.views.chart'));
  beforeEach(module('greenbus.views.template/chart/chart.html'));
  beforeEach(module('greenbus.views.template/chart/charts.html'));

  beforeEach(function () {
    subscriptions = []

    mock.measurementHistoryMap = {}

    mock.measurement = {
      subscribeWithHistory: function(subscriberScope, point, constraints, subscriber, onMessage, onError) {
        console.log( '========================= mock.measurement.subscribeWithHistory 1')
        var measurementHistory = getMeasurementHistory( point)
        console.log( '========================= mock.measurement.subscribeWithHistory 2')
        return measurementHistory.subscribe( subscriberScope, constraints, subscriber, onMessage, onError)
      },
      unsubscribeWithHistory: function( point, subscriber ) {
        var measurementHistory = mock.measurementHistoryMap[ point.id]
        measurementHistory.unsubscribe( subscriber)
      }
    }

    //mock.subscription = {
    //  subscribe: function(request, subscriberScope, onMessage, onError) {
    //     var subscription = {
    //      id: makeSubscriptionId(request, 1),
    //      request: request,
    //      scope: subscriberScope,
    //      onMessage: onMessage,
    //      onError: onError
    //    }
    //    subscriptions[subscriptions.length] = subscription
    //    return subscription.id
    //  }
    //}

    module( function ($provide) {
      $provide.value('authentication', mock.authentication);
      $provide.value('measurement', mock.measurement);
      //$provide.value('subscription', mock.subscription);
      $provide.value('navigation', {});
      //$provide.value('$routeParams', {}); // no $routeParams.navId, depth, or equipmentIds
      $provide.value('$stateParams', {
        microgridId: 'abc',
        id: equipmentId,
        navigationElement: {
          id: equipmentId,
          name: 'name',      // full entity name
          shortName: 'shortName',
          equipmentChildren: []
        }
      })
    })

  });

  beforeEach( inject(function( $injector) {
    $httpBackend = $injector.get('$httpBackend')
    //$httpBackend.whenGET( '/models/1/points?pnames=' + points[0].name).respond( [
    //  angular.extend( {} , points[0])
    //  //{'name': 'MG1.Device2.kW_tot', 'id': 'Device2.kW_tot', 'pointType': 'ANALOG', 'types': ['Imported', 'DemandPower', 'Point'], 'unit': 'kW', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6' }
    //])
    //$httpBackend.whenGET( '/models/1/points?pnames=' + points[1].name).respond( [
    //  angular.extend( {} , points[1])
    //])
    //$httpBackend.whenPOST( '/models/1/points/commands', [points[0].id]).respond( [
    //  // TODO: some commands to return.
    //])
    //$httpBackend.whenPOST( '/models/1/points/commands', [points[1].id]).respond( [
    //  // TODO: some commands to return.
    //])
  }))


  beforeEach(inject(function ($rootScope, _$compile_, $q) {

    parentScope = $rootScope.$new();
    $compile = _$compile_;

    // Need outer div to contain siblings; otherwise 'element' is a comment and the first chart is a sibling.
    element = angular.element( '<div style="width:800px;height:200px;"><gb-charts></gb-charts></div>');
    $compile(element)(parentScope);
    $('body').height( 500)
    $('body').append( element) // append to body so offsetHeight and width are available d3-traits chart base.

    //parentScope.$digest();  This deletes the element.scope() for some reason!
    scope = element.isolateScope() || element.scope()
    if( scope === undefined)
      console.error( 'chart.spec.js $compile(element) scope === undefined')
    scope.$digest()

    //$('body').append('<link rel="stylesheet" href="/base/assets/css/greenbus-views.css" />')
  }));


  function findChartDivs() {
    return element.find( '.gb-win')
  }
  function findChartDiv( index) {
    return element.find( '.gb-win').eq(index)
  }
  function findLegends( chartDiv) {
    return chartDiv.find('li.gb-legend');
  }
  function findLegendText( legends, index) {
    return legends.eq(index).find('span.gb-legend-text').eq(0).text();
  }
  function findLegendRemoveButton( legends, index) {
    return legends.eq(index).find('a.gb-remove').eq(0);
  }
  function findLegendRemoveIcon( legends, index) {
    return legends.eq(index).find('a.gb-remove').find('span').eq(0);
  }
  function findLegendError( legends, index) {
    return legends.eq(index).find('i.gb-icon-error').eq(0);
  }


  it('should subscribe to one point, build legend, then remove point', inject( function ( $rootScope, request) {
    var mh, subscriber, charts, chartDiv, legends, legendText, removeButton, removeIcon, legendError,
        point = points[0]

    request.push(REQUEST_ADD_CHART, [point])
    scope.$digest()
    mh = getMeasurementHistory( point)
    expect( mh.subscribers.length).toBe(1)
    subscriber = mh.subscribers[0]

    charts = findChartDivs()
    expect(charts.length).toBe(1)
    chartDiv = findChartDiv(0)
    legends = findLegends( chartDiv)
    legendText = findLegendText( legends, 0)
    expect( legendText).toEqual( point.name)
    removeIcon = findLegendRemoveIcon( legends, 0)
    expect( removeIcon).toHaveClass( 'glyphicon-remove')
    legendError = findLegendError( legends, 0)
    expect( legendError).toHaveClass( 'ng-hide')

    removeButton = findLegendRemoveButton( legends, 0)
    removeButton.trigger( 'click')
    expect( mh.subscribers.length).toBe(0)

  }));

  it('should subscribe to one point, receive error message and show error icon with hover message', inject( function ( $rootScope, request) {
    var mh, subscriber, chartDiv, legends, legendError,
        point = points[0],
        errorMessage = 'Some error message.',
        message = {
          error: errorMessage
        }

    request.push(REQUEST_ADD_CHART, [point])
    scope.$digest()
    mh = getMeasurementHistory( point)
    expect( mh.subscribers.length).toBe(1)
    subscriber = mh.subscribers[0]

    chartDiv = findChartDiv(0)
    legends = findLegends( chartDiv)
    legendError = findLegendError( legends, 0)
    expect( legendError).toHaveClass( 'ng-hide')

    subscriber.onError( errorMessage, message)
    expect( legendError).not.toHaveClass( 'ng-hide')
    expect( legendError.attr('title')).toBe( errorMessage)

  }));



});

describe( 'gbCharts tests TODO', function() {
  it('should add multiple points')
  it('should open multiple charts')
  it('should exercise drag-n-drop features')
})
