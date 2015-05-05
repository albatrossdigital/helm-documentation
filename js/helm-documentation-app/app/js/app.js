'use strict';

//***************************************

// Main Application

//***************************************

angular.module('app', [
  'drupalService',
  'app.menu',
  'ui.router',
  'metaInfo',
  'ngSanitize',
  'ngAnimate',
  'ngTouch',
  'scrollTo',
  'scrollSpy',
  'angular-inview',
])

.run(
  [          '$rootScope', '$state', '$stateParams', 'metaInfo', '$window', '$location', 
    function ($rootScope,   $state,   $stateParams,   metaInfo,   $window,   $location) {

			// It's very handy to add references to $state and $stateParams to the $rootScope
			// $rootScope.$state = $state;
			// $rootScope.$stateParams = $stateParams;

      $rootScope.apiUrl = Drupal.settings.helm_documentation.api_path;
      $rootScope.menuName = Drupal.settings.helm_documentation.menu_name;
      $rootScope.pagePath = Drupal.settings.helm_documentation.page_path;

      $rootScope.scrollToCurrent = function() {
        // This offset assumes a fixed header
        $rootScope.scrollTo($stateParams.mlid + '/' + $stateParams.childmlid, 58);
      };
		}
	]
)

.directive('menuClick', function factory($window, $browser) {
  return {
    restrict: 'A',
    scope: {
      menuClick: '@menuClick',
    },
    link: function($scope, $element, $attrs) {
      $element.on('click', function(event) {
        if($scope.menuClick && $scope.menuClick != "force-close") {
          jQuery('.helm-docs-wrapper').toggleClass('show-nav');
        }
        else {
          jQuery('.helm-docs-wrapper').removeClass('show-nav');
        }
        if($scope.menuClick && $scope.menuClick == "return-false") {
          event.stopPropagation();
          return false;
        }
      });
    }
  }
});

