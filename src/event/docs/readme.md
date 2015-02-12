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
    subscribeToEvents: {
        alarmsOnly: true,
        limit: $scope.limit
    }
