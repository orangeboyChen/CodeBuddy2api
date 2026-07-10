import fs from 'node:fs';
import path from 'node:path';

import {
  createAccessKey,
  findAccessKeyById,
  listStoredAccessKeys,
  removeCredentialReferencesFromAccessKeys,
} from '@/lib/server/access-keys';
import {
  addCredential,
  deleteCredentialByIndex,
  listCredentials,
  resetCredentialRuntimeState,
} from '@/lib/server/credentials';

const repoRoot = process.cwd();
const tempRootDir = path.join(repoRoot, '.tmp-test-access-keys-credentials');
const tempConfigDir = path.join(tempRootDir, 'config');

const cleanupTempState = (): void => {
  fs.rmSync(tempRootDir, { force: true, recursive: true, maxRetries: 5 });
};

describe('access key credential reconciliation', () => {
  beforeEach(() => {
    cleanupTempState();
    resetCredentialRuntimeState();
    vi.restoreAllMocks();
    vi.spyOn(process, 'cwd').mockReturnValue(tempRootDir);
    process.env.CODEBUDDY_CONFIG_PATH = 'config/config.json';
    process.env.CODEBUDDY_AUTH_MODE = 'auto';
    addCredential({
      bearer_token: 'default-test-token',
      user_id: 'default@example.com',
    });
  });

  afterEach(() => {
    cleanupTempState();
  });

  it('removes deleted credential references from access keys', () => {
    const firstCredential = addCredential({
      bearer_token: 'token-first',
      user_id: 'first@example.com',
    });
    const secondCredential = addCredential({
      bearer_token: 'token-second',
      user_id: 'second@example.com',
    });
    const singleCredential = addCredential({
      bearer_token: 'token-third',
      user_id: 'third@example.com',
    });

    const multiKey = createAccessKey({
      credentialFilenames: [
        firstCredential.filename,
        secondCredential.filename,
      ],
      name: 'Multi Key',
    });
    const singleKey = createAccessKey({
      credentialFilenames: [singleCredential.filename],
      name: 'Single Key',
    });

    const listed = listCredentials();
    const secondIndex = listed.credentials.findIndex(
      (credential) => credential.filename === secondCredential.filename,
    );
    expect(deleteCredentialByIndex(secondIndex).success).toBe(true);
    expect(
      findAccessKeyById(multiKey.access_key.id)?.credentialFilenames,
    ).toEqual([firstCredential.filename]);

    const refreshedCredentials = listCredentials();
    const refreshedSingleIndex = refreshedCredentials.credentials.findIndex(
      (credential) => credential.filename === singleCredential.filename,
    );
    expect(deleteCredentialByIndex(refreshedSingleIndex).success).toBe(true);
    expect(findAccessKeyById(singleKey.access_key.id)).toBeNull();
  });

  it('prunes stale credential references when reading access keys', () => {
    const firstCredential = addCredential({
      bearer_token: 'token-first',
      user_id: 'first@example.com',
    });

    fs.mkdirSync(tempConfigDir, { recursive: true });
    fs.writeFileSync(
      path.join(tempConfigDir, 'access-keys.json'),
      JSON.stringify({
        accessKeys: [
          {
            id: 'stale-and-valid',
            name: 'Stale and Valid',
            secret: 'cb2_validsecret',
            createdAt: '2026-07-10T00:00:00.000Z',
            updatedAt: '2026-07-10T00:00:00.000Z',
            credentialFilenames: ['missing.json', firstCredential.filename],
          },
          {
            id: 'stale-only',
            name: 'Stale Only',
            secret: 'cb2_stalesecret',
            createdAt: '2026-07-10T00:00:00.000Z',
            updatedAt: '2026-07-10T00:00:00.000Z',
            credentialFilenames: ['missing.json'],
          },
        ],
      }),
    );

    expect(listStoredAccessKeys()).toEqual([
      expect.objectContaining({
        credentialFilenames: [firstCredential.filename],
        id: 'stale-and-valid',
      }),
    ]);

    const persisted = JSON.parse(
      fs.readFileSync(path.join(tempConfigDir, 'access-keys.json'), 'utf8'),
    ) as { accessKeys: Array<{ credentialFilenames: string[]; id: string }> };
    expect(persisted.accessKeys).toEqual([
      {
        createdAt: '2026-07-10T00:00:00.000Z',
        credentialFilenames: [firstCredential.filename],
        id: 'stale-and-valid',
        name: 'Stale and Valid',
        secret: 'cb2_validsecret',
        updatedAt: '2026-07-10T00:00:00.000Z',
      },
    ]);
  });

  it('supports direct credential reference cleanup helper', () => {
    const firstCredential = addCredential({
      bearer_token: 'token-first',
      user_id: 'first@example.com',
    });
    const secondCredential = addCredential({
      bearer_token: 'token-second',
      user_id: 'second@example.com',
    });
    const created = createAccessKey({
      credentialFilenames: [
        firstCredential.filename,
        secondCredential.filename,
      ],
      name: 'Direct Cleanup Key',
    });

    expect(
      removeCredentialReferencesFromAccessKeys(secondCredential.filename),
    ).toBe(true);
    expect(
      findAccessKeyById(created.access_key.id)?.credentialFilenames,
    ).toEqual([firstCredential.filename]);
    expect(removeCredentialReferencesFromAccessKeys('missing.json')).toBe(
      false,
    );
  });
});
