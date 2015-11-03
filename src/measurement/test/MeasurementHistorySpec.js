/**
 * Copyright 2014 Green Energy Corp.
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
 * the License.
 *
 * Author: Flint O'Brien
 */

describe('MeasurementHistory', function() {

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
        time: 10000,
        size: 10000,
        throttling: 0
      },
      timeNow = 10,
      limit = 10



  function resetAllMockSpies() {
    notify1.calls.reset()
    subscriptionMock.unsubscribe.calls.reset()
  }


  beforeEach(function() {
    point = {
      id:   'pointId1',
      name: 'point1'
    }
    json = {
      name: 'SubscribeToMeasurementHistory',
      'pointId':  point.id,
      'timeFrom': timeNow - constraints.time,
      'limit':    constraints.size
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
    var sample = measurements.get()
    expect(sample.data.length).toBe(1)
    expect(sample.data[0].time.getTime()).toBe( 1)
    expect(sample.data[0].value).toBeNumber()
    expect(notify1.calls.count()).toBe(1)

    var m2 = {time: 2, value: '2.0'},
        incomingMeasurements = [
          { point:       point,
            measurement: m2
          }
        ]
    subscriptionMock.notifySuccess(subscriptionMock.id, 'measurements', incomingMeasurements)
    expect(sample.data.length).toBe(2)
    expect(sample.data[1].time.getTime()).toBe( 2)
    expect(sample.data[1].value).toBe(2.0)
    expect(notify1.calls.count()).toBe(2)

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
    expect(sample.data.length).toBe(4)
    expect(sample.data[2].time.getTime()).toBe( 3)
    expect(sample.data[2].value).toBe(3.0)
    expect(sample.data[3].time.getTime()).toBe( 4)
    expect(sample.data[3].value).toBe(4.0)
    expect(notify1.calls.count()).toBe(3) // call once for last two measurements that came in together.
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
    expect(subscriptionMock.subscribe.calls.count()).toBe(1)  // not called again.


    var m1 = {time: 1, value: '1.0'},
        pointWithMeasurements = {
          point:        point,
          measurements: [ m1]
        }
    subscriptionMock.notifySuccess(subscriptionMock.id, 'pointWithMeasurements', pointWithMeasurements)
    var sample = measurements.get()
    expect(sample.data.length).toBe(1)
    expect(sample.data[0].time.getTime()).toBe(1)
    expect(sample.data[0].value).toBeNumber()

    var m2 = {time: 2, value: '2.0'},
        incomingMeasurements = [
          { point:       point,
            measurement: m2
          }
        ]
    subscriptionMock.notifySuccess(subscriptionMock.id, 'measurements', incomingMeasurements)
    expect(sample.data.length).toBe(2)
    expect(sample.data[1].time.getTime()).toBe(2)
    expect(sample.data[1].value).toBe(2.0)

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
    expect(sample.data.length).toBe(4)
    expect(sample.data[2].time.getTime()).toBe(3)
    expect(sample.data[2].value).toBe(3.0)
    expect(sample.data[3].time.getTime()).toBe(4)
    expect(sample.data[3].value).toBe(4.0)


    mh.unsubscribe(subscriber1)
    expect(subscriptionMock.unsubscribe).not.toHaveBeenCalled()
    expect(mh.subscribers.length).toBe(1)
    expect(mh.subscribers[0].subscriber).toBe(subscriber2)
    expect(sample.data.length).toBe(4)

    mh.unsubscribe(subscriber2)
    expect(subscriptionMock.unsubscribe).toHaveBeenCalledWith(subscriptionMock.id)
    expect(sample.data.length).toBe(4)     // Keep our copy of measurements
    expect(mh.measurements.get().data.length).toBe(0)  // Internal measurements are gone.

    //jasmine.any(Function)
  })


})

