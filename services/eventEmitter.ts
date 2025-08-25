class EventEmitter {
  private listeners: { [key: string]: Array<(...args: any[]) => void> } = {};

  on(event: string, listener: (...args: any[]) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);

    // Return cleanup function
    return () => {
      this.off(event, listener);
    };
  }

  off(event: string, listener: (...args: any[]) => void) {
    if (!this.listeners[event]) return;
    
    const index = this.listeners[event].indexOf(listener);
    if (index > -1) {
      this.listeners[event].splice(index, 1);
    }
  }

  emit(event: string, ...args: any[]) {
    if (!this.listeners[event]) return;
    
    this.listeners[event].forEach(listener => {
      listener(...args);
    });
  }

  removeAllListeners(event?: string) {
    if (event) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }
  }
}

export const eventEmitter = new EventEmitter();