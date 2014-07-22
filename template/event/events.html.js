angular.module("template/event/events.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/event/events.html",
    "<table class=\"table table-condensed\">\n" +
    "    <thead>\n" +
    "    <tr>\n" +
    "        <th>ID</th>\n" +
    "        <th>Type</th>\n" +
    "        <th>Alarm</th>\n" +
    "        <th>Sev</th>\n" +
    "        <th>User</th>\n" +
    "        <th>Entity</th>\n" +
    "        <th>Message</th>\n" +
    "        <th>Time</th>\n" +
    "    </tr>\n" +
    "    </thead>\n" +
    "    <tbody>\n" +
    "    <tr class=\"coral-event\" ng-repeat=\"event in events\">\n" +
    "        <td>{{event.id}}</a></td>\n" +
    "        <td>{{event.eventType}}</td>\n" +
    "        <td>{{event.alarm}}</td>\n" +
    "        <td>{{event.severity}}</td>\n" +
    "        <td>{{event.agent}}</td>\n" +
    "        <td><a href=\"#/entities/{{event.entity}}\">{{event.entity}}</a></td>\n" +
    "        <td>{{event.message}}</td>\n" +
    "        <td>{{event.time | date:\"h:mm:ss a, MM-dd-yyyy\"}}</td>\n" +
    "    </tr>\n" +
    "    </tbody>\n" +
    "</table>\n" +
    "");
}]);
