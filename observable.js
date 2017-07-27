class Observable {
  constructor(forEach) {
    this._forEach = forEach;
  }

  forEach(onNext, onError, onCompleted) {
    if (typeof onNext === "function") {
      return this._forEach({
        onNext,
        onError: onError || function() {},
        onCompleted: onCompleted || function() {}
      });
    } else {
      return this._forEach(onNext);
    }
  }

  filter(predicateFn) {
    return new Observable(observer =>
      this.forEach(
        value => {
          if (predicateFn(value)) {
            observer.onNext(value);
          }
        },
        observer.onError,
        observer.onCompleted
      )
    );
  }

  map(projectionFn) {
    return new Observable(observer =>
      this.forEach(
        value => observer.onNext(projectionFn(value)),
        observer.onError,
        observer.onCompleted
      )
    );
  }

  take(count) {
    return new Observable(observer => {
      let counter = 0;

      const subscription = this.forEach(
        value => {
          counter++;
          observer.onNext(value);

          if (counter >= count) {
            subscription.dispose();
            observer.onCompleted();
          }
        },
        observer.onError,
        observer.onCompleted
      );

      return subscription;
    });
  }

  takeUntil(notifier) {
    return new Observable(observer => {
      const subscription = this.forEach(observer);

      const notifierSubscription = notifier.forEach(
        () => {
          subscription.dispose();
          notifierSubscription.dispose();
          observer.onCompleted();
        },
        observer.onError,
        () => {
          subscription.dispose();
          observer.onCompleted();
        }
      );

      return subscription;
    });
  }

  flatMap(projection) {
    return new Observable(observer => {
      return this.forEach(
        value => projection(value).forEach(observer),
        observer.onError,
        observer.onCompleted
      );
    });
  }

  static fromEvent(domEl, eventName) {
    return new Observable(observer => {
      domEl.addEventListener(eventName, observer.onNext);

      return {
        dispose() {
          domEl.removeEventListener(eventName, observer.onNext);
        }
      };
    });
  }

  static fromInterval(milliseconds) {
    return new Observable(observer => {
      const timerId = setInterval(observer.onNext, milliseconds);

      return {
        dispose() {
          clearInterval(timerId);
        }
      };
    });
  }
}
