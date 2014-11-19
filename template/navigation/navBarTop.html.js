angular.module("template/navigation/navBarTop.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/navigation/navBarTop.html",
    "<div class=\"navbar navbar-inverse navbar-fixed-top\" role=\"navigation\">\n" +
    "  <div class=\"container\">\n" +
    "\n" +
    "    <div class=\"navbar-header\">\n" +
    "        <button type=\"button\" class=\"navbar-toggle\" ng-click=\"isCollapsed = !isCollapsed\">\n" +
    "            <span class=\"sr-only\">Toggle navigation</span>\n" +
    "            <span class=\"icon-bar\"></span>\n" +
    "            <span class=\"icon-bar\"></span>\n" +
    "            <span class=\"icon-bar\"></span>\n" +
    "        </button>\n" +
    "        <a class=\"navbar-brand\" href=\"{{ application.route }}\">{{ application.label }}</a>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"collapse navbar-collapse\" collapse=\"isCollapsed\">\n" +
    "        <ul class=\"nav navbar-nav\" ng-hide=\"loading\">\n" +
    "            <li  ng-repeat=\"item in applicationMenuItems\" ng-class=\"getActiveClass( item)\">\n" +
    "                <a href=\"{{ item.route }}\">{{ item.label }}</a>\n" +
    "            </li>\n" +
    "        </ul>\n" +
    "        <ul class=\"nav navbar-nav navbar-right\" ng-hide=\"loading\">\n" +
    "            <li class=\"dropdown\">\n" +
    "                <a class=\"dropdown-toggle\">Logged in as {{ userName }} <b class=\"caret\"></b></a>\n" +
    "                <ul class=\"dropdown-menu\">\n" +
    "                    <li ng-repeat=\"item in sessionMenuItems\"><a href=\"{{ item.route }}\">{{ item.label }}</a></li>\n" +
    "                </ul>\n" +
    "            </li>\n" +
    "        </ul>\n" +
    "    </div>\n" +
    "\n" +
    "  </div>\n" +
    "</div>");
}]);
