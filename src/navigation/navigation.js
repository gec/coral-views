/**
 * Copyright 2013-2014 Green Energy Corp.
 *
 * Licensed to Green Energy Corp (www.greenenergycorp.com) under one or more
 * contributor license agreements. See the NOTICE file distributed with this
 * work for additional information regarding copyright ownership. Green Energy
 * Corp licenses this file to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * License for the specific language governing permissions and limitations under
 * the License.
 */

angular.module('greenbus.views.navigation', ['ui.bootstrap', 'greenbus.views.rest']).
  factory('navigation', ['rest', function( rest){   // was navigation

    function NotifyCache() {
      this.cache = {}
      this.listeners = {}
    }
    NotifyCache.prototype.put = function( key, value) {
      this.cache[key] = value
      var notifyList = this.listeners[key]
      if( notifyList) {
        notifyList.forEach( function( notify) { notify( key, value)})
        delete this.listeners[key];
      }
    }
    NotifyCache.prototype.addListener = function( key, listener) {
      var listenersForId = this.listeners[ key]
      if( listenersForId)
        listenersForId.push( listener)
      else
        this.listeners[ key] = [listener]
    }
    NotifyCache.prototype.get = function( key, listener) {
      var value = this.cache[ key]
      if( !value && listener)
        this.addListener( key, listener)
      return value
    }



    var self = this,
        ContainerType = {
          MicroGrid: 'MicroGrid',
          EquipmentGroup: 'EquipmentGroup',
          EquipmentLeaf: 'EquipmentLeaf',
          Sourced: 'Sourced'   // Ex: 'All PVs'. Has sourceUrl, bit no data
        },
        equipmentIdToTreeNodeCache = new NotifyCache(),
        menuIdToTreeNodeCache = new NotifyCache()


    function getContainerType( entity) {
      if( entity.types.indexOf( ContainerType.MicroGrid) >= 0)
        return ContainerType.MicroGrid;
      else if( entity.types.indexOf( ContainerType.EquipmentGroup) >= 0)
        return ContainerType.EquipmentGroup;
      else
        return ContainerType.EquipmentLeaf
    }

    function stripParentName( childName, parentName) {
      if( parentName && childName.lastIndexOf(parentName, 0) === 0)
        return childName.substr( parentName.length + 1) // plus 1 for the dot delimeter
      else
        return childName
    }

    function entityToTreeNode( entityWithChildren, parent) {
      // Could be a simple entity.
      var entity = entityWithChildren.entity || entityWithChildren

      // Types: (Microgrid, Root), (EquipmentGroup, Equipment), (Equipment, Breaker)
      var containerType = getContainerType( entity)
      var route = null
      switch( containerType) {
        case ContainerType.MicroGrid:
          route = '/measurements?equipmentIds=' + entity.id + '&depth=9999'
          break;
        case ContainerType.EquipmentGroup:
          route = '/measurements?equipmentIds=' + entity.id + '&depth=9999'
          break;
        case ContainerType.EquipmentLeaf:
          route = '/measurements?equipmentIds=' + entity.id
          break;
        case ContainerType.Sourced:
          break;
        default:
      }

      var name = entity.name
      if( entity.parentName)
        name = stripParentName( name, entity.parentName)
      else if( parent)
        name = stripParentName( name, parent.parentName)

      return {
        label: name,
        id: entity.id,
        type: 'item',
        types: entity.types,
        containerType: containerType,
        route: route,
        children: entityWithChildren.children ? entityChildrenListToTreeNodes( entityWithChildren.children, entity) : []
      }
    }
    function entityChildrenListToTreeNodes( entityWithChildrenList, parent) {
      var ra = []
      entityWithChildrenList.forEach( function( entityWithChildren) {
        var treeNode = entityToTreeNode( entityWithChildren, parent)
        ra.push( treeNode)
        equipmentIdToTreeNodeCache.put( treeNode.id, treeNode)
      })
      return ra
    }

    function cacheNavItems( items) {
      items.forEach( function( item) {
        if( item.class === 'NavigationItem' || item.class === 'NavigationItemSource')
          menuIdToTreeNodeCache.put( item.id, item)
        if( item.children.length > 0)
          cacheNavItems( item.children)
      })
    }

    /**
     * Convert array of { 'class': 'className', data: {...}} to { 'class': 'className', ...}
     * @param navigationElements
     */
    function flattenNavigationElements( navigationElements) {
      navigationElements.forEach( function( element, index) {
        var data = element.data;
        delete element.data;
        angular.extend( element, data)
        flattenNavigationElements( element.children)
      })
    }


    /**
     * Public API
     */
    return {

      /**
       * Get the tree node by equipment Id. This returns immediately with the value
       * or null if the menu item is not available yet. If not available,
       * notifyWhenAvailable will be called when available.
       *
       * @param equipmentId
       * @param notifyWhenAvailable
       * @returns The current value or null if not available yet.
       */
      getTreeNodeByEquipmentId: function( equipmentId, notifyWhenAvailable) { return equipmentIdToTreeNodeCache.get( equipmentId, notifyWhenAvailable)},

      /**
       * Get the tree node by menu Id. This returns immediately with the value
       * or null if the menu item is not available yet. If not available,
       * notifyWhenAvailable will be called when available.
       *
       * @param menuId The menu id to retrieve
       * @param notifyWhenAvailable function( id, treeNode)
       * @returns TreeNode if available, otherwise null.
       */
      getTreeNodeByMenuId: function( menuId, notifyWhenAvailable) { return menuIdToTreeNodeCache.get( menuId, notifyWhenAvailable)},

      /**
       *
       * @param menuId The menu id to put
       * @param treeNode
       */
      putTreeNodeByMenuId: function( menuId, treeNode) { return menuIdToTreeNodeCache.put( menuId, treeNode)},

      getTreeNodes: function( sourceUrl, scope, parent, successListener) {
        rest.get( sourceUrl, null, scope, function( entityWithChildrenList) {
          var treeNodes = entityChildrenListToTreeNodes( entityWithChildrenList, parent)
          successListener( treeNodes)
        })
      },

      getNavTree: function( url, name, scope, successListener) {
        rest.get( url, name, scope, function(data) {
          // example: [ {class:'NavigationItem', data: {label:Dashboard, id:dashboard, route:#/dashboard, selected:false, children:[]}}, ...]
          flattenNavigationElements( data)
          cacheNavItems( data)
          if( successListener)
            successListener( data)
        })
      }
    } // end return Public API

  }]). // end factory 'navigation'

  controller('NavBarTopController', ['$scope', '$attrs', '$location', '$cookies', 'rest', function( $scope, $attrs, $location, $cookies, rest) {
    $scope.loading = true
    $scope.applicationMenuItems = []
    $scope.sessionMenuItems = []
    $scope.application = {
        label: 'loading...',
        route: ''
    }
    $scope.userName = $cookies.userName

    $scope.getActiveClass = function( item) {
        return ( $location.absUrl().indexOf( item.route) >= 0) ? 'active' : ''
    }

    /**
     * Convert array of { 'class': 'className', data: {...}} to { 'class': 'className', ...}
     * @param navigationElements
     */
    function flattenNavigationElements( navigationElements) {
      navigationElements.forEach( function( element, index) {
        var data = element.data;
        delete element.data;
        angular.extend( element, data)
        flattenNavigationElements( element.children)
      })
    }

    function onSuccess( json) {
      flattenNavigationElements( json)
      $scope.application = json[0]
      $scope.applicationMenuItems = json[0].children
      $scope.sessionMenuItems = json[1].children
      console.log( 'navBarTopController onSuccess ' + $scope.application.label)
      $scope.loading = false
    }

    return rest.get( $attrs.href, 'data', $scope, onSuccess)
  }]).
  directive('navBarTop', function(){
    // <nav-bar-top route='/menus/admin'
    return {
      restrict: 'E', // Element name
      // This HTML will replace the alarmBanner directive.
      replace: true,
      transclude: true,
      scope: true,
      templateUrl: 'greenbus.views.template/navigation/navBarTop.html',
      controller: 'NavBarTopController'
    }
  }).

  controller('NavListController', ['$scope', '$attrs', 'rest', function( $scope, $attrs, rest) {
      $scope.navItems = [ {'class': 'NavigationHeader', label: 'loading...'}]

      $scope.getClass = function( item) {
        switch( item.class) {
          case 'NavigationDivider': return 'divider'
          case 'NavigationHeader': return 'nav-header'
          case 'NavigationItem': return ''
          case 'NavigationItemSource': return ''
          default: return ''
        }
      }

      return rest.get( $attrs.href, 'navItems', $scope)
    }]).
  directive('navList', function(){
    // <nav-list href='/coral/menus/admin'>
    return {
      restrict: 'E', // Element name
      // This HTML will replace the alarmBanner directive.
      replace: true,
      transclude: true,
      scope: true,
      templateUrl: 'greenbus.views.template/navigation/navList.html',
      controller: 'NavListController'
    }
  }).

  controller('NavTreeController', ['$scope', '$attrs', '$location', '$cookies', 'rest', 'navigation', function( $scope, $attrs, $location, $cookies, rest, navigation) {

    $scope.navTree = [
        {
            label: 'All Equipment',
            children: [],
            data: {
                regex: '^[^/]+',
                count: 0,
                newMessageCount: 1,
                depth: 0
            }
        }
    ]
    // GET /models/1/equipment?depth=3&rootTypes=Root
    var sampleGetResponse = [
        {
            'entity': {
                'name': 'Some Microgrid',
                'id': 'b9e6eac2-be4d-41cf-b82a-423d90515f64',
                'types': ['Root', 'MicroGrid']
            },
            'children': [
                {
                    'entity': {
                        'name': 'MG1',
                        'id': '03c2db16-0f78-4800-adfc-9dff9d4598da',
                        'types': ['Equipment', 'EquipmentGroup']
                    },
                    'children': []
                }
        ]}
    ]

    $scope.menuSelect = function( branch) {
        console.log( 'navTreeController.menuSelect ' + branch.label + ', route=' + branch.route)
        var url = branch.route
        if( branch.sourceUrl)
            url = url + '?sourceUrl=' + encodeURIComponent(branch.sourceUrl)
        $location.url( url)
    }

    function loadTreeNodesFromSource( parentTree, index, child) {
        navigation.getTreeNodes( child.sourceUrl, $scope, child, function( newTreeNodes) {
            switch( child.insertLocation) {
                case 'CHILDREN':
                    // Insert the resultant children before any existing static children.
                    child.children = newTreeNodes.concat( child.children)
                    break;
                case 'REPLACE':
                    replaceTreeNodeAtIndexAndPreserveChildren( parentTree, index, newTreeNodes)
                    break;
                default:
                    console.error( 'navTreeController.loadTreeNodesFromSource.getTreeNodes Unknown insertLocation: ' + child.insertLocation)
            }
        })

    }

    function safeCopy( o) {
      var clone = angular.copy( o);
      // Angular adds uid to all objects. uid cannot be a duplicate.
      // Angular will generate a uid for this object on next digest.
      delete clone.uid;
      return clone
    }

    /**
     * Replace parentTree[index] with newTreeNodes, but copy any current children and insert them
     * after the new tree's children.
     *
     * BEFORE:
     *
     *   loading...
     *     All PVs
     *     All Energy Storage
     *
     * AFTER:
     *
     *   Microgrid1
     *     MG1
     *       Equipment1
     *       ...
     *     All PVs
     *     All Energy Storage
     *
     *
     * @param parentTree
     * @param index
     * @param newTreeNodes
     */
    function replaceTreeNodeAtIndexAndPreserveChildren( parentTree, index, newTreeNodes) {
        var i,
            oldChildren = parentTree[index].children
        // Remove the child we're replacing.
        parentTree.splice( index, 1)
        for( i=newTreeNodes.length-1; i >= 0; i-- ) {
            var node = newTreeNodes[i]
            parentTree.splice( index, 0, node)
            // For each new child that we're adding, replicate the old children.
            // Replace $parent in the sourceUrl with its current parent.
            if( oldChildren && oldChildren.length > 0) {
                var i2
                for( i2 = 0; i2 < oldChildren.length; i2++) {
                    var child = safeCopy( oldChildren[i2] ),
                        sourceUrl = child.sourceUrl
                    child.id = child.id + '.' + node.id
                    child.route = child.route + '.' + node.id;
                    child.parentName = node.label
                    // The child is a copy. We need to put it in the cache.
                    // TODO: We need better coordination with navigation. This works, but I think it's a kludge
                    // TODO: We didn't remove the old treeNode from the cache. It might even have a listener that will fire.
                    navigation.putTreeNodeByMenuId( child.id, child)
                    node.children.push( child)
                    if( sourceUrl) {
                        if( sourceUrl.indexOf( '$parent'))
                            child.sourceUrl = sourceUrl.replace( '$parent', node.id)
                        loadTreeNodesFromSource( node.children, node.children.length-1, child)
                    }
                }
            }
        }
    }

    function getNavTreeSuccess( data) {
      data.forEach( function(node, index) {
        if( node.sourceUrl)
          loadTreeNodesFromSource( data, index, node)
      })
    }

    return navigation.getNavTree( $attrs.href, 'navTree', $scope, getNavTreeSuccess)
  }]).
  directive('navTree', function(){
    // <nav-tree href='/coral/menus/analysis'>
    return {
      restrict: 'E', // Element name
      scope: true,
      controller: 'NavTreeController',
      list: function(scope, element, $attrs) {}
    }
  } ).

  // If badge count is 0, return empty string.
  filter('badgeCount', function() {
    return function ( count ) {
      if ( count > 0 )
        return count
      else
        return ''
    }
  });
