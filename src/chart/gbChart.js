/**
 * Copyright 2014 Green Energy Corp.
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
 *
 * Author: Flint O'Brien
 */

/**
 *
 * @param _points  Array of points
 * @param _brushChart Boolean True if brush chart should be created
 */
function GBChart( _points, trend, _brushChart) {

  var self = this
  self.points = copyPoints( _points)
  self.trend = angular.copy( trend) // deep copy
  self.unitMap = getChartUnits( self.points )
  self.name = makeNameFromPoints( self.points )
  self.traits = makeChartTraits( self.unitMap )
  self.selection = null
  self.brushChart = _brushChart
  self.brushTraits = _brushChart ? makeBrushTraits() : undefined
  self.brushSelection = null
  self.trendTimer = null


  self.isEmpty = function() {
    return self.points.length <= 0
  }

  function copyPoints( points) {
    var newPoints = []
    points.forEach( function( p) {
      newPoints.push( angular.extend( {}, p))
    })
    return newPoints
  }

  function makeNameFromPoints( points) {
    switch( points.length) {
      case 0: return '...'
      case 1: return points[0].name
      default: return points[0].name + ', ...'
    }
  }

  function makeChartConfig( unitMapKeys, size ) {
    var axis,
        config = {
          x1: function ( d ) { return d.time; },
          seriesData: function ( s ) { return s.measurements },
          seriesLabel: function ( s ) { return s.uniqueName }
        }

    if( size)
      config.size = {
        width: size.width,
        height: size.height
      }

    unitMapKeys.forEach( function ( key, index ) {
      axis = 'y' + (index + 1)
//          if( key === 'raw')
//            config[axis] = function ( d ) { return d.value ? 1 : 0; }
//          else
      config[axis] = function ( d ) { return d.value; }
    })
    return config
  }

  function getChartUnits( points ) {
    var units = {}

    points.forEach( function ( point ) {
      if( !units.hasOwnProperty( point.unit ) )
        units[point.unit] = [ point]
      else
        units[point.unit].push( point )
    })
    return units
  }

  function makeChartConfigScaleX1() {
    // If we have a brush chart, then we'll be manually controlled by brush.
    return self.brushChart ? { axis: 'x1', domain: 'manual' }
      : { axis: 'x1', trend: self.trend }
  }

  function makeChartTraits( unitMap, size ) {
    var gridLines = true,
        unitMapKeys = Object.keys( unitMap ),
        config = makeChartConfig( unitMapKeys, size ),
        chartTraits = d3.trait( d3.trait.chart.base, config )
          .trait( d3.trait.scale.time, makeChartConfigScaleX1())

    console.log( 'makeChartTraits unitMapKeys ' + unitMapKeys)
    unitMapKeys.forEach( function ( unit, index ) {
      var axis = 'y' + (index + 1),
          filter = function ( s ) {
            return s.unit === unit
          },
          orient = index === 0 ? 'left' : 'right'

      var interpolate = 'step-after',
          scaleConfig = { axis: axis, seriesFilter: filter, unit: unit }

      if( unit === 'raw' || unit === 'status' || unit === '') {
        interpolate = 'step-after'
        scaleConfig.domain = [0, 5]
      } else {
        scaleConfig.domainPadding = 0.05
      }

      chartTraits = chartTraits.trait( d3.trait.scale.linear, scaleConfig )
        .trait( d3.trait.chart.line, {
          interpolate: interpolate,
          trend: true,
          seriesFilter: filter,
          yAxis: axis,
          focus: {distance: 1000, axis: 'x'}
        } )
        .trait( d3.trait.axis.linear, { axis: axis, orient: orient, ticks: undefined, label: unit, gridLines: gridLines} )
      gridLines = false
    })

    var xAxisTicks = self.brushChart ? 10 : 4
    chartTraits = chartTraits.trait( d3.trait.axis.time.month, { axis: 'x1', ticks: xAxisTicks, gridLines: true} )
      .trait(d3.trait.focus.crosshair, {})
      .trait( d3.trait.focus.tooltip.unified, {
        formatY: d3.format('.2f'),
        formatHeader: function( d) { return 'Time: ' + moment(d).format( 'HH:mm:ss') }
      })

    self.config = config
    return chartTraits
  }

  function makeBrushTraits( size) {
    var brushTraits

    var config = angular.extend( {}, self.config)
    if( size)
      config.size = {
        width: size.width,
        height: size.height
      }


    brushTraits = d3.trait( d3.trait.chart.base, config )
      .trait( d3.trait.scale.time, { axis: 'x1', trend: self.trend})
      .trait( d3.trait.scale.linear, { axis: 'y1' })
      .trait( d3.trait.chart.line, { interpolate: 'step-after' })
      .trait( d3.trait.control.brush, { axis: 'x1', target: self.traits, targetAxis: 'x1'})
      .trait( d3.trait.axis.time.month, { axis: 'x1', ticks: 3})
      .trait( d3.trait.axis.linear, { axis: 'y1', extentTicks: true})

    return brushTraits
  }

  self.getPointByid = function( pointId) {
    var i, point,
        length = self.points.length

    for( i = 0; i < length; i++ ) {
      point = self.points[i]
      if( point.id === pointId )
        return point
    }
    return null
  }

  self.pointExists = function( pointId) {
    return self.getPointByid( pointId) != null
  }

  self.callTraits = function( ) {
//    if( $timeout) {
//      // Use timeout so the digest cycle can update the css width/height
//      $timeout( function() {
//        self.traits.call( self.selection )
//        if( self.brushTraits)
//          self.brushTraits.call( self.brushSelection )
//      })
//    } else {
      self.traits.call( self.selection )
      if( self.brushTraits)
        self.brushTraits.call( self.brushSelection )
//    }
  }

  self.addPoint = function( point) {
    if( !point.measurements )
      point.measurements = []

    self.points.push( point );
    delete point.__color__;
    self.uniqueNames()

    if( self.unitMap.hasOwnProperty( point.unit ) ) {
      self.unitMap[point.unit].push( point )
    } else {
      self.unitMap[point.unit] = [point]
    }

    var size = self.traits.size()
    self.traits.remove()
    self.traits = makeChartTraits( self.unitMap, size )

    if( self.brushChart) {
      size = self.brushTraits.size()
      self.brushTraits.remove()
      self.brushTraits = makeBrushTraits( size)
    }

    self.callTraits()
  }

  self.removePoint = function( point) {
    if( ! point)
      return

    var index = self.points.indexOf( point );
    self.points.splice( index, 1 );

    if( self.points.length > 0 ) {
      var pointsForUnit = self.unitMap[ point.unit]
      index = pointsForUnit.indexOf( point )
      pointsForUnit.splice( index, 1 )

      if( pointsForUnit.length <= 0 ) {
        delete self.unitMap[point.unit];
        self.traits.remove()
        self.traits = makeChartTraits( self.unitMap )
      }

      self.callTraits()
    }

    self.uniqueNames()
  }

  self.trendStart = function( interval, duration) {
    if( duration === undefined)
      duration = interval * 0.95

    var traits = self.brushChart ? self.brushTraits : self.traits
    traits.update( 'trend', duration)

    self.trendTimer = setInterval( function() {
      traits.update( 'trend', duration)
    }, interval)
  }

  self.trendStop = function( ) {
    if( self.trendTimer) {
      clearInterval( self.trendTimer)
      self.trendTimer = null
    }
  }

  // typ is usually 'trend'
  self.invalidate = function( typ, duration) {
    if( self.brushChart)
      self.brushTraits.invalidate( typ, duration)
    else
      self.traits.invalidate( typ, duration)
  }

  // typ is usually 'trend'
  self.update = function( typ, duration) {
    if( self.brushChart)
      self.brushTraits.update( typ, duration)
    else
      self.traits.update( typ, duration)
  }

  function isSamePrefix( index, points) {
    var prefix = points[0].name.substr( 0, index),
        i = points.length - 1
    while( i >= 1){
      if( points[i].name.substr( 0, index) !== prefix)
        return false
      i--
    }
    return true
  }

  function assignUniqueName( index, points) {
    var p,
        i = points.length - 1

    while( i >= 0){
      p = points[i]
      p.uniqueName = p.name.substr( index)
      i--
    }
  }

  self.uniqueNames = function() {
    if( self.points.length === 0)
      return
    var pre,
        n = self.points[0].name,
        l = n.length,
        i = n.indexOf( '.') + 1

    // if not '.' or dot is too near end, return.
    if( i < 0 || i > l - 6) {
      assignUniqueName( 0, self.points)  // give up. Just use the whole name.
      return
    }

    if( isSamePrefix( i, self.points))
      assignUniqueName( i, self.points)

  }

  // TODO: Still see a NaN error when displaying chart before we have data back from subscription
  self.points.forEach( function ( point ) {
    if( !point.measurements )
      point.measurements = [ /*{time: new Date(), value: 0}*/]
  })

  self.uniqueNames()

}