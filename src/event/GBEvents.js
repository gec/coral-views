function GBEvents( _limit, _events) {
  var self = this

  if( !_events)
    _events = []

  self.events = _events.slice( 0, _limit) // shallow copy
  self.limit = _limit
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

