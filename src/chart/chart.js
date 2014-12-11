/**
 * Copyright 2014-2015 Green Energy Corp.
 *
 * Licensed to Green Energy Corp (www.greenenergycorp.com) under one or more
 * contributor license agreements. See the NOTICE file distributed with this
 * work for additional information regarding copyright ownership. Green Energy
 * Corp licenses this file to you under the Apache License, Version 2.0 (the
 * 'License'); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 * Author: Flint O'Brien
 */

angular.module('greenbus.views.chart', ['greenbus.views.measurement', 'greenbus.views.rest', 'greenbus.views.request']).

  /**
   * Control multiple charts. This is the controller for the charts at the bottom of the application window.
   *
   * Any controller that would like a new chart makes a request to this controller
   * via request.push( 'gb-chart.addChart', points).
   *
   */
  controller( 'gbChartsController', [ '$scope', '$window', 'measurement', 'rest', 'request',
    function( $scope, $window, measurement, rest, request) {

      var REQUEST_ADD_CHART = 'gb-chart.addChart',
          historyConstraints ={
            time: 1000 * 60 * 60 * 1, // 1 hours
            size: 60 * 60 * 1, // 1 hours of 1 second data
            throttling: 5000
          }

      $scope.charts = []


      function subscribeToMeasurementHistory( chart, point ) {
        var notify = function () { chart.update( 'trend' ) }

        point.measurements = measurement.subscribeWithHistory( $scope, point, historyConstraints, chart, notify )
      }

      function unsubscribeToMeasurementHistory( chart, point ) {
        measurement.unsubscribeWithHistory( point, chart )
      }

      $scope.onDropPoint = function ( pointId, chart ) {
        console.log( 'onDropPoint chart=' + chart.name + ' pointId=' + pointId )
        if( ! chart.pointExists( pointId)) {
          var url = '/models/1/points/' + pointId
          rest.get( url, null, $scope, function(point) {
            chart.addPoint( point)
            subscribeToMeasurementHistory( chart, point )
          });
        }

      }

      $scope.onDragSuccess = function ( id, chart ) {
        console.log( 'onDragSuccess chart=' + chart.name + ' id=' + id )

        $scope.$apply( function () {
          var point = chart.getPointByid( id)
          $scope.removePoint( chart, point, true )
        } )
      }

      $scope.removePoint = function ( chart, point, keepSubscription ) {

        chart.removePoint( point)
        // if( ! keepSubscription)
        unsubscribeToMeasurementHistory( chart, point );

        if( chart.isEmpty()) {
          var index = $scope.charts.indexOf( chart )
          $scope.chartRemove( index )
        }

      }

      $scope.chartRemove = function ( index ) {

        var chart = $scope.charts[index]
        chart.points.forEach( function ( point ) {
          unsubscribeToMeasurementHistory( chart, point )
        } )
        $scope.charts.splice( index, 1 )
      }

      // Pop the chart out into a new browser window.
      // The new window can access the intended chart via $window.opener.coralChart;
      $scope.chartPopout = function ( index ) {

        var chart = $scope.charts[index],
            pointIds = chart.points.map( function( p) { return p.id}),
            queryString = rest.queryParameterFromArrayOrString( 'pids', pointIds)
        $window.open(
          '/apps/chart/popout#/?' + queryString,
          '_blank',
          'resizeable,top=100,left=100,height=400,width=600,location=no,toolbar=no'
        )

        $scope.chartRemove( index)
      }


      /**
       * Some controller requested that we add a new chart with the specified points.
       */
      $scope.$on( REQUEST_ADD_CHART, function() {
        var points = request.pop( REQUEST_ADD_CHART);
        while( points) {
          var chart = new GBChart( points),
              i = chart.points.length
          $scope.charts.push( chart )
          while( --i >= 0) {
            subscribeToMeasurementHistory( chart, chart.points[i] )
          }

          // Is there another chart request?
          points = request.pop( REQUEST_ADD_CHART)
        }
      });

    }]).


  /**
   * Controller for a single chart (like inside the pop-out window).
   */
  controller( 'gbChartController', ['$scope', '$timeout', '$window', '$location', 'measurement', 'rest', function( $scope, $timeout, $window, $location, measurement, rest) {
    console.log( 'gbChartController begin scope.id' + $scope.$id + ' ###############################################')
    var queryObject = $location.search()
    if( ! queryObject.hasOwnProperty( 'pids'))
      return

    var pointIds = angular.isArray( queryObject.pids) ? queryObject.pids : [queryObject.pids],
        //chartSource = $window.opener.coralChart,
        documentElement = $window.document.documentElement,
        windowSize = new d3.trait.Size( documentElement.clientWidth, documentElement.clientHeight),
        _chartContainer = null,
        chartSize = new d3.trait.Size(),
        firstPointLoaded = false,
        historyConstraints ={
          time: 1000 * 60 * 60 * 4, // 4 hours
          size: 60 * 60 * 4, // 4 hours of 1 second data
          throttling: 5000
        }


    documentElement.style.overflow = 'hidden';  // firefox, chrome
    $window.document.body.scroll = 'no'; // ie only

    $scope.loading = true
    $scope.chart = new GBChart( [], true, $timeout)  // t: zoomSlider
    console.log( 'gbChartController query params: ' + pointIds)

    var url = '/models/1/points?' + rest.queryParameterFromArrayOrString( 'pids', pointIds)
    rest.get( url, 'points', $scope, function( data) {
      data.forEach( function( point) {
        $scope.chart.addPoint( point)
        subscribeToMeasurementHistory( $scope.chart, point )
      })
      $scope.invalidateWindow()
    })

    function notifyMeasurements() {
      if( !firstPointLoaded) {
        firstPointLoaded = true
        $scope.loading = false
        onResize()
        $scope.$digest()
      }
      //console.log( 'ChartController.notifyMeasurements height:' + chartSize.height + ' chart.invalidate(\'trend\')')
      $scope.chart.invalidate( 'trend')
    }

    function subscribeToMeasurementHistory( chart, point) {
      point.measurements = measurement.subscribeWithHistory( $scope, point, historyConstraints, chart, notifyMeasurements)
    }

    function unsubscribeToMeasurementHistory( chart, point) {
      measurement.unsubscribeWithHistory( point, chart)
    }

    /**
     * A new point was dropped on us. Add it to the chart.
     * @param uuid
     */
    $scope.onDropPoint = function( pointId) {
      console.log( 'dropPoint uuid=' + pointId)
      // Don't add a point that we're already charting.
      if( ! $scope.chart.pointExists( pointId)) {
        var url = '/models/1/points/' + pointId
        rest.get( url, null, $scope, function(point) {
          $scope.chart.addPoint( point)
          subscribeToMeasurementHistory( $scope.chart, point )
        });
        $scope.invalidateWindow()
      }
    }

    /**
     * One of our points was dragged away from us.
     * @param uuid
     * @param chart
     */
    $scope.onDragSuccess = function( uuid, chart) {
      console.log( 'onDragSuccess chart=' + chart.name + ' uuid=' + uuid)

      $scope.$apply(function () {
        var point =  $scope.chart.getPointByid( uuid)
        $scope.removePoint( point, true)
      })
    }

    $scope.removePoint = function( point, keepSubscription) {
      var chart = $scope.chart,
          index = chart.points.indexOf( point);
      chart.removePoint(point);
      if( ! keepSubscription)
        unsubscribeToMeasurementHistory( chart, point);

      if( chart.points.length <= 0) {
        $scope.chartRemove()
      }
      $scope.invalidateWindow()
    }

    $scope.chartRemove = function() {
      $scope.chart.points.forEach( function( point) {
        unsubscribeToMeasurementHistory( $scope.chart, point)
      });
      delete $scope.chart;
    }


    function chartContainer() {
      if( ! _chartContainer) {
        _chartContainer = $window.document.getElementById('chart-container')
      }
      return _chartContainer
    }

    $scope.chartHeight = {
      main: '100px',
      brush: '0px'
    }

    function onResize( event) {
      console.log( 'onResize ---------------------------------------')
      $scope.chart.traits.invalidate( 'resize', 0)
      $scope.chart.brushTraits.invalidate( 'resize', 0)

//      // Need the timeout because we don't get the correct size if we ask right away.
//      $timeout( function() {
//        console.log( 'onResize =======================================')
//
//        windowSize.width = documentElement.clientWidth
//        windowSize.height = documentElement.clientHeight
//        var heightTop, heightBot,
//            offsetTop = chartContainer().offsetTop,
//            offsetLeft = chartContainer().offsetLeft,
//            size = new d3.trait.Size( windowSize.width - offsetLeft, windowSize.height - offsetTop)
//
//        if( size.width !== chartSize.width || size.height !== chartSize.height) {
//          chartSize.width = size.width
//          chartSize.height = size.height
//
//          if( size.height <= 150) {
//            heightTop = size.height
//            heightBot = 0
//          } else {
//            heightBot = Math.floor( size.height * 0.18)
//            if( heightBot < 50)
//              heightBot = 50
//            else if( heightBot > 100)
//              heightBot = 100
//            heightTop = size.height - heightBot
//          }
//
//          $scope.chartHeight.main = heightTop + 'px'
//          $scope.chartHeight.brush = heightBot + 'px'
//          console.log( 'window resize w=' + windowSize.width + ', h=' + windowSize.height + ' offset.top=' + offsetTop)
//
//          size.height = heightTop
//          $scope.chart.traits.size( size)
//          size.height = heightBot
//          $scope.chart.brushTraits.size( size)
//        }
//      })
    }
//    $window.onresize = onResize
//    onResize()

    $window.addEventListener( 'unload', function( event) {
      $scope.chartRemove()
    })

  }]).

  directive( 'gbCharts', function(){
    return {
      restrict: 'E', // Element name
      // The template HTML will replace the directive.
      replace: true,
      transclude: true,
      scope: true,
      templateUrl: 'template/chart/charts.html',
      controller: 'gbChartsController'
    }
  }).
  directive( 'gbChart', function($window, $timeout){

    function getDivs( element) {
      var gbWinChilren = element.children().eq(0).children(),
          titlebar = gbWinChilren.eq(0),
          labels = gbWinChilren.eq(1),
          chartContainer = gbWinChilren.eq(2),
          gbWinContent = chartContainer.children().eq(0),
          gbWinContentChildren = gbWinContent.children()

      return {
        titlebar: titlebar,
        labels: labels,
        chartContainer: chartContainer,
        gbWinContent: gbWinContent,
        chartMain: gbWinContentChildren.eq(0),
        chartBrush: gbWinContentChildren.eq(1)
      }
    }

//    function getHeights( divs) {
//      return {
//        title:      divs.titlebar.prop('offsetHeight'),
//        labels:     divs.labels.prop('offsetHeight'),
//        chartMain:  divs.chartMain.prop('offsetHeight'),
//        chartBrush: divs.chartBrush.prop('offsetHeight')
//      }
//    }

    function gbChartLink(scope, element, attrs) {
      console.log( 'gbChartLink ++++++++++++++++++++++++++++++++')
      var w = angular.element($window),
//          documentElement = $window.document.documentElement,
//          windowSize = new d3.trait.Size( documentElement.clientWidth, documentElement.clientHeight),
          windowSize = new d3.trait.Size( w.width(), w.height()),
          divs = getDivs( element),
          containerSize = new d3.trait.Size(),
          heights = { main: 0, brush: 0}

      scope.getSize = function () {
        windowSize.width = w.width()    //documentElement.clientWidth
        windowSize.height = w.height()  //documentElement.clientHeight

//        var size = '' + element.prop( 'offsetWidth') + ' ' + element.prop( 'offsetHeight')
        var size = '' + windowSize.width + ' ' + windowSize.height
        console.log( 'gbChart getSize ' + size +
            ', title: '+ divs.titlebar.prop( 'offsetHeight') +
            ', labels: '+ divs.labels.prop( 'offsetHeight') +
            ', chartMain: '+ divs.chartMain.prop( 'offsetHeight') +
            ', chartBrush: '+ divs.chartBrush.prop( 'offsetHeight')
        )
        return size
      };
//      scope.getHeight = function () {
//        console.log( 'gbChart getHeight ' + element.Height())
//        return element.prop('offsetHeight')
//      };

      function invalidateDo() {
        var top = divs.chartContainer.prop('offsetTop'),
            left = divs.chartContainer.prop('offsetLeft'),
            //            newSize = new d3.trait.Size( divs.chartContainer.prop('offsetWidth'), divs.chartContainer.prop('offsetHeight'))
            newSize = new d3.trait.Size( windowSize.width - left, windowSize.height - top)
//            el = {
//              l: element.prop('offsetLeft'),
//              w: element.prop('offsetWidth'),
//              h: element.prop('offsetHeight')
//            },
//            c = {
//              l: divs.chartContainer.prop('offsetLeft'),
//              t: divs.chartContainer.prop('offsetTop'),
//              w: divs.chartContainer.prop('offsetWidth'),
//              h: divs.chartContainer.prop('offsetHeight')
//            },

        if( containerSize.width !== newSize.width || containerSize.height !== newSize.height) {
          containerSize.width = newSize.width
          containerSize.height = newSize.height

          if( newSize.height <= 150) {
            heights.main = Math.max( newSize.height, 20)
            heights.brush = 0
          } else {
            heights.brush = Math.floor( newSize.height * 0.18)
            if( heights.brush < 50)
              heights.brush = 50
            else if( heights.brush > 100)
              heights.brush = 100
            heights.main = newSize.height - heights.brush
          }

          console.log( 'gbChart scope.watch size change main=' + heights.main + ' brush=' + heights.brush + ' ********************')

          scope.styleMain = function () {
            return {
              'height': heights.main + 'px',
              'width': '100%'
            };
          }

          scope.styleBrush = function () {
            return {
              'height': heights.brush + 'px',
              'width': '100%',
              'background-color': 'lightblue'
            };
          }


//          divs.chartMain.css( 'height', heights.main + 'px')
//          divs.chartBrush.css( 'height', heights.brush + 'px')
//
//          newSize.height = heights.main
//          scope.chart.traits.size( newSize)
//          newSize.height = heights.brush
//          scope.chart.brushTraits.size( newSize)

//          scope.chart.traits.invalidate( 'resize', 0)
//          scope.chart.brushTraits.invalidate( 'resize', 0)

          scope.$digest()
        } else {
          console.log( 'gbChart scope.watch size change none')
        }

      }
      scope.invalidateWindow = function() {
        $timeout( invalidateDo)
      }
      scope.$watch(scope.getSize, function (newValue, oldValue) {
        scope.invalidateWindow()
      }, false)

      w.bind('resize', function () {
        scope.$apply();
      });
    }

    return {
      restrict: 'E', // Element name
      // The template HTML will replace the directive.
      replace: true,
      transclude: true,
      scope: true,
      templateUrl: 'template/chart/chart.html',
      controller: 'gbChartController',
      link: gbChartLink
    }
  }).
  directive('chart', function() {
    return {
      restrict: 'A',
      scope: {
        chart: '=',  // chart traits
        data: '=',    // binding to data in controller
        selection: '='    // give controller binding to d3 selection
      },
      link: function (scope, elem, attrs) {
        var chartEl

        chartEl = d3.select(elem[0])
        scope.selection = chartEl.datum( scope.data)
        scope.chart.call( scope.selection)
        if( scope.data && scope.data.length > 0)
          console.log( 'directive.chart chart.call scope.data[0].measurements.length=' + scope.data[0].measurements.length)
        else
          console.log( 'directive.chart chart.call scope.data null or length=0')

        scope.update = function() {
          //console.log( 'ReefAdmin.directives chart update')
          scope.chart.update( 'trend')
        }

      }
    };
  }).
  directive('draggable', function() {
    // from http://blog.parkji.co.uk/2013/08/11/native-drag-and-drop-in-angularjs.html
    return {
      restrict: 'A',
      scope: {
        ident: '=',
        source: '=?',
        onDragSuccess: '=?'
      },
      link: function (scope, elem, attrs) {

        var el = elem[0]
        el.draggable = true

        el.addEventListener(
          'dragstart',
          function(e) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('Text', scope.ident);
            this.classList.add('drag');
            return false;
          },
          false
        );

        el.addEventListener(
          'dragend',
          function(e) {
            this.classList.remove('drag');

            if(e.dataTransfer.dropEffect !== 'none' && scope.onDragSuccess) {
              scope.onDragSuccess( scope.ident, scope.source)
            }

            return false;
          },
          false
        );

      }
    };
  }).
  directive('droppable', function() {
    return {
      scope: {
        onDrop: '=',
        target: '=?'
      },
      replace: false,
      link: function(scope, element) {
        // again we need the native object
        var el = element[0];
        el.addEventListener(
          'dragover',
          function(e) {
            e.dataTransfer.dropEffect = 'move';
            // allows us to drop
            if (e.preventDefault) e.preventDefault();
            this.classList.add('over');
            return false;
          },
          false
        )
        el.addEventListener(
          'dragenter',
          function(e) {
            this.classList.add('over');
            return false;
          },
          false
        )

        el.addEventListener(
          'dragleave',
          function(e) {
            this.classList.remove('over');
            return false;
          },
          false
        )
        el.addEventListener(
          'drop',
          function(e) {
            // Stops some browsers from redirecting.
            if (e.stopPropagation) e.stopPropagation();

            this.classList.remove('over');

            var ident = e.dataTransfer.getData('Text');
            scope.onDrop( ident, scope.target)

            return false;
          },
          false
        );
      }
    }
  })

