function ArticleCtrl($scope) {
  $scope.articles = [
  ];

  $scope.$on('dataLoaded', function($targetScope, data){
    $scope.articles = data.articles;
  });
}