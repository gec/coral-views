/**
 * Manage a set of events as subscription messages come in.
 *
 * @param _limit - Maximum number of alarms
 * @param _events - if supplied, this array will be update and sorted with onMessage calls.
 * @constructor
 */
function GBEvents( _limit, _events) {
  var self = this

  if( !_events)
    _events = []

  self.limit = _limit
  self.events = _events // _events.slice( 0, _limit) // shallow copy

  // trim to limit
  if( this.events.length > this.limit)
    this.events.splice( this.limit, this.events.length - this.limit)
}

GBEvents.prototype.onMessage = function( event) {
  var removedEvents = []

  if( angular.isArray( event)) {
    var self = this
    console.log( 'GBEvents onEventOrEvents length=' + event.length)
    event.forEach( function( e) {
      self.events.unshift( e)
    })
  } else {
    this.events.unshift( event)
  }

  this.sortByTime()

  if( this.events.length > this.limit)
    removedEvents = this.events.splice( this.limit, this.events.length - this.limit)

  return removedEvents
}


GBEvents.prototype.sortByTime = function() {
  this.events.sort( function( a, b) { return b.time - a.time})
}

