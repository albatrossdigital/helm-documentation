
angular.module('scrollSpy', [])

.directive('scrollSpy', function($window) {
  return {
    restrict: 'A',
    link: function(scope, elem, attrs) {
      var $body = jQuery('body'),
          $elem = jQuery(elem),
          $nav = $elem.children('ul'),
          scrolled = false;

      function maxHeight() {
        // change this for different headers / footers!
        $nav.css({'max-height': ($window.innerHeight - (20)) + 'px'});
      }

      jQuery($window).on('resize', function () {
        maxHeight();
      });

      jQuery($window).scroll(function() {
        if (($elem.offset().top - ($window.scrollY + 80)) <= 0) {
          if(!scrolled) {
            $body.addClass('docs-sidebar-scroll');
            scrolled = true;
          }
        }
        else if(scrolled) {
          $body.removeClass('docs-sidebar-scroll');
          scrolled = false;
        }
      });

      maxHeight();
    }
  };
});