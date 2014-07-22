angular.module("template/event/alarms.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/event/alarms.html",
    "<table class=\"table table-condensed\">\n" +
    "    <thead>\n" +
    "    <tr>\n" +
    "        <th>ID</th>\n" +
    "        <th>State</th>\n" +
    "        <th>Type</th>\n" +
    "        <th>Sev</th>\n" +
    "        <th>User</th>\n" +
    "        <th>Entity</th>\n" +
    "        <th>Message</th>\n" +
    "        <th>Time</th>\n" +
    "    </tr>\n" +
    "    </thead>\n" +
    "    <tbody>\n" +
    "    <tr ng-repeat=\"alarm in alarms\">\n" +
    "        <td>{{alarm.id}}</a></td>\n" +
    "        <td>{{alarm.state}}</td>\n" +
    "        <td>{{alarm.event.eventType}}</td>\n" +
    "        <td>{{alarm.event.severity}}</td>\n" +
    "        <td>{{alarm.event.agent}}</td>\n" +
    "        <td><a href=\"#/entities/{{alarm.event.entity}}\">{{alarm.event.entity}}</a></td>\n" +
    "        <td>{{alarm.event.message}}</td>\n" +
    "        <td>{{alarm.event.time | date:\"h:mm:ss a, MM-dd-yyyy\"}}</td>\n" +
    "    </tr>\n" +
    "    </tbody>\n" +
    "</table>");
}]);
