import { type Check, expectEqual, expectThrows } from '../check.ts';

interface StoredDocument {
  ownerId: string;
  body: string;
}

interface AuthorizationSubject {
  readDocument(store: Map<string, StoredDocument>, actorId: string, docId: string): string;
  updateDocument(
    store: Map<string, StoredDocument>,
    actorId: string,
    docId: string,
    body: string
  ): void;
}

function buildStore(): Map<string, StoredDocument> {
  return new Map([['doc-1', { ownerId: 'alice', body: 'original' }]]);
}

export function defineChecks(subject: AuthorizationSubject): Check[] {
  return [
    {
      name: 'owner-reads-own-document',
      run: () =>
        expectEqual(subject.readDocument(buildStore(), 'alice', 'doc-1'), 'original', 'read'),
    },
    {
      name: 'owner-updates-own-document',
      run: () => {
        const store = buildStore();

        subject.updateDocument(store, 'alice', 'doc-1', 'edited');
        expectEqual(store.get('doc-1')?.body, 'edited', 'body');
      },
    },
    {
      name: 'stranger-cannot-read',
      run: () => expectThrows(() => subject.readDocument(buildStore(), 'mallory', 'doc-1'), 'read'),
    },
    {
      name: 'stranger-cannot-update',
      run: () =>
        expectThrows(
          () => subject.updateDocument(buildStore(), 'mallory', 'doc-1', 'defaced'),
          'update'
        ),
    },
  ];
}
