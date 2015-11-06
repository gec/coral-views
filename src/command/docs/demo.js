angular.module('greenbus.views.demo').controller('CommandDemoCtrl', function ($scope, rest) {
  var accessMode = 'ALLOWED'

  $scope.commands = [  // for MG1.Device0.Status
    { 'name': 'PowerHub.ESS.SetReactivePower', 'id': '4fc433a4-3ab5-4d9c-8eb8-3f0757d771bf', 'commandType': 'SETPOINT_DOUBLE', 'displayName': 'SetReactivePower', 'endpoint': 'b43e2e0b-8db1-4eb9-910b-97d64df9dd9f'},
    { 'name': 'MG1.Device0.Close', 'id': 'a1b8f486-f476-4095-8700-f25719ce41cd', 'commandType': 'CONTROL', 'displayName': 'Close0', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'},
    { 'name': 'MG1.Device0.Trip', 'id': '11aaf3b1-9777-4617-841f-564308752822', 'commandType': 'CONTROL', 'displayName': 'Trip0', 'endpoint': '9c99715b-1739-4dda-adb1-eb8ca1a82db6'}
  ]

  $scope.selectReturnsError = false
  $scope.executeReturnsError = false

  $scope.selectAllChanged = function( state) {
    $scope.selectAllState = state
  }

  $scope.commands.forEach( function( command) {
    var commandLockId = command.id + '-lock-id'
    rest.whenPOST( '/models/1/commandlock', { accessMode: accessMode, commandIds: [command.id]}).
      respond( function(method, url, data) {
        if( $scope.selectReturnsError)
          return [
            403,
            {
              'exception': 'LockedException',
              'message': 'Commands already locked'
            }
          ]
        else
          return [
            200,
            {
              'id': data.commandIds[0] + '-lock-id',
              'accessMode': data.accessMode,
              'expireTime': Date.now() + 6 * 1000,
              'commandIds': data.commands
            }
          ]
      })
    // Don't include the argument so we match any input value.
    rest.whenPOST( '/models/1/commands/' + command.id /*, { commandLockId: commandLockId, setpoint: { doubleValue: Number( 1.0)}}*/).
      respond( function( method, url, data) {
        if( $scope.executeReturnsError)
          return [
            403, // forbidden
            {
              'exception': 'org.totalgrid.reef.client.exception.ReefServiceException',
              'message': 'Command execute request unknown failure. Response timeout from front end connection.'
            }
          ]
        else
          return [
            200,
            {
              'status':'SUCCESS',
              'error':''
            }
          ]
      })
    rest.whenDELETE( '/models/1/commandlock/' + commandLockId).
      respond( {
        'status':'SUCCESS',
        'error':''
      })
  })

});