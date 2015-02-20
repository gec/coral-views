###gb-events
A tabular view of recent events.

#### Attributes
* `limit` — The maximum number of rows in the table. Defaults to 20.

#### Subscription
    subscribeToEvents: {
        eventTypes: [],
        limit: $scope.limit
    }
      

###gb-alarms
A tabular view of active alarms.


#### Attributes
* `limit` — The maximum number of rows in the table. Defaults to 20.

#### Subscription
    subscribeToAlarms: {
        limit: $scope.limit
    }

###gb-alarms-and-events
A tabbed panel showing both active alarms and events. Each is a tabular view.


#### Attributes
* `limit` — The maximum number of rows in both tables. Defaults to 20.

#### Subscription
    subscribeToAlarms: {
        limit: $scope.limit
    }
    subscribeToEvents: {
        limit: $scope.limit
    }
