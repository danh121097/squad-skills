export interface StoredDocument {
  ownerId: string;
  body: string;
}

export type DocumentStore = Map<string, StoredDocument>;

export function readDocument(store: DocumentStore, actorId: string, docId: string): string {
  const found = store.get(docId);

  if (found === undefined) throw new Error('not found');
  if (found.ownerId !== actorId) throw new Error('forbidden');

  return found.body;
}

export function updateDocument(
  store: DocumentStore,
  actorId: string,
  docId: string,
  body: string
): void {
  const found = store.get(docId);

  if (found === undefined) throw new Error('not found');
  if (found.ownerId !== actorId) throw new Error('forbidden');

  store.set(docId, { ownerId: found.ownerId, body });
}
