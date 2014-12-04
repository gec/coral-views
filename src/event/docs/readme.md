###gb-events
A tabular view of recent events.

#### Attributes
* `limit` — The maximum number of rows in the table. Defaults to 20.

#### Subscription
    subscribeToRecentEvents: {
        eventTypes: [],
        limit: $scope.limit
    }
      

###gb-alarms
A tabular view of active alarms.


#### Attributes
* `limit` — The maximum number of rows in the table. Defaults to 20.

#### Subscription
    subscribeToActiveAlarms: {
        limit: $scope.limit
    }
