/**
 * Manage a set of alarms as subscription messages come in.
 *
 * @param _limit - Maximum number of alarms
 * @param _alarms - if supplied, this array will be update and sorted with onMessage calls.
 * @constructor
 */
function GBAlarms( _limit, _alarms) {
  var self = this

  if( !_alarms)
    _alarms = []

  self.alarmIdMap = {}
  self.limit = _limit

  self.alarms = _alarms // copyAlarms( _alarms.slice( 0, _limit))

  // trim to limit
  if( this.alarms.length > this.limit)
    this.alarms.splice( this.limit, this.alarms.length - this.limit)

  // setup alarmIdMap
  self.alarms.forEach( function( a) { self.alarmIdMap[a.id] = a})


  //function copyAlarms( alarms) {
  //  var copies = []
  //  alarms.forEach( function( a) {
  //    copies.push( angular.extend( {}, a))
  //  })
  //  return copies
  //}

}

GBAlarms.prototype.onMessage = function( alarm) {
  var self = this,
      removedAlarms = []

  if( angular.isArray( alarm)) {
    console.log( 'GBAlarms onAlarmOrAlarms length=' + alarm.length)
    alarm.forEach( function( a) {
      if( self.onEach( a)) // if was removed
        removedAlarms[ removedAlarms.length] = a
    })
  } else {
    this.onEach( alarm)
  }

  this.sortByTime()

  if( this.alarms.length > this.limit) {
    removedAlarms = this.alarms.splice( this.limit, this.alarms.length - this.limit)
    removedAlarms.forEach( function( a) { delete self.alarmIdMap[a.id]})
  }

  return removedAlarms
}

GBAlarms.prototype.onUpdateFailure = function( ids, newState) {
  var self = this
  ids.forEach( function( id) {
    var a = self.alarmIdMap[id]
    if( a)
      a._updateState = 'none'
  })
}

/**
 *
 * @param alarm
 * @return boolean true if removed
 */
GBAlarms.prototype.onEach = function( alarm) {
  var existingAlarm,
      removed = false

  // NOTE: We get duplicate notifications with alarmWorkflow. One from the subscription
  // and one from the POST reply.
  //
  console.log( 'GBAlarms onEach ' + alarm.id + ' "' + alarm.state + '"' + ' "' + alarm.message + '"')
  existingAlarm = this.alarmIdMap[alarm.id]
  if( existingAlarm)
    removed = this.onUpdate( existingAlarm, alarm)
  else if( alarm.state !== 'REMOVED') {
    alarm._updateState = 'none'
    this.alarms.unshift( alarm)
    this.alarmIdMap[alarm.id] = alarm
  }

  return removed
}

/**
 * Update from regular subscription stream or from update state request.
 *
 *   if( wasRemoved && alarm._checked)
 *     $scope.selectItem( alarm, 0) // selection needs to update its select count.
 *
 * @param alarm Existing alarm
 * @param update Updated properties for alarm
 * @return boolean true if the alarm was removed
 */
GBAlarms.prototype.onUpdate = function( alarm, update) {
  var wasRemoved = false

  if( ! alarm)
    return wasRemoved

  angular.extend( alarm, update)
  alarm._updateState = 'none'

  if( update.state === 'REMOVED') {
    var i = this.alarms.indexOf( alarm)
    if( i >= 0)
      this.alarms.splice( i, 1);
    wasRemoved = true
    delete this.alarmIdMap[alarm.id];
  }

  return wasRemoved
}

GBAlarms.prototype.sortByTime = function() {
  this.alarms.sort( function( a, b) { return b.time - a.time})
}

GBAlarms.prototype.filter = function( theFilter) {
  return this.alarms.filter( theFilter)
}

