
(function($, Drupal) {
  Drupal.behaviors.helm_documentation = {
    attach: function(context, settings) {
      if (settings.helm_documentation != undefined) {
        
        // Switch this to whatever menu off canvas you have
        // $('.right-off-canvas-toggle').click(function() {
        //   window.scrollTo(0, 0);
        // });

        angular.bootstrap(context, ['app']);
      }
    }
  };
})(jQuery, Drupal);
