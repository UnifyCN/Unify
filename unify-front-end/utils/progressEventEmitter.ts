/**
 * Simple event emitter for progress updates
 * Used to notify components when progress is logged to the database
 */

type ProgressEventListener = () => void;

class ProgressEventEmitter {
  private listeners: Set<ProgressEventListener> = new Set();

  /**
   * Subscribe to progress update events
   * @param listener Callback function to be called when progress is updated
   * @returns Unsubscribe function
   */
  subscribe(listener: ProgressEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Emit a progress update event
   * Called when progress is logged to the database
   */
  emit(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in progress event listener:', error);
      }
    });
  }
}

// Export singleton instance
export const progressEventEmitter = new ProgressEventEmitter();
