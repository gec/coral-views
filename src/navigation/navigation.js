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

angular.module('greenbus.views.navigation', ['ui.bootstrap', 'ui.router', 'greenbus.views.rest']).

/**
 * Service for getting NavigationElements from server and populating NavTree menu items.
 * Each level of the NavTree is loaded incrementally based on the NavigationElements and the
 * current model.
 *
 * Goals:
 *
 * The view controller waits for the menu items to be loaded before being initialized. The
 * NavigationElement, in turn, calls menuSelect when items are finished loading (to initialize
 * the controller).
 *
 * When menu item is selected, the navigation controller needs to pass some information to the target controller.
 *
 * Params:
 *
 * id - If the menu item is Equipment, we pass the entity id (UUID); otherwise, it's undefined.
 * equipmentChildren - Immediate children that are Equipment or EquipmentGroup.
 *
 * TODO: We don't need the microgridId. It's in the hierarchical ui-router state params.
 *
 * Usage Scenarios:
 *
 * navigation.getNavTree($attrs.href, 'navTree', $scope, $scope.menuSelect)
 *
 */
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
        NavigationClass              = {
          MicroGrid:      'MicroGrid',
          EquipmentGroup: 'EquipmentGroup',
          EquipmentLeaf:  'EquipmentLeaf',
          Sourced:        'Sourced'   // Ex: 'All PVs'. Has sourceUrl, bit no data
        },
        equipmentIdToTreeNodeCache = new NotifyCache()


    function getNavigationClass(entity) {
      if( entity.types.indexOf(NavigationClass.MicroGrid) >= 0 )
        return NavigationClass.MicroGrid;
      else if( entity.types.indexOf(NavigationClass.EquipmentGroup) >= 0 )
        return NavigationClass.EquipmentGroup;
      else
        return NavigationClass.EquipmentLeaf
    }

    function stripParentName(childName, parentName) {
      if( parentName && childName.lastIndexOf(parentName, 0) === 0 )
        return childName.substr(parentName.length + 1) // plus 1 for the dot delimeter
      else
        return childName
    }

    // Make a copy of the children that are equipment (as apposed to other menu items).
    //
    // Need a copy of entities to pass to state transition target. If it's just the branch children,
    // the AngularJS digest consumes all the CPU
    //
    function shallowCopyEquipmentChildren( branch) {
      var equipmentChildren = []

      if(  !branch.children)
        return equipmentChildren

      branch.children.forEach( function( child) {
        if( child.class === NavigationClass.EquipmentLeaf || child.class === NavigationClass.EquipmentGroup) {
          equipmentChildren.push( {
            id: child.id,
            name: child.name,
            shortName: child.shortName
          })
        }
      })

      return equipmentChildren
    }

    function entityToTreeNode(entityWithChildren, parent) {
      // Could be a simple entity.
      var entity = entityWithChildren.entity || entityWithChildren

      var microgridId, state,
          shortName = entity.name,
          name      = entity.name

      // Types: (Microgrid, Root), (EquipmentGroup, Equipment), (Equipment, Breaker)
      var containerType = getNavigationClass(entity)
      if( entity.class)
        console.error( 'entityToTreeNode entity.class=' + entity.class)
      if( entity.state)
        console.error( 'entityToTreeNode entity.state=' + entity.state)

      switch( containerType ) {
        case NavigationClass.MicroGrid:
          microgridId = entity.id
          break;
        case NavigationClass.EquipmentGroup:
          if( parent ) {
            if( parent.microgridId )
              microgridId = parent.microgridId
            state = entity.state || ( parent.state + 'Id')
          }
          break;
        case NavigationClass.EquipmentLeaf:
          if( parent ) {
            if( parent.microgridId )
              microgridId = parent.microgridId
            state = entity.state || ( parent.state + 'Id')
          }
          break;
        case NavigationClass.Sourced:
          if( parent ) {
            if( parent.microgridId )
              microgridId = parent.microgridId
            state = entity.state || ( parent.state + 'Sourced')
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
        label:         shortName,
        id:            entity.id,
        type:          'item',
        types:         entity.types,
        class:         containerType,
        state:         state,
        equipmentChildren: shallowCopyEquipmentChildren(entity),
        children:      entityWithChildren.children ? entityChildrenListToTreeNodes(entityWithChildren.children, entity) : []
      }
    }

    function entityChildrenListToTreeNodes(entityWithChildrenList, parent) {
      var ra = []
      entityWithChildrenList.forEach(function(entityWithChildren) {
        var treeNode = entityToTreeNode(entityWithChildren, parent)
        ra.push(treeNode)
        equipmentIdToTreeNodeCache.put(treeNode.id, treeNode)
      })
      return ra
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

    function callMenuSelectOnFirstSelectedItem_or_callWhenLoaded( navigationElements, scope, menuSelect) {
      var selected = findFirstSelected(navigationElements)
      if( selected) {
        if( selected.sourceUrl) {
          // @param menuItem  The selected item. The original (current scoped variable 'selected') could have been replaced.
          selected.selectWhenLoaded = function( menuItem) {
            menuSelect.call( scope, menuItem)
          }
        } else {
          menuSelect.call( scope, selected)
        }
      }
    }

    function safeCopy(o) {
      var clone = angular.copy(o);
      // Angular adds uid to all objects. uid cannot be a duplicate.
      // Angular will generate a uid for this object on next digest.
      delete clone.uid;
      return clone
    }

    function insertTreeNodeChildren(parent, newChildren) {
      // Append to any existing children
      parent.children = parent.children.concat(newChildren)
      parent.equipmentChildren = shallowCopyEquipmentChildren( parent)

      parent.loading = false
      if( parent.selectWhenLoaded) {
        parent.selectWhenLoaded( parent);
        delete parent.selectWhenLoaded;
      }

    }

    function getParentStatePrefix( parentState) {
      var prefix = parentState,
          index = parentState.indexOf( '.dashboard')
      if( index >=0)
        prefix = parentState.substr( 0, index) // index, length
      return prefix
    }

    // If child state start with '.', append it to the parentStatePrefix; otherwise,
    // the child state is absolute and just return it.
    //
    function getNestedChildState( parentStatePrefix, childState) {
      if( childState.indexOf( '.') === 0)
        return parentStatePrefix + childState
      else
        return childState
    }

    /**
     * Generate newTreeNodes using parentTree[index] as a template.
     * - Remove parentTree[index]
     * - For each newTreeNode, insert at index and copy the removed templates children as childrent for newTreeNode.
     *
     * BEFORE:
     *
     *   loading...
     *     Equipment
     *     Solar
     *     Energy Storage
     *
     * AFTER:
     *
     *   Microgrid1
     *     Equipment1
     *       Brkr1
     *       PV1
     *       ...
     *     Solar
     *       PV1
     *       ...
     *     Energy Storage
     *       ...
     *   Microgrid2
     *     ...
     *
     * @param parentTree
     * @param index
     * @param newTreeNodes
     */
    function generateNewTreeNodesAtIndexAndPreserveChildren(parentTree, index, newTreeNodes, scope) {
      var i,
          oldParent   = parentTree[index],
          oldChildren = oldParent.children
      // Remove the child we're replacing.
      parentTree.splice(index, 1)

      for( i = newTreeNodes.length - 1; i >= 0; i-- ) {
        var newParentStatePrefix,
            newParent = newTreeNodes[i]
        newParent.state = oldParent.state
        newParentStatePrefix = getParentStatePrefix( newParent.state)
        parentTree.splice(index, 0, newParent)

        // For each new child that we're adding, replicate the old children.
        // Replace $parent in the sourceUrl with its current parent.
        if( oldChildren && oldChildren.length > 0 ) {
          var i2
          for( i2 = 0; i2 < oldChildren.length; i2++ ) {
            var child     = safeCopy(oldChildren[i2]),
                sourceUrl = child.sourceUrl
            //child.state = child.state + '.' + node.id
            child.parentName = newParent.label
            child.parentId = newParent.id
            child.microgridId = newParent.microgridId
            child.state = getNestedChildState( newParentStatePrefix, child.state)
            // The child is a copy. We need to put it in the cache.
            // TODO: We need better coordination with  This works, but I think it's a kludge
            // TODO: We didn't remove the old treeNode from the cache. It might even have a listener that will fire.
            //putTreeNodeByMenuId(child.state, child)
            newParent.children.push(child)
            if( sourceUrl ) {
              if( sourceUrl.indexOf('$parent') )
                child.sourceUrl = sourceUrl.replace('$parent', newParent.id)
              loadTreeNodesFromSource(newParent.children, newParent.children.length - 1, child, scope)
            }
          }
        }

        // If the oldParent was marked selected and waiting until it was loaded; now we're loaded and we
        // need to select one of these new menu items. We'll pick the first one (which is i === 0).
        //
        if( i === 0 && oldParent.selectWhenLoaded) {
          oldParent.selectWhenLoaded( newParent);
          delete oldParent.selectWhenLoaded; // just in case
        }

      }
    }

    function loadTreeNodesFromSource(parentTree, index, child, scope) {
      parentTree[index].loading = true
      getTreeNodes(child.sourceUrl, scope, child, function(newTreeNodes) {
        switch( child.insertLocation ) {
          case 'CHILDREN':
            // Insert the resultant children before any existing static children.
            insertTreeNodeChildren(child, newTreeNodes)
            break;
          case 'REPLACE':
            generateNewTreeNodesAtIndexAndPreserveChildren(parentTree, index, newTreeNodes, scope)
            // original child was replaced.
            child = parentTree[index]
            break;
          default:
            console.error('navTreeController.loadTreeNodesFromSource.getTreeNodes Unknown insertLocation: ' + child.insertLocation)
        }

        //child.loading = false
        //if( child.selectWhenLoaded) {
        //  child.selectWhenLoaded( child);
        //  delete child.selectWhenLoaded;
        //}
      })

    }

    function getTreeNodes(sourceUrl, scope, parent, successListener) {
      rest.get(sourceUrl, null, scope, function(entityWithChildrenList) {
        var treeNodes = entityChildrenListToTreeNodes(entityWithChildrenList, parent)
        successListener(treeNodes)
      })
    }

    /**
     * Public API
     */
    return {

      NavigationClass: NavigationClass,

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

      getTreeNodes: getTreeNodes,

      /**
       * Main call to get NavigationElements and populate the navTree menu. After retieving the NavigationElements,
       * start retrieving the model entities referenced by NavigationElements (via sourceUrl).
       *
       * @param url URL for retrieving the NavigationElements.
       * @param name Store the navTree on scope.name
       * @param scope The controller scope
       * @param menuSelect Notify method to call when the NavigationElement marked as selected is finished loading.
       */
      getNavTree: function(url, name, scope, menuSelect) {
        rest.get(url, name, scope, function(navigationElements) {
          // example: [ {class:'NavigationItem', data: {label:Dashboard, state:dashboard, url:#/dashboard, selected:false, children:[]}}, ...]
          flattenNavigationElements(navigationElements)

          callMenuSelectOnFirstSelectedItem_or_callWhenLoaded( navigationElements, scope, menuSelect)

          navigationElements.forEach(function(node, index) {
            if( node.sourceUrl )
              loadTreeNodesFromSource(navigationElements, index, node, scope)
          })

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
      console.log('NavTreeController.menuSelect ' + branch.label + ', state=' + branch.state + ', class=' + branch.class + ', microgridId=' + branch.microgridId)

      if( branch.loading ) {
        console.errror('NavTreeController.menuSelect LOADING! ' + branch.label + ', state=' + branch.state + ', class=' + branch.class + ', microgridId=' + branch.microgridId)
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
            equipmentChildren: branch.equipmentChildren // children that are equipment
          }
        },
        options = {
          // TODO: Added this when didn't fully understand hierarchical states. May not need reload.
          // reload controller even if the same state. All equipment under "Equipment" is state: microgrids.equipments.id.
          // The controller needs to be reloaded with the equipment ID.
          // Seems to have a bug. If it's NOT the same state, it reloads the current state.
          //
          reload: $state.current.name === branch.state
        }

      if( branch.sourceUrl )
        params.sourceUrl = branch.sourceUrl

      $state.go(branch.state, params, options)
    }


    return navigation.getNavTree($attrs.href, 'navTree', $scope, $scope.menuSelect)
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
