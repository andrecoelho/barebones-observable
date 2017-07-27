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

  map(projectionFn) {
    const source = this;

    return new Observable(observer =>
      source.forEach(
        value => observer.onNext(projectionFn(value)),
        observer.onError,
        observer.onCompleted
      )
    );
  }

  filter(predicateFn) {
    const source = this;

    return new Observable(observer =>
      source.forEach(
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

  take(count) {
    const source = this;

    return new Observable(observer => {
      let counter = 0;

      const subscription = source.forEach(
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
    const source = this;

    return new Observable(observer => {
      const sourceSubscription = source.forEach(observer);

      const notifierSubscription = notifier.forEach(
        () => {
          sourceSubscription.dispose();
          notifierSubscription.dispose();
          observer.onCompleted();
        },
        observer.onError,
        () => {
          sourceSubscription.dispose();
          observer.onCompleted();
        }
      );

      return sourceSubscription;
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
        dispose: () => {
          clearInterval(timerId);
        }
      };
    });
  }
}
