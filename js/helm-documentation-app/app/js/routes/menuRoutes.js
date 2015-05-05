'use strict';

// Function takes in collection of plids,
// tests for presence of an mlid in collection
// if excludeRoot is included that mlid is 
// subtacted from the test
function itemOrParents(item, mlid, excludeRoot) {
  var mlids = item.plids.concat([item.mlid]);
  // Do we include the "top level"?
  if(!excludeRoot) {
    return _.contains(mlids, mlid);
  }
  // Just worry about sub-sections
  return _.contains(_.reject(mlids, function(plid) {
    return plid == item.rootMlid;
  }), mlid);
}

angular.module('app.menu', [
  'ui.router' 
])

.config(
  [ '$stateProvider', '$urlRouterProvider',
    function ($stateProvider, $urlRouterProvider) {
      
      $urlRouterProvider
        .when('', '/menu')
        .when('/', '/menu');

      $stateProvider

        
        .state("menu", {
          url: '/menu',
          resolve: {
            links: function($stateParams, $filter, MenuLink) {
              return MenuLink.query().$promise.then(function(data) {

                var list = [];

                function recurseList(localLinks, plids, rootMlid, expanded) {
                  // Grab our parent item
                  angular.forEach(localLinks, function(item, key) {
                    // Set the root, and if we're top level
                    // change it to the item.
                    item.rootMlid = rootMlid;
                    var newRoot = rootMlid ? rootMlid : item.mlid;
                    // Parent tree
                    item.plids = plids;
                    // Show items full?
                    item.showExpanded = expanded;
                    // External link ?
                    if(item.url.match(/^https?:\/\//)) {
                      item.externalSite = true;
                    }
                    else {
                      item.externalSite = false;
                      item.url = window.location.origin + item.url;
                    }
                    // Non node link?
                    if(!item.nid) {
                      item.nid = 'm' + item.mlid;
                      item.nonNode = true;
                    }
                    // If we have children, dig down
                    if (item.has_children && parseInt(item.has_children)) {
                      // Add current plid, get children
                      var childPlids = plids.concat([item.mlid]),
                          children   = $filter('filter')(data.list, { plid: item.mlid });
                      item.children = _.pluck(children, 'mlid');
                      list.push(item);
                      recurseList(children, childPlids, newRoot, parseInt(item.expanded));
                    }
                    else {
                      list.children = [];
                      list.push(item);
                    }
                  });
                }
                recurseList($filter('filter')(data.list, { depth: 1 }), [], 0, 1);
                return list;
              });
            }
          },
          templateUrl: 'views/menu/home.html',
          controller: function($scope, $rootScope, $state, $filter, $location, links){
            $scope.links = links;
            // Do we have menu values?
            if($state.params && $state.params.mlid) {
              $rootScope.activeLink = $state.params.mlid;
            }
            // Just use first
            else {
              $rootScope.activeLink = links[0].mlid;
              $state.go('menu.section', {mlid: $scope.activeLink});
            }

            $scope.activeSections = function(menuItem) {
              if($rootScope.inView) {
                var value = itemOrParents($rootScope.inView, menuItem.mlid, true);
                return value;
              }
              return false;
            }

            $rootScope.changeSection = function(mlid, stateGo) {
              if($rootScope.activeLink != mlid) {
                $rootScope.activeLink = mlid;

                if(stateGo) {
                  $state.go('menu.section', {mlid: $rootScope.activeLink});
                }
              }
            }

            $scope.menuLinkClick = function(item) {
              return parseInt(item.external)
                   ? window.location.replace(item.url)
                   : $state.go('menu.section.child', {mlid: $rootScope.activeLink, childmlid: item.mlid});
            }
          }
        })

        .state("menu.section", {
          url: '/:mlid',
          template: '<ui-view/>',
          resolve: {
            nodes: function($stateParams, $filter, Node, links) {

              // Get a list of nids in the menu path
              var nids = _.pluck(_.filter(links, function(item) {
                return itemOrParents(item, $stateParams.mlid);
              }), 'nid');

              // Grab the node data with one request
              return Node.query({'nid[]': nids}).$promise.then(function(data) {
                // Add node field data to results
                return _.transform(links, function(result, item, key) {
                  if(_.contains(nids, item.nid)) {
                    item.node = $filter('filter')(data.list, { nid: item.nid })[0];
                    result.push(item);
                  }
                });
              });
            }
          },
          controller: function($scope, $rootScope, $filter, $state, links, nodes) {
            var childmlid,
                normalRun = true,
                stateGo = false; // switch for normal child acquisition

            // check if we're NOT expanded and navigating to first item.
            if(  nodes.length > 1
              && !parseInt(nodes[0].expanded) 
              && $state.params 
              && (  !$state.params.childmlid
                 || $state.params.childmlid && $state.params.mlid == $state.params.childmlid) )
            {

              // Find children nodes
              var possibleChild = _.transform(nodes, function(result, item, key) {
                if(item.mlid != $state.params.mlid && !item.nonNode ) { 
                  result.push(item);
                  return false;
                }
              });
              // Got one
              if(possibleChild && possibleChild.length) {
                childmlid = possibleChild[0].mlid;
                normalRun = false;
                stateGo = true;
              }
            }
            // If normal or no suitable children
            if(normalRun){
              if(!($state.params && $state.params.childmlid)) {
                // Grab first child with a node body
                childmlid = _.filter(nodes, function(item) {
                  return item.node && item.node.body && item.node.body.value;
                })[0].mlid;
                stateGo = true
;              }
            }
            // Change the active section
            $rootScope.changeSection($state.params.mlid);
            // We hit child state change, so navigate
            if(stateGo) {
              $state.go('menu.section.child', {mlid: $state.params.mlid, childmlid: childmlid});
            }
          }
        })

        
        // This is just a placeholder for deep links
        .state("menu.section.child", {
          url: '/:childmlid',
          templateUrl: 'views/menu/section.html',
          controller: function($scope, $sce, $rootScope, $filter, $state, $window, links, nodes) {
            $scope.mlid = $state.params.mlid;
            $scope.links = links;
            $scope.windowHeight = $window.innerHeight - (30 + 55);
            
            // Check if we're serving all combined
            if(parseInt(nodes[0].expanded)) {
              $scope.nodes = nodes;
            }
            // Serve one node at a time.
            else {
              $scope.nodes = _.filter(nodes, function(item) {
                if(item.mlid == $state.params.childmlid) {
                  $rootScope.inView = item;
                  return true;
                }
                else {
                  return itemOrParents(item, $state.params.childmlid);
                }
              });
            }
            

            // @todo: scrollto
            $scope.inViewScroll = function(menuItem) {
              $rootScope.inView = menuItem;
            }

            $scope.trustedBody = function(node) {
              return $sce.trustAsHtml(node.node.body.value);
            }
          }
        });
    }
  ]
)


