angular.module("template/navigation/navList.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/navigation/navList.html",
    "<ul class=\"nav nav-list\">\n" +
    "    <li ng-repeat=\"item in navItems\" ng-class=\"getClass(item)\" ng-switch=\"item.type\">\n" +
    "        <a ng-switch-when=\"item\" href=\"{{ item.route }}\">{{ item.label }}</a>\n" +
    "        <span ng-switch-when=\"header\">{{ item.label }}</span>\n" +
    "    </li>\n" +
    "</ul>");
}]);
