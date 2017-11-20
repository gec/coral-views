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
 * When loading, what needs to be selected first? The ui.router state takes priority (the URL specifies what gets
 * selected). If the URL doesn't specify an item, then select the first menu item (or perhaps let the menu query result
 * specify what is selected). The menu may be loading, so the actual selection may need to wait.
 *
 * State #/microgrids/Zone1/equipments/ESS1 is different than state #/microgrids/Zone1/esses/ESS1 because a different
 * part of the tree is selected (note: actual URLs contain UUIDs rather than names).
 *
 * When menu item is selected, the NavTreeController needs to pass some information to the target controller.
 *
 *
 * Sudo code:
 *   Load NavTree menu
 *   if state == 'loading' then
 *     get default selection in menu, select it, call menuSelect to change state
 *   else
 *     select the menu item associated with the given state
 *     When menuSelect is call, we don't change state.
 *
 * Time line: Loading without initial URL/state
 * 1. State: loading
 * 2. Load left menu
 * 3. If
 *
 *
 * Params:
 *
 * microgridId - If we're coming from the 'loading' state, there is no microgridId specified in the URL, so we need to
 *               supply it. Once we have a nested state, the microgridId will be propagated by ui.router; unless,
 *               of course, we are selecting a menu item under a different microgrid or no microgrid (ex: alarms).
 * navigationElement: {
 *   class:             NavigationElement class name or entity type. Examples: NavigationItem, MicroGrid, EquipmentLeaf
 *   id:                Entity UUID or undefined
 *   name:              Full entity name
 *   shortName:         Visible menu tree label
 *   equipmentChildren: Array of immediate children that are Equipment or EquipmentGroup.
 *                      Each element is {id, name, shortName}
 * }
 *
 * Usage Scenarios:
 *
 * navigation.getNavTree($attrs.href, 'navTree', $scope, $scope.menuSelect)
 *
 */
  factory('navigation', ['rest', '$q', function(rest, $q) {   // was navigation

    var self = this,
        NavigationClass              = {
          MicroGrid:      'MicroGrid',
          EquipmentGroup: 'EquipmentGroup',
          EquipmentLeaf:  'EquipmentLeaf',
          Sourced:        'Sourced'   // Ex: 'All PVs'. Has sourceUrl, bit no data
        },
        exports = {
          STATE_LOADING: 'loading',
          NavigationClass: NavigationClass
        }

    function NotifyCache() {
      this.cache = {}
      this.deferredSetMapByKey = {} // deferredSet is {deferred: deferred, isReady: function(treeNode){}}
    }

    NotifyCache.prototype.put = function(key, value) {
      this.cache[key] = value
      this.notifyDo( key, value)
    }
    NotifyCache.prototype.notify = function(key) {
      var value = this.cache[key]
      this.notifyDo( key, value)
    }
    NotifyCache.prototype.notifyDo = function(key, value) {
      if( value === undefined)
        return
      var deferredSets = this.deferredSetMapByKey[key]
      if( deferredSets ) {
        var i = deferredSets.length,
            deferredSetsNotReady = []
        // Delete the list before resolving deferredSets, just in case.
        delete this.deferredSetMapByKey[key];
        while( i--) {
          var deferredSet = deferredSets[i]
          if( deferredSet.isReady === undefined || deferredSet.isReady( value))
            deferredSet.deferred.resolve(value)
          else
            deferredSetsNotReady[deferredSetsNotReady.length] = deferredSet
        }
        if( deferredSetsNotReady.length > 0)
          this.deferredSetMapByKey[key] = deferredSetsNotReady
      }
    }
    NotifyCache.prototype.addDeferredSet = function(key, deferred, isReady) {
      var deferredSetsForId = this.deferredSetMapByKey[key],
          deferredSet = {deferred: deferred, isReady: isReady}
      if( deferredSetsForId )
        deferredSetsForId.push(deferredSet)
      else
        this.deferredSetMapByKey[key] = [deferredSet]
    }

    /**
     * Get the 
     * @param key
     * @param isReady
     * @returns {*|promise|{then, catch, finally}|jQuery.promise|{then, always}}
     */
    NotifyCache.prototype.get = function(key, isReady) {
      var deferred = $q.defer(),
          value = this.cache[key]
      if( value !== undefined && (isReady === undefined || isReady(value)))
        deferred.resolve( value)
      else
        this.addDeferredSet(key, deferred, isReady)
      return deferred.promise
    }


    var equipmentIdToTreeNodeCache = new NotifyCache(), // key is equipmentId
        stateEquipmentIdToTreeNodeCache = new NotifyCache() // key is state + equipmentId


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
        // abn-tree-directive uses 'selected', but also stores current selection. If selected is true, the css will
        // show the item as selected, but abn-tree-directive doesn't know it, so doesn't deselect it before selecting
        // something else.
        if( element.selected) {
          element.gbInitialSelection = element.selected
          element.selected = false
        }
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
    function findInitialSelection(navigationElements) {
      var i, node, selected

      if( !navigationElements || navigationElements.length === 0 )
        return undefined

      // Breadth first search
      for( i = 0; i < navigationElements.length; i++ ) {
        node = navigationElements[i]
        if( node.gbInitialSelection ) {
          return node
        }
      }

      // Deep search
      for( i = 0; i < navigationElements.length; i++ ) {
        node = navigationElements[i]
        if( node.children && node.children.length > 0 ) {
          selected = findInitialSelection(node.children)
          if( selected )
            return selected
        }
      }

      return undefined
    }

    function callMenuSelectOnFirstSelectedItem_or_callWhenLoaded( navigationElements, scope, onNavTreeLoaded) {
      var initialSelection = findInitialSelection(navigationElements)
      if( initialSelection && initialSelection.sourceUrl) {
        // @param menuItem  The selected item. The original (current scoped variable 'selected') could have been replaced.
        initialSelection.selectWhenLoaded = function( treeNode) {
          onNavTreeLoaded.call( scope, treeNode)
        }
      } else {
        onNavTreeLoaded.call( scope, initialSelection)
      }
    }

    function safeCopy(o) {
      var clone = angular.copy(o);
      // Angular adds uid to all objects. uid cannot be a duplicate.
      // Angular will generate a uid for this object on next digest.
      delete clone.uid;
      return clone
    }

    function fixInsertedChildrenWithAbnTreeUids( parent) {
      var children = parent.children
      if( !parent.uid)
        parent.uid = '' + Math.random()
      var i = children ? children.length : 0
      while( i--) {
        var child = children[i]
        child.uid = '' + Math.random()
        child.parent_uid = parent.uid
        if( child.children && child.children.length > 0)
          fixInsertedChildrenWithAbnTreeUids(child)
      }
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
      fixInsertedChildrenWithAbnTreeUids( parent)
      stateEquipmentIdToTreeNodeCache.notify( getCacheKey(parent))
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
     * @param parentTree ex: Loading...
     * @param index ex: 0
     * @param newTreeNodes ex: Zone1, Zone2
     */
    function generateNewTreeNodesAtIndexAndPreserveChildren(parentTree, index, newTreeNodes, scope) {
      var i,
          oldParent   = parentTree[index],
          oldChildren = oldParent.children  // ex: Equipment, Solar, Energy Storage, ...

      for( i = newTreeNodes.length - 1; i >= 0; i-- ) {
        var newParentStatePrefix,
            newParent = newTreeNodes[i]
        newParent.state = oldParent.state
        newParentStatePrefix = getParentStatePrefix( newParent.state)
        //var lastNewParentIndex0 = {
        //  children: [],
        //  class: "MicroGrid",
        //  label: "Zone1",
        //  state: "microgrids.dashboard",
        //
        //  name: "Zone1",
        //  id: "67bab1df-9348-46bb-8af3-f71e3f3fdf1a",
        //  equipmentChildren: [],
        //  microgridId: "67bab1df-9348-46bb-8af3-f71e3f3fdf1a",
        //  type: "item",
        //  types: ["Equipment", "MicroGrid", "EquipmentGroup"]
        //}
        //var __oldParent = {
        //  children: [], //Array[5],
        //  class: "NavigationItemSource",
        //  label: "Loading...",
        //  state: "microgrids.dashboard",
        //
        //  classes: [],
        //  expanded: false,
        //  insertLocation: "REPLACE",
        //  loading: true,
        //  selectWhenLoaded: null, // function( menuItem)
        //  selected: true,
        //  sourceUrl: "/models/1/equipment?depth=1&rootTypes=MicroGrid",
        //  uid: "0.9992117963265628"
        //}
        if( i === 0) {
          // overwrite oldParent with newParent's contents so the menu item remains selected.
          newParent.selected = oldParent.selected
          for(var key in newParent ) {
            oldParent[key] = newParent[key]
          }
          delete oldParent.insertLocation;
          delete oldParent.sourceUrl;
          oldParent.loading = false
          newParent = oldParent
        } else {
          // Insert after the oldParent
          parentTree.splice(index+1, 0, newParent)
        }

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
              getTreeNodesForChildSourceUrlAndInsertInParentTree(newParent.children, newParent.children.length - 1, child, scope)
            }
          }
        }

        fixInsertedChildrenWithAbnTreeUids( newParent)
        stateEquipmentIdToTreeNodeCache.put( getCacheKey(newParent), newParent)

        // If the oldParent was marked selected and waiting until it was loaded; now we're loaded and we
        // need to select one of these new menu items. We'll pick the first one (which is i === 0).
        //
        if( i === 0 && oldParent.selectWhenLoaded) {
          oldParent.selectWhenLoaded( oldParent);
          delete oldParent.selectWhenLoaded; // just in case
        }


      }

    }

    function getCacheKey( node) {
      return node.hasOwnProperty('id') ? node.state + '.' + node.id
        : node.hasOwnProperty('microgridId') ? node.state + '.' + node.microgridId
        : node.state
    }

    function cacheTreeNodeChildren( parent) {
      var children = parent.children
      var i = children ? children.length : 0
      while( i--) {
        var child = children[i]
        // Some children are menu items and some are equipment entities with IDs.
        if( child.id)
          equipmentIdToTreeNodeCache.put(child.id, child)
        stateEquipmentIdToTreeNodeCache.put( getCacheKey(child), child)

        child.uid = '' + Math.random()
        child.parent_uid = parent.uid
        if( child.children && child.children.length > 0)
          cacheTreeNodeChildren(child)
      }
    }

    function getTreeNodesForChildSourceUrlAndInsertInParentTree(parentTree, index, child, scope) {
      child.loading = true
      return getTreeNodes(child.sourceUrl, scope, child).then(
          function(response) {
            var newTreeNodes = response.data
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
                console.error('navTreeController.getTreeNodesForChildSourceUrlAndInsertInParentTree.getTreeNodes Unknown insertLocation: ' + child.insertLocation)
            }
            cacheTreeNodeChildren(child)
          },
          function( error) {
            return error
          }
        )

    }

    function compareEntityByName( a, b) { return a.name.localeCompare(b.name)}
    function compareEntityWithChildrenByName( a, b) { return a.entity.name.localeCompare( b.entity.name)}

    function sortEntityWithChildrenByName( entityWithChildrenList) {
      if( entityWithChildrenList.length === 0)
        return
      if( entityWithChildrenList[0].hasOwnProperty( 'name'))
        entityWithChildrenList.sort( compareEntityByName)
      else
        entityWithChildrenList.sort( compareEntityWithChildrenByName)
    }

    /**
     * Get TreeNodes for the sourceUrl and
     * @param sourceUrl
     * @param scope
     * @param parent
     * @returns {*}
     */
    function getTreeNodes(sourceUrl, scope, parent) {
      return rest.get(sourceUrl, null, scope).then(
          function(response) {
            var entityWithChildrenList = response.data
            sortEntityWithChildrenByName( entityWithChildrenList)
            var treeNodes = entityChildrenListToTreeNodes(entityWithChildrenList, parent)
            return {data: treeNodes}
          },
          function( error){
            return error
          }
        )
    }

    /**
     * Public API
     */
    // exports.getTreeNodes = getTreeNodes

    exports.NotifyCache = function() { return new NotifyCache()}

    /**
     * Get the tree node by equipment Id. This returns immediately with the value
     * or null if the menu item is not available yet. If not available,
     * notifyWhenAvailable will be called when available.
     *
     * @param equipmentId
     * @param notifyWhenAvailable
     * @returns The current value or null if not available yet.
     */
    exports.getTreeNodeByEquipmentId = function(equipmentId) { return equipmentIdToTreeNodeCache.get(equipmentId)}

    /**
     * Get the tree node by equipment Id and $state. One piece of equipment can be located under multiple different
     * menus. Each submenu has it's own state, so $state + equipmentId is a unique menu item.
     *
     * This returns immediately with the value
     * or null if the menu item is not available yet. If not available,
     * notifyWhenAvailable will be called when available.
     *
     * @param state $state name
     * @param equipmentId equipment ID
     * @param isReady function returning true when TreeNode is ready. Promise resolution will wait for isReady test.
     * @returns The current value or null if not available yet.
     */
    exports.getTreeNodeByStateEquipmentId = function(state, equipmentId, isReady) { return stateEquipmentIdToTreeNodeCache.get(state + (equipmentId? '.' + equipmentId : ''), isReady)}

    /**
     * Main call to get NavigationElements and populate the navTree menu. After retrieving the NavigationElements,
     * start retrieving the model entities referenced by NavigationElements (via sourceUrl).
     *
     * @param url URL for retrieving the NavigationElements.
     * @param name Store the navTree on scope.name
     * @param scope The controller scope
     * @param onNavTreeLoaded Notify method to call when the NavigationElement marked as selected is finished loading.
     */
    exports.getNavTree = function(url, name, scope) {
      return rest.get(url, name, scope).then(
        function( response) {
          var navigationElements = response.data
          // example: [ {class:'NavigationItem', data: {label:Dashboard, state:dashboard, url:#/dashboard, selected:false, children:[]}}, ...]
          flattenNavigationElements(navigationElements)

          // callMenuSelectOnFirstSelectedItem_or_callWhenLoaded( navigationElements, scope, onNavTreeLoaded)
          response.initialSelection = findInitialSelection(navigationElements)


          navigationElements.forEach(function(node, index) {
            if( node.sourceUrl )
              getTreeNodesForChildSourceUrlAndInsertInParentTree(navigationElements, index, node, scope)
            else
              stateEquipmentIdToTreeNodeCache.put(node.state, node)
          })

          return response
        },
        function( error) {
          return error
        }

      )
    }



  return exports // return Public API

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

  controller('NavTreeController', ['$rootScope', '$scope', '$attrs', '$location', '$state', '$stateParams', '$cookies', 'rest', 'navigation', function( $rootScope, $scope, $attrs, $location, $state, $stateParams, $cookies, rest, navigation) {

    var currentBranch,
        initialSelectionWhenStateLoading,  // branch selected when state is navigation.STATE_LOADING.
        treeControl = {}

    // tree-control -  Pass an empty object to the tree as "tree-control".
    // It will be populated with a set of functions for navigating and controlling the tree
    // see: https://github.com/nickperkinslondon/angular-bootstrap-nav-tree
    $scope.treeControl = treeControl
    $scope.navTree = [
      {
        class:    'Loading',
        state:    navigation.STATE_LOADING,
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
    //var sampleGetResponse = [
    //  {
    //    'entity':   {
    //      'name':  'Some Microgrid',
    //      'id':    'b9e6eac2-be4d-41cf-b82a-423d90515f64',
    //      'types': ['Root', 'MicroGrid']
    //    },
    //    'children': [
    //      {
    //        'entity':   {
    //          'name':  'MG1',
    //          'id':    '03c2db16-0f78-4800-adfc-9dff9d4598da',
    //          'types': ['Equipment', 'EquipmentGroup']
    //        },
    //        'children': []
    //      }
    //    ]
    //  }
    //]

    /**
     * Return the IDs for the equipment that this branch represents. If this branch has not equipmentChildren, then
     * this is [branch.id]. If this branch does have equipmentChildren then it's the child IDs.
     * @param branch Menu branch
     * @returns Array of equipment IDs for the branch
     */
    function getEquipmentIdsFromBranch(branch) {
      return branch.equipmentChildren === undefined || branch.equipmentChildren.length === 0 ? [branch.id]
          : branch.equipmentChildren.map( function( child) { return child.id })
    }

    // When an operator clicks a menu item, the menu item is highlighted and this function is called.
    // This function is specified by the HTML attribute: on-select = "menuSelect(branch)"
    //
    $scope.menuSelect = function(branch) {
      console.log('NavTreeController.menuSelect ' + branch.label + ', state=' + branch.state + ', class=' + branch.class + ', microgridId=' + branch.microgridId)

      if( branch.loading ) {
        console.log('NavTreeController.menuSelect ' + branch.label + ' loading... state=' + branch.state + ', class=' + branch.class + ', microgridId=' + branch.microgridId)
        return
      }

      // For now, we always supply microgridId. This is needed with we're coming from the 'loading' (or 'alarms')
      // state . It's not needed when we're going from one nested state to another (in the same microgrid).
      // TODO: Perhaps we should check if the microgridId is already known and isn't changing and not supply it. This might help with microgrid view reloads.
      //
      //
      // NOTE: These params are only passed to the controller if each parameter is defined in
      // the target state's URL params or non-URL params. Ex: params: {navigationElement: null}
      //
      var params = {
        microgridId:       branch.microgridId,
        id: branch.id,
        navigationElement: {
          class:     branch.class,
          id:        branch.id,
          types:     branch.types,
          name:      branch.name,      // full entity name
          shortName: branch.label,
          equipmentChildren: branch.equipmentChildren, // children that are equipment
          equipmentIds: getEquipmentIdsFromBranch(branch)
        }
      }

      if( branch.sourceUrl )
        params.sourceUrl = branch.sourceUrl

      currentBranch = branch
      if( ! initialSelectionWhenStateLoading)
        initialSelectionWhenStateLoading = branch
      $state.go(branch.state, params)
    }

    $rootScope.$on('$stateChangeSuccess', function( event, toState, toParams, fromState, fromParams) {

      // Clicking 'GreenBus' on top menu goes to state 'loading'.
      if( initialSelectionWhenStateLoading && toState.name === navigation.STATE_LOADING) {
        // if treeControl is empty, abn-tree needs attribute tree-control = "treeControl"
        if( currentBranch !== initialSelectionWhenStateLoading && angular.isFunction( treeControl.select_branch))
          treeControl.select_branch( initialSelectionWhenStateLoading) // select menu item and call menuSelect
        else
          $scope.menuSelect( initialSelectionWhenStateLoading)
      }
    })

    function getCacheIdFromStateParams( stateParams) {
      return $stateParams.hasOwnProperty('id') ? $stateParams.id
        : $stateParams.hasOwnProperty('microgridId') ? $stateParams.microgridId
        : ''
    }

    /**
     * Return weather a TreeNode is finished loading.
     * @param treeNode
     * @returns {boolean}
     */
    function isReady( treeNode) {
      return treeNode.loading !== true
    }

    function selectTreeNode( treeNode) {
      // Is there a menu? Could be a popout with not menu.
      if( angular.isFunction( treeControl.select_branch))
        treeControl.select_branch( treeNode)  // select menu item and call menuSelect
      else
        $scope.menuSelect( treeNode)
    }


    // tree data is stored in navTree. abn-tree-directive watches this to build tree.
    navigation.getNavTree($attrs.href, 'navTree', $scope).then(
      function(response) {
        // response.data is the loaded NavTree without any sourceUrls loaded.
        initialSelectionWhenStateLoading = response.initialSelection
        if( $state.is(navigation.STATE_LOADING) && initialSelectionWhenStateLoading) {
          if( initialSelectionWhenStateLoading.sourceUrl) {
            // Not loaded yet.
            initialSelectionWhenStateLoading.selectWhenLoaded = function( treeNode) {
              selectTreeNode( treeNode)
            }
          } else {
            // Loaded. Select it now.
            selectTreeNode( initialSelectionWhenStateLoading)
          }

        } else {

          var id = getCacheIdFromStateParams( $stateParams)
          // We wait on selecting a TreeNode until it has all of it's data
          // and direct children loaded from the server. When ready, we select the
          // TreeNode and this triggers the view controller to render the main data panels (on the right).
          navigation.getTreeNodeByStateEquipmentId( $state.current.name, id, isReady).then (
            function( branch) {
              if( branch)
                selectTreeNode( branch) // select menu item and call menuSelect
            }
          )
        }
      },
      function(error) {
      }
    )

  }]).

  directive('navTree', function() {
    // <nav-tree href='/apps/operator/menus/left'>
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
