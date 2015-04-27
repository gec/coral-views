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
  factory('navigation', ['rest', function(rest) {   // was navigation

    function NotifyCache() {
      this.cache = {}
      this.listeners = {}
    }

    NotifyCache.prototype.put = function(key, value) {
      this.cache[key] = value
      var notifyList = this.listeners[key]
      if( notifyList ) {
        notifyList.forEach(function(notify) { notify(key, value)})
        delete this.listeners[key];
      }
    }
    NotifyCache.prototype.addListener = function(key, listener) {
      var listenersForId = this.listeners[key]
      if( listenersForId )
        listenersForId.push(listener)
      else
        this.listeners[key] = [listener]
    }
    NotifyCache.prototype.get = function(key, listener) {
      var value = this.cache[key]
      if( !value && listener )
        this.addListener(key, listener)
      return value
    }


    var self                       = this,
        ContainerType              = {
          MicroGrid:      'MicroGrid',
          EquipmentGroup: 'EquipmentGroup',
          EquipmentLeaf:  'EquipmentLeaf',
          Sourced:        'Sourced'   // Ex: 'All PVs'. Has sourceUrl, bit no data
        },
        equipmentIdToTreeNodeCache = new NotifyCache(),
        menuIdToTreeNodeCache      = new NotifyCache()


    function getContainerType(entity) {
      if( entity.types.indexOf(ContainerType.MicroGrid) >= 0 )
        return ContainerType.MicroGrid;
      else if( entity.types.indexOf(ContainerType.EquipmentGroup) >= 0 )
        return ContainerType.EquipmentGroup;
      else
        return ContainerType.EquipmentLeaf
    }

    function stripParentName(childName, parentName) {
      if( parentName && childName.lastIndexOf(parentName, 0) === 0 )
        return childName.substr(parentName.length + 1) // plus 1 for the dot delimeter
      else
        return childName
    }

    function getChildIds(entity) {
      if( entity.children )
        return entity.children.map(function(child) { return child.id})
      else
        return []
    }

    function entityToTreeNode(entityWithChildren, parent) {
      // Could be a simple entity.
      var entity = entityWithChildren.entity || entityWithChildren

      var microgridId, state,
          shortName = entity.name,
          name      = entity.name

      // Types: (Microgrid, Root), (EquipmentGroup, Equipment), (Equipment, Breaker)
      var containerType = getContainerType(entity)
      if( entity.class)
        console.error( 'entityToTreeNode entity.class=' + entity.class)
      if( entity.state)
        console.error( 'entityToTreeNode entity.state=' + entity.state)

      //var url = null
      switch( containerType ) {
        case ContainerType.MicroGrid:
          microgridId = entity.id
          //url = '/measurements?equipmentIds=' + entity.id + '&depth=9999'
          break;
        case ContainerType.EquipmentGroup:
          if( parent ) {
            if( parent.microgridId )
              microgridId = parent.microgridId
            state = entity.state || ( parent.state + '.id')
          }
          //url = '/measurements?equipmentIds=' + entity.id + '&depth=9999'
          break;
        case ContainerType.EquipmentLeaf:
          if( parent ) {
            if( parent.microgridId )
              microgridId = parent.microgridId
            state = entity.state || ( parent.state + '.id')
          }
          //url = '/measurements?equipmentIds=' + entity.id
          break;
        case ContainerType.Sourced:
          if( parent ) {
            if( parent.microgridId )
              microgridId = parent.microgridId
            state = entity.state || ( parent.state + '.sourced')
          }
          break;
        default:
      }


      if( entity.parentName )
        shortName = stripParentName(name, entity.parentName)
      else if( parent )
        shortName = stripParentName(name, parent.parentName)

      return {
        microgridId:   microgridId,
        name:          name,
        //entity: entity,
        label:         shortName,
        id:            entity.id,
        type:          'item',
        types:         entity.types,
        class:         containerType,
        state:         state,
        //url: url,
        childIds:      getChildIds(entity),
        children:      entityWithChildren.children ? entityChildrenListToTreeNodes(entityWithChildren.children, entity) : []
      }
    }

    function entityChildrenListToTreeNodes(entityWithChildrenList, parent) {
      var ra = []
      entityWithChildrenList.forEach(function(entityWithChildren) {
        var treeNode = entityToTreeNode(entityWithChildren, parent)
        ra.push(treeNode)
        equipmentIdToTreeNodeCache.put(treeNode.state, treeNode)
      })
      return ra
    }

    function cacheNavItems(items) {
      items.forEach(function(item) {
        if( item.class === 'NavigationItem' || item.class === 'NavigationItemSource' )
          menuIdToTreeNodeCache.put(item.state, item)
        if( item.children.length > 0 )
          cacheNavItems(item.children)
      })
    }

    /**
     * Convert array of { 'class': 'className', data: {...}} to { 'class': 'className', ...}
     * @param navigationElements
     */
    function flattenNavigationElements(navigationElements) {
      navigationElements.forEach(function(element, index) {
        var data = element.data;
        delete element.data;
        angular.extend(element, data)
        flattenNavigationElements(element.children)
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
      getTreeNodeByEquipmentId: function(equipmentId, notifyWhenAvailable) { return equipmentIdToTreeNodeCache.get(equipmentId, notifyWhenAvailable)},

      /**
       * Get the tree node by menu Id. This returns immediately with the value
       * or null if the menu item is not available yet. If not available,
       * notifyWhenAvailable will be called when available.
       *
       * @param menuId The menu id to retrieve
       * @param notifyWhenAvailable function( id, treeNode)
       * @returns TreeNode if available, otherwise null.
       */
      getTreeNodeByMenuId: function(menuId, notifyWhenAvailable) { return menuIdToTreeNodeCache.get(menuId, notifyWhenAvailable)},

      /**
       *
       * @param menuId The menu id to put
       * @param treeNode
       */
      putTreeNodeByMenuId: function(menuId, treeNode) { return menuIdToTreeNodeCache.put(menuId, treeNode)},

      getTreeNodes: function(sourceUrl, scope, parent, successListener) {
        rest.get(sourceUrl, null, scope, function(entityWithChildrenList) {
          var treeNodes = entityChildrenListToTreeNodes(entityWithChildrenList, parent)
          successListener(treeNodes)
        })
      },

      getNavTree: function(url, name, scope, successListener) {
        rest.get(url, name, scope, function(data) {
          // example: [ {class:'NavigationItem', data: {label:Dashboard, state:dashboard, url:#/dashboard, selected:false, children:[]}}, ...]
          flattenNavigationElements(data)
          cacheNavItems(data)
          if( successListener )
            successListener(data)
        })
      }
    } // end return Public API

  }]). // end factory 'navigation'

  controller('NavBarTopController', ['$scope', '$attrs', '$location', '$cookies', 'rest', function($scope, $attrs, $location, $cookies, rest) {
    $scope.loading = true
    $scope.applicationMenuItems = []
    $scope.sessionMenuItems = []
    $scope.application = {
      label: 'loading...',
      url:   ''
    }
    $scope.userName = $cookies.userName

    $scope.getActiveClass = function(item) {
      return ( $location.absUrl().indexOf(item.url) >= 0) ? 'active' : ''
    }

    /**
     * Convert array of { 'class': 'className', data: {...}} to { 'class': 'className', ...}
     * @param navigationElements
     */
    function flattenNavigationElements(navigationElements) {
      navigationElements.forEach(function(element, index) {
        var data = element.data;
        delete element.data;
        angular.extend(element, data)
        flattenNavigationElements(element.children)
      })
    }

    function onSuccess(json) {
      flattenNavigationElements(json)
      $scope.application = json[0]
      $scope.applicationMenuItems = json[0].children
      $scope.sessionMenuItems = json[1].children
      console.log('navBarTopController onSuccess ' + $scope.application.label)
      $scope.loading = false
    }

    return rest.get($attrs.href, 'data', $scope, onSuccess)
  }]).
  directive('navBarTop', function() {
    // <nav-bar-top url='/menus/admin'
    return {
      restrict:    'E', // Element name
      // This HTML will replace the alarmBanner directive.
      replace:     true,
      transclude:  true,
      scope:       true,
      templateUrl: 'greenbus.views.template/navigation/navBarTop.html',
      controller:  'NavBarTopController'
    }
  }).

  controller('NavListController', ['$scope', '$attrs', 'rest', function($scope, $attrs, rest) {
    $scope.navItems = [{'class': 'NavigationHeader', label: 'loading...'}]

    $scope.getClass = function(item) {
      switch( item.class ) {
        case 'NavigationDivider':
          return 'divider'
        case 'NavigationHeader':
          return 'nav-header'
        case 'NavigationItemToPage':
          return ''
        case 'NavigationItem':
          return ''
        case 'NavigationItemSource':
          return ''
        default:
          return ''
      }
    }

    return rest.get($attrs.href, 'navItems', $scope)
  }]).
  directive('navList', function() {
    // <nav-list href='/coral/menus/admin'>
    return {
      restrict:    'E', // Element name
      // This HTML will replace the alarmBanner directive.
      replace:     true,
      transclude:  true,
      scope:       true,
      templateUrl: 'greenbus.views.template/navigation/navList.html',
      controller:  'NavListController'
    }
  }).

  controller('NavTreeController', ['$scope', '$attrs', '$location', '$state', '$cookies', 'rest', 'navigation', function($scope, $attrs, $location, $state, $cookies, rest, navigation) {

    $scope.navTree = [
      {
        class:    'Loading',
        state:    'loading',
        loading:  true,
        label:    'loading..',
        children: [],
        data:     {
          regex:           '^[^/]+',
          count:           0,
          newMessageCount: 1,
          depth:           0
        }
      }
    ]
    // GET /models/1/equipment?depth=3&rootTypes=Root
    var sampleGetResponse = [
      {
        'entity':   {
          'name':  'Some Microgrid',
          'id':    'b9e6eac2-be4d-41cf-b82a-423d90515f64',
          'types': ['Root', 'MicroGrid']
        },
        'children': [
          {
            'entity':   {
              'name':  'MG1',
              'id':    '03c2db16-0f78-4800-adfc-9dff9d4598da',
              'types': ['Equipment', 'EquipmentGroup']
            },
            'children': []
          }
        ]
      }
    ]

    $scope.menuSelect = function(branch) {
      console.log('navTreeController.menuSelect ' + branch.label + ', state=' + branch.state + ', class=' + branch.class + ', microgridId=' + branch.microgridId + ', url=' + branch.url)

      if( branch.loading ) {
        $state.go('loading')
        return
      }

      // NOTE: These params are only passed to the controller if each parameter is defined in
      // the target state's URL params or non-URL params. Ex: params: {navigationElement: null}
      //
      var params = {
        microgridId:       branch.microgridId,
        navigationElement: {
          class:     branch.class,
          id:        branch.id,
          name:      branch.name,      // full entity name
          shortName: branch.label,
          childIds:  branch.childIds
        }
      }
      if( branch.sourceUrl )
        params.sourceUrl = branch.sourceUrl

      // reload controller even if the same state. All equipment under "Equipment" is state: microgrids.equipments.id.
      // The controller needs to be reloaded with the equipment ID.
      //
      $state.go(branch.state, params, {reload: true})

      //var url = branch.url
      //if( branch.sourceUrl)
      //    url = url + '?sourceUrl=' + encodeURIComponent(branch.sourceUrl)
      //$location.url( url)
    }

    function populateChildrenUrlsFromParent(parent, children) {
      children.forEach(function(child) {
        child.url = parent.url + '/' + child.id
        //child.microgridId = parent.microgridId
      })
    }

    function loadTreeNodesFromSource(parentTree, index, child, selected) {
      parentTree[index].loading = true
      navigation.getTreeNodes(child.sourceUrl, $scope, child, function(newTreeNodes) {
        switch( child.insertLocation ) {
          case 'CHILDREN':
            // Insert the resultant children before any existing static children.
            populateChildrenUrlsFromParent(child, newTreeNodes)
            child.children = newTreeNodes.concat(child.children)
            break;
          case 'REPLACE':
            replaceTreeNodeAtIndexAndPreserveChildren(parentTree, index, newTreeNodes)
            child = parentTree[index]
            break;
          default:
            console.error('navTreeController.loadTreeNodesFromSource.getTreeNodes Unknown insertLocation: ' + child.insertLocation)
        }

        child.loading = false
        if( selected )
          $scope.menuSelect( child)
      })

    }

    function safeCopy(o) {
      var clone = angular.copy(o);
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
    function replaceTreeNodeAtIndexAndPreserveChildren(parentTree, index, newTreeNodes) {
      var i,
          oldParent   = parentTree[index],
          oldChildren = oldParent.children
      // Remove the child we're replacing.
      parentTree.splice(index, 1)

      for( i = newTreeNodes.length - 1; i >= 0; i-- ) {
        var newParent = newTreeNodes[i]
        newParent.url = oldParent.url.replace('$this', newParent.id)
        newParent.state = oldParent.state
        //newParent.microgridId = newParent.id  // already set in entityToTreeNode
        parentTree.splice(index, 0, newParent)
        // For each new child that we're adding, replicate the old children.
        // Replace $parent in the sourceUrl with its current parent.
        if( oldChildren && oldChildren.length > 0 ) {
          var i2
          for( i2 = 0; i2 < oldChildren.length; i2++ ) {
            var child     = safeCopy(oldChildren[i2]),
                sourceUrl = child.sourceUrl
            //child.state = child.state + '.' + node.id
            //child.url = child.url + '.' + node.id;
            child.parentName = newParent.label
            child.parentId = newParent.id
            child.microgridId = newParent.microgridId
            child.state = newParent.state + '.' + child.state
            child.url = child.url.replace('$parent', newParent.id)
            // The child is a copy. We need to put it in the cache.
            // TODO: We need better coordination with navigation. This works, but I think it's a kludge
            // TODO: We didn't remove the old treeNode from the cache. It might even have a listener that will fire.
            navigation.putTreeNodeByMenuId(child.state, child)
            newParent.children.push(child)
            if( sourceUrl ) {
              if( sourceUrl.indexOf('$parent') )
                child.sourceUrl = sourceUrl.replace('$parent', newParent.id)
              loadTreeNodesFromSource(newParent.children, newParent.children.length - 1, child)
            }
          }
        }
      }
    }

    /**
     * Breadth-first search of first menu item where selected = true.
     * If none found, return undefined. This means the designer doesn't want a menu item selected at
     * startup.
     *
     * @param navigationElements The array of Navigation Elements.
     * @returns The first NavigationElement where selected is true; otherwise return undefined.
     */
    function findFirstSelected(navigationElements) {
      var i, node, selected

      if( !navigationElements || navigationElements.children === 0 )
        return undefined

      // Breadth first search
      for( i = 0; i < navigationElements.length; i++ ) {
        node = navigationElements[i]
        if( node.selected ) {
          return node
        }
      }

      // Deep search
      for( i = 0; i < navigationElements.length; i++ ) {
        node = navigationElements[i]
        if( node.children && node.children.length > 0 ) {
          selected = findFirstSelected(node.children)
          if( selected )
            return selected
        }
      }

      return undefined
    }

    function getNavTreeSuccess(navigationElements) {
      var selected = findFirstSelected(navigationElements)
      navigationElements.forEach(function(node, index) {
        if( node.sourceUrl )
          loadTreeNodesFromSource(navigationElements, index, node, node === selected)
        else {
          if( node === selected )
            $scope.menuSelect(node)
        }
      })
    }

    return navigation.getNavTree($attrs.href, 'navTree', $scope, getNavTreeSuccess)
  }]).
  directive('navTree', function() {
    // <nav-tree href='/coral/menus/analysis'>
    return {
      restrict:   'E', // Element name
      scope:      true,
      controller: 'NavTreeController',
      list:       function(scope, element, $attrs) {}
    }
  }).

  // If badge count is 0, return empty string.
  filter('badgeCount', function() {
    return function(count) {
      if( count > 0 )
        return count
      else
        return ''
    }
  });
