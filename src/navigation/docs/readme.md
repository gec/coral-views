###nav-tree
A tree menu used for navigating to different views.

#### Attributes
* `href` — The request that retrieves the root menu. For example: "/coral/menus/operator"
   
#### Sub Elements
    <abn-tree tree-data="navTree"                                          
      icon-expand       = "fa fa-caret-right"
      icon-collapse     = "fa fa-caret-down"
      icon-leaf         = ""
      initial-selection = "All Equipment"
      on-select         = "menuSelect(branch)"></abn-tree>      

#### Requirements
* Module: angularBootstrapNavTree
* Script: angular-bootstrap-nav-tree/abn_tree_directive.js
* CSS: font-awesome/css/font-awesome.css
* CSS: angular-bootstrap-nav-tree/abn_tree.css