
document.cookie='coralAuthToken=auth1'

angular.module('greenbus.views.demo', ['ui.bootstrap', 'greenbus.views','plunker', 'ngTouch', 'angularBootstrapNavTree', 'gbMock', 'ui.router'], function($httpProvider){
  FastClick.attach(document.body);
  delete $httpProvider.defaults.headers.common['X-Requested-With'];
}).

// config([ '$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
//
//   // For any unmatched url, redirect to ...
//   $urlRouterProvider.otherwise("/loading")
//
//   $stateProvider
//     .state('loading',                   { url: "/loading",     template: "<div>pick a module to demo...</div>"})
//     .state('microgrids',                { url: "/microgrids",     template: "<div>state: microgrids</div>"})
//     .state('microgrids.dashboard',      { url: "/dashboard",     template: "<div>state: microgrids/doashboard</div>"})
//     .state('ess',      { url: "/ess",       params: {microgridId: null, navigationElement: null}, templateUrl: "moduledemos/ess/demo.html"})
// }]).

run(['$location', '$rootScope', function($location,$rootScope){
  //Allows us to navigate to the correct element on initialization
  if ($location.path() !== '' && $location.path() !== '/') {
    smoothScroll(document.getElementById($location.path().substring(1)), 500, function(el) {
      location.replace(el.id);
    });
  }

  // Pretty print the Javascript Markdown after each view is loaded.
  $rootScope.$on('$viewContentLoaded', function(event, viewConfig){
    // works better with the delay. Still not completely without errors.
    setTimeout( Rainbow.color, 1000)
  })
  // $rootScope.$on('stateChangeSuccess', Rainbow.color)
}]);

var builderUrl = "http://50.116.42.77:3001";

function MainCtrl($scope, $http, $document, $modal, orderByFilter) {
  $scope.showBuildModal = function() {
    var modalInstance = $modal.open({
      templateUrl: 'buildModal.html',
      controller: 'SelectModulesCtrl',
      resolve: {
        modules: function() {
          return $http.get(builderUrl + "/api/bootstrap").then(function(response) {
            return response.data.modules;
          });
        }
      }
    });
  };

  $scope.showDownloadModal = function() {
    var modalInstance = $modal.open({
      templateUrl: 'downloadModal.html',
      controller: 'DownloadCtrl'
    });
  };
}

var SelectModulesCtrl = function($scope, $modalInstance, modules) {
  $scope.selectedModules = [];
  $scope.modules = modules;

  $scope.selectedChanged = function(module, selected) {
    if (selected) {
      $scope.selectedModules.push(module);
    } else {
      $scope.selectedModules.splice($scope.selectedModules.indexOf(module), 1);
    }
  };

  $scope.downloadBuild = function () {
    $modalInstance.close($scope.selectedModules);
  };

  $scope.cancel = function () {
    $modalInstance.dismiss();
  };

  $scope.download = function (selectedModules) {
    var downloadUrl = builderUrl + "/api/bootstrap/download?";
    angular.forEach(selectedModules, function(module) {
      downloadUrl += "modules=" + module + "&";
    });
    return downloadUrl;
  };
};

var DownloadCtrl = function($scope, $modalInstance) {
  $scope.options = {
    minified: true,
    tpls: true
  };

  $scope.download = function (version) {
    var options = $scope.options;

    var downloadUrl = ['gec-views-'];
    if (options.tpls) {
      downloadUrl.push('tpls-');
    }
    downloadUrl.push(version);
    if (options.minified) {
      downloadUrl.push('.min');
    }
    downloadUrl.push('.js');

    return downloadUrl.join('');
  };

  $scope.cancel = function () {
    $modalInstance.dismiss();
  };
};
