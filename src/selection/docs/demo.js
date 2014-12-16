angular.module('greenbus.views.demo').controller('SelectionDemoCtrl', function ($scope) {
  $scope.items = [
    {label:'one'},
    {label:'two'},
    {label:'three'}
  ]

  $scope.selectAllState = 0

  $scope.hey = 'hey!'

  $scope.selectAllChanged = function( state) {
    $scope.selectAllState = state
  }
});