angular.module('coral.views.demo').controller('EventDemoCtrl', function ($scope) {
  $scope.alerts = [
    { type: 'danger', msg: 'Oh snap! Change a few things up and try submitting again.' },
    { type: 'success', msg: 'Well done! You successfully read this important alert message.' }
  ];

  $scope.addEvent = function() {
    $scope.alerts.push({msg: 'Another alert!'});
  };

});