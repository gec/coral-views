/*global describe beforeEach it expect */

var point, json,
    subscriptionMock = {
      id:            'subscriptionId1',
      notifySuccess: null,
      notifyError:   null,
      subscribe:     function(json, scope, success, error) {
        this.notifySuccess = success
        this.notifyError = error
        return this.id
      },
      unsubscribe:   jasmine.createSpy('unsubscribe')
    },
    subscriber1 = 'subscriber1',
    notify1 = jasmine.createSpy('notify1'),
    scope1 = {name: 'scope1'},
    constraints ={
      time: 1,
      size: 10,
      throttling: 0
    },
    timeNow = 10,
    limit = 10



function resetAllMockSpies() {
  notify1.calls.reset()
  subscriptionMock.unsubscribe.calls.reset()
}

describe('subscription', function() {

  beforeEach(function() {
    point = {
      id:   'pointId1',
      name: 'point1'
    }
    json = {
      subscribeToMeasurementHistory: {
        'pointId':  point.id,
        'timeFrom': timeNow - constraints.time,
        'limit':    constraints.size
      }
    }
    resetAllMockSpies()
    spyOn(subscriptionMock, 'subscribe').and.callThrough()

    spyOn(Date, 'now').and.callFake(function() {
      return timeNow;
    })

  });


  it('should start subscription', function() {

    var mh = new MeasurementHistory(subscriptionMock, point)
    expect(mh.subscription).toBe(subscriptionMock)
    expect(mh.point).toBe(point)
    expect(mh.subscriptionId).toBeNull()
    expect(mh.subscribers.length).toBe(0)
    expect(mh.measurements.length).toBe(0)


    var measurements = mh.subscribe(scope1, constraints, subscriber1, notify1)
    expect(measurements).toBe(mh.measurements)
    expect(subscriptionMock.subscribe).toHaveBeenCalledWith(
      json,
      scope1,
      subscriptionMock.notifySuccess,
      subscriptionMock.notifyError
    );
  })

  it('should receive measurements and call notify', function() {

    var mh = new MeasurementHistory(subscriptionMock, point)

    var measurements = mh.subscribe(scope1, constraints, subscriber1, notify1)
    expect(measurements).toBe(mh.measurements)
    expect(subscriptionMock.subscribe).toHaveBeenCalledWith(
      json,
      scope1,
      subscriptionMock.notifySuccess,
      subscriptionMock.notifyError
    );

    var m1 = {time: 1, value: '1.0'},
        pointWithMeasurements = {
          point:        point,
          measurements: [ m1]
        }
    subscriptionMock.notifySuccess(subscriptionMock.id, 'pointWithMeasurements', pointWithMeasurements)
    expect(measurements.length).toBe(1)
    expect(measurements[0]).toBe(m1)
    expect(measurements[0].value).toBeNumber()
    expect(notify1.calls.length).toBe(1)

    var m2 = {time: 2, value: '2.0'},
        incomingMeasurements = [
          { point:       point,
            measurement: m2
          }
        ]
    subscriptionMock.notifySuccess(subscriptionMock.id, 'measurements', incomingMeasurements)
    expect(measurements.length).toBe(2)
    expect(measurements[1]).toBe(m2)
    expect(measurements[1].value).toBe(2.0)
    expect(notify1.calls.length).toBe(2)

    var m3 = {time: 3, value: '3.0'},
        m4 = {time: 4, value: '4.0'}
    incomingMeasurements = [
      { point:       point,
        measurement: m3
      },
      { point:       point,
        measurement: m4
      }
    ]
    subscriptionMock.notifySuccess(subscriptionMock.id, 'measurements', incomingMeasurements)
    expect(measurements.length).toBe(4)
    expect(measurements[2]).toBe(m3)
    expect(measurements[3]).toBe(m4)
    expect(notify1.calls.length).toBe(3) // call once for last two measurements that came in together.

    //jasmine.any(Function)
  })

  it('should create just one subscription for two subscribers and only unsubscribe when both unsubscribe.', function() {

    var mh = new MeasurementHistory(subscriptionMock, point)

    var measurements = mh.subscribe(scope1, constraints, subscriber1, notify1)
    expect(measurements).toBe(mh.measurements)
    expect(mh.subscribers.length).toBe(1)
    expect(subscriptionMock.subscribe).toHaveBeenCalledWith(
      json,
      scope1,
      subscriptionMock.notifySuccess,
      subscriptionMock.notifyError
    );

    var scope2 = {name: 'scope2'},
        subscriber2 = 'subscriber2',
        notify2 = jasmine.createSpy('notify2')

    measurements = mh.subscribe(scope2, constraints, subscriber2, notify2)
    expect(measurements).toBe(mh.measurements)
    expect(mh.subscribers.length).toBe(2)
    expect(subscriptionMock.subscribe.calls.length).toBe(1)  // not called again.


    var m1 = {time: 1, value: '1.0'},
        pointWithMeasurements = {
          point:        point,
          measurements: [ m1]
        }
    subscriptionMock.notifySuccess(subscriptionMock.id, 'pointWithMeasurements', pointWithMeasurements)
    expect(measurements.length).toBe(1)
    expect(measurements[0]).toBe(m1)
    expect(measurements[0].value).toBeNumber()

    var m2 = {time: 2, value: '2.0'},
        incomingMeasurements = [
          { point:       point,
            measurement: m2
          }
        ]
    subscriptionMock.notifySuccess(subscriptionMock.id, 'measurements', incomingMeasurements)
    expect(measurements.length).toBe(2)
    expect(measurements[1]).toBe(m2)
    expect(measurements[1].value).toBe(2.0)

    var m3 = {time: 3, value: '3.0'},
        m4 = {time: 4, value: '4.0'}
    incomingMeasurements = [
      { point:       point,
        measurement: m3
      },
      { point:       point,
        measurement: m4
      }
    ]
    subscriptionMock.notifySuccess(subscriptionMock.id, 'measurements', incomingMeasurements)
    expect(measurements.length).toBe(4)
    expect(measurements[2]).toBe(m3)
    expect(measurements[3]).toBe(m4)


    mh.unsubscribe(subscriber1)
    expect(subscriptionMock.unsubscribe).not.toHaveBeenCalled()
    expect(mh.subscribers.length).toBe(1)
    expect(mh.subscribers[0].subscriber).toBe(subscriber2)
    expect(measurements.length).toBe(4)

    mh.unsubscribe(subscriber2)
    expect(subscriptionMock.unsubscribe).toHaveBeenCalledWith(subscriptionMock.id)
    expect(measurements.length).toBe(4)     // Keep our copy of measurements
    expect(mh.measurements.length).toBe(0)  // Internal measurements are gone.

    //jasmine.any(Function)
  })


})

