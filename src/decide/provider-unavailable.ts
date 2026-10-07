/**
 * A provider that is out of quota or rate-limited throws this with the time it
 * may be called again. The decision layer then answers "unavailable" without a
 * network call until that time.
 */
export class ProviderUnavailableError extends Error {
  readonly retryAt: Date;

  constructor(message: string, retryAt: Date) {
    super(message);
    this.name = 'ProviderUnavailableError';
    this.retryAt = retryAt;
  }
}

/**
 * The open breakers of one process, keyed by provider and credentials, since a
 * quota belongs to the account rather than the model. Memory only: a restart
 * forgets them and the next call finds out again.
 */
export type ProviderCooldowns = Map<string, ProviderUnavailableError>;
