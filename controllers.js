var phonecatApp = angular.module('rank', []);
 
phonecatApp.controller('RankCtrl', function ($scope, $rootScope, $timeout, $http) {
  $scope.phones = [
    {'name': 'Nexus S',
     'snippet': 'Fast just got faster with Nexus S.'},
    {'name': 'Motorola XOOM™ with Wi-Fi',
     'snippet': 'The Next, Next Generation tablet.'},
    {'name': 'MOTOROLA XOOM™',
     'snippet': 'The Next, Next Generation tablet.'}
  ];

  var teams = [
    {"name":"DP2","members": 8,"count" :85726,"yesterday":2354},
    {"name":"端小组3","members": 6,"count" :46272,"yesterday":2122},
    {"name":"复杂应用小组3","members": 5,"count" :37261,"yesterday":1876},
    {"name":"FIS小组3","members": 6,"count" :23234,"yesterday":1372},
    {"name":"FIS小组4","members": 6,"count" :23234,"yesterday":1372}
  ];

  $http.jsonp('http://5.5.5-monkeyhunter.offlinea.bae.baidu.com.r3.bae.baidu.com:8082/?r=openapi/fex/data&app_token=e40425eb7960&callback=JSON_CALLBACK').
    success(function(data, status, headers, config) {
      console.log(data, status, headers, config);
      $rootScope.$broadcast('dataLoaded',data.data);

      setTimeout(function(){
          moveNext()
      }, slideDuration);
    }).
    error(function(data, status, headers, config) {
      // called asynchronously if an error occurs
      // or server returns response with an error status.
    });
  // $timeout(function(){
  //   
  // }, 2000)
});