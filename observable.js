// eslint-disable-next-line no-unused-vars
class Observable {
  constructor(forEach) {
    this._forEach = forEach;
  }

  forEach(next, error, complete) {
    if (typeof next === 'function') {
      return this._forEach({
        next,
        error: error || function() {},
        complete: complete || function() {}
      });
    } else {
      return this._forEach(next);
    }
  }

  filter(predicateFn) {
    return new Observable(observer =>
      this.forEach(
        value => {
          if (predicateFn(value)) {
            observer.next(value);
          }
        },
        observer.error,
        observer.complete
      )
    );
  }

  map(projectionFn) {
    return new Observable(observer =>
      this.forEach(
        value => observer.next(projectionFn(value)),
        observer.error,
        observer.complete
      )
    );
  }

  take(count) {
    return new Observable(observer => {
      let counter = 0;

      const subscription = this.forEach(
        value => {
          counter++;
          observer.next(value);

          if (counter >= count) {
            subscription.dispose();
            observer.complete();
          }
        },
        observer.error,
        observer.complete
      );

      return subscription;
    });
  }

  takeUntil(notifier) {
    return new Observable(observer => {
      const subscription = this.forEach(observer);

      const notifierSubscription = notifier.forEach(
        terminate,
        terminate,
        terminate
      );

      function terminate() {
        observer.complete();
        notifierSubscription.dispose();
        subscription.dispose();
      }

      return subscription;
    });
  }

  mergeMap(projection) {
    return new Observable(observer => {
      return this.forEach(
        value => projection(value).forEach(observer),
        observer.error,
        observer.complete
      );
    });
  }

  static fromEvent(domEl, eventName) {
    return new Observable(observer => {
      domEl.addEventListener(eventName, observer.next);

      return {
        dispose() {
          domEl.removeEventListener(eventName, observer.next);
        }
      };
    });
  }

  static fromInterval(milliseconds) {
    return new Observable(observer => {
      const timerId = setInterval(observer.next, milliseconds);

      return {
        dispose() {
          clearInterval(timerId);
        }
      };
    });
  }
}
