import EventEmitter from 'events'

class InterdependentEventEmitter extends EventEmitter {
  eventsRegisteredInMutualEvents = {};
  registeredMutualEvents = {};
  mutualEventsListeners = {};
  eventSplitString = ':';

  on(eventName, listener) {
    if (!Array.isArray(eventName)) {
      super.on(eventName, listener);
    } else {
      //首先注册事件，以便后续事件触发时，快速确认是否要进行复杂的操作
      eventName.forEach((value) => {
        this.eventsRegisteredInMutualEvents[value] = true;
      });

      let key = eventName.sort().join(this.eventSplitString);

      //加上监听
      if (!this.mutualEventsListeners[key]) {
        this.mutualEventsListeners[key] = [];
      }

      if (-1 === this.mutualEventsListeners[key].indexOf(listener)) {
        this.mutualEventsListeners[key].push(listener);
      }

      //初始化触发记录
      if (!this.registeredMutualEvents[key]) {
        this.registeredMutualEvents[key] = {};
        eventName.forEach((event) => {
          this.registeredMutualEvents[key][event] = 0;
        });
      }
    }
  }

  emit(eventName, ...params) {
    super.emit(eventName, ...params);
    //快速筛选是否是多监听事件
    if (!this.eventsRegisteredInMutualEvents[eventName]) {
      return;
    }

    //对每个多监听触发记录
    Object.keys(this.registeredMutualEvents).forEach(implodedEvents => {
      if (-1 === implodedEvents.split(this.eventSplitString).indexOf(eventName)) {
        return;
      }
      //记录该事件被触发
      this.registeredMutualEvents[implodedEvents][eventName] = {...params};

      //判断是否所监听的所有事件被触发
      let emittedEventCount = Object.values(this.registeredMutualEvents[implodedEvents]).reduce((accumulator, value) => {
        return accumulator + (value ? 1 : 0)
      }, 0);
      if (emittedEventCount < Object.keys(this.registeredMutualEvents[implodedEvents]).length) {
        return;
      }

      this.mutualEventsListeners[implodedEvents].forEach((listener) => {
        listener(this.registeredMutualEvents[implodedEvents]);
      });
    })
  }
}

export default InterdependentEventEmitter;

let _globalInterdependentEventEmitter;

if (!_globalInterdependentEventEmitter) {
  _globalInterdependentEventEmitter = new InterdependentEventEmitter();
}

export const globalInterdependentEventEmitter = _globalInterdependentEventEmitter;

