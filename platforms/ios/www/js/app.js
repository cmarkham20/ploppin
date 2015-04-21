var ploppin = angular.module('starter', [
  'ionic',
  'ngCordova',
  'firebase'
]);
var fb = new Firebase('https://scorching-heat-3212.firebaseio.com/');

ploppin.filter('reverse', function() {
   function toArray(list) {
    var k, out = [];
    if( list ) {
      if( angular.isArray(list) ) {
        out = list;
      }
      else if( typeof(list) === 'object' ) {
        for (k in list) {
          if (angular.isObject(list[k])) { out.push(list[k]); }
        }
      }
    }
    return out;
  }
  return function(items) {
    return toArray(items).slice().reverse();
  };
});
ploppin.run(function ($ionicPlatform) {
  $ionicPlatform.ready(function () {
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      StatusBar.styleLightContent();
    }
  });
});
ploppin.config(function ($stateProvider, $urlRouterProvider) {
  $stateProvider.state('firebase', {
    url: '/firebase',
    templateUrl: 'templates/firebase.html',
    controller: 'FirebaseController',
    cache: false
  }).state('first', {
    url: '/first',
    cache: false,
    controller: 'FirstController'
  }).state('tab', {
    url: "/tab",
    abstract: true,
    templateUrl: "templates/tabs.html"
  }).state('tab.feed', {
    url: '/feed',
    views: {
      'tab-feed': {
        templateUrl: 'templates/feed.html',
		cache: false,
        controller: 'FeedController'
      }
    }
  }).state('tab.camera', {
    url: '/camera',
    views: {
      'tab-camera': {
        templateUrl: 'templates/camera.html',
		cache: false,
        controller: 'CameraController'
      }
    }
  }).state('tab.settings', {
    url: '/settings',
    views: {
      'tab-settings': {
        templateUrl: 'templates/settings.html',
        controller: 'SettingsController'
      }
    }
  });
  $urlRouterProvider.otherwise('/first');
});
ploppin.controller('FirebaseController', function ($scope, $state, $firebaseAuth, $firebaseArray) {
  var fbAuth = $firebaseAuth(fb);
  $scope.login = function (email, password) {
    fbAuth.$authWithPassword({
      email: email,
      password: password
    }).then(function (authData) {
      $state.go('tab.feed');
    }).catch(function (error) {
      alert('ERROR: ' + error);
    });
  };
  $scope.register = function (email, password, username) {
    fbAuth.$createUser({
      email: email,
      password: password
    }).then(function (userData) {
      return fbAuth.$authWithPassword({
        email: email,
        password: password
      });
    }).then(function (authData) {
	  var userReference = fb.child('profiles/'+authData.uid);
	  userReference.set({ username: username });
      $state.go('tab.feed');
    }).catch(function (error) {
      alert('ERROR: ' + error);
    });
  };
});
ploppin.controller('FirstController', function ($scope, $state, $firebaseAuth) {
  var fbAuth = $firebaseAuth(fb);
  if (fbAuth) {
	  $state.go('tab.feed');
  }
  else {
	  $state.go('firebase');
  }
});
ploppin.controller('SettingsController', function ($scope, $state, $firebaseObject) {
	var fbAuth = fb.getAuth();
	var userReference = fb.child('profiles/'+fbAuth.uid);
    $scope.data = $firebaseObject(userReference);
	$scope.signOut = function() {
    	fb.unauth();
    	$state.go('firebase');
  	};
  	$scope.save = function(username) {
		userReference.set({ username: username });
  	};
});
ploppin.controller('FeedController', function ($scope, $state, $ionicHistory, $firebaseArray) {
  $scope.images = [];
  var fbAuth = fb.getAuth();
  if (fbAuth) {
	
    var userReference = fb.child('posts').orderByChild('timestamp');
    var syncArray = $firebaseArray(userReference);
    $scope.images = syncArray;
  } else {
    $state.go('firebase');
  }
});
ploppin.controller('CameraController', function ($scope, $state, $ionicHistory, $firebaseArray, $cordovaCamera) {
	var fbAuth = fb.getAuth();
	var userReference = fb.child('posts');
    var syncArray = $firebaseArray(userReference);
    var options = {
      quality: 75,
      destinationType: Camera.DestinationType.DATA_URL,
      sourceType: Camera.PictureSourceType.CAMERA,
      allowEdit: true,
      encodingType: Camera.EncodingType.JPEG,
      popoverOptions: CameraPopoverOptions,
      targetWidth: 1000,
      targetHeight: 1000,
      cameraDirection: 1,
      saveToPhotoAlbum: false
    };
    $cordovaCamera.getPicture(options).then(function (imageData) {
        $scope.thephoto = function() {
		    return "data:image/jpeg;base64,"+imageData;
		  };
        $scope.photo = imageData;
    }, function (error) {
      $state.go('tab.feed');
    });
   $scope.submitpost = function (photo, caption) {
    syncArray.$add({ user: fbAuth.uid, image: photo, caption: caption, timestamp: Firebase.ServerValue.TIMESTAMP }).then(function () {
      $state.go('tab.feed');
    }).catch(function (error) {
      alert('ERROR: ' + error);
    });
  };
});