function AuthorCtrl($scope) {
  $scope.authors = [
  ];

  $scope.$on('dataLoaded', function($targetScope, data){
    $scope.authors = data.authors;
  });


}