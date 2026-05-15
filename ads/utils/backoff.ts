/**
 * Utility for exponential backoff retries
 */
export class ExponentialBackoff {
  private retryCount = 0;
  private maxRetries: number;
  private baseDelay: number;

  constructor(maxRetries = 5, baseDelay = 2000) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
  }

  public getNextDelay(): number | null {
    if (this.retryCount >= this.maxRetries) {
      return null;
    }
    
    const delay = this.baseDelay * Math.pow(2, this.retryCount);
    this.retryCount++;
    return delay;
  }

  public reset(): void {
    this.retryCount = 0;
  }

  public get currentRetryCount(): number {
    return this.retryCount;
  }
}
