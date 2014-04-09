function TeamCtrl($scope, $rootScope, $timeout) {

  $scope.teams = [
  ];

  $scope.$on('dataLoaded', function($targetScope, data){
    $scope.teams = data.teams;
  });

}