import { describe, expect, it } from 'vitest';

import {
  createDashboardState,
  type AdminConsoleInitialData,
} from '@/app/admin/_components/admin-initial-state';

const createInitialData = (): AdminConsoleInitialData => {
  return {
    accessKeys: [],
    apiEndpoint: 'http://localhost:8001/v1',
    credentials: [],
    currentCredential: { status: 'empty' },
    debug: {
      autoRefreshSeconds: 15,
      enabled: false,
      items: [],
      maxEntries: 100,
    },
    health: {
      checkedAtLabel: '',
      status: 'healthy',
      timestamp: '2026-07-12T09:00:00.000Z',
      uptimeText: '',
    },
    settings: { labels: {}, values: {} },
    stats: { credential_usage: {}, model_usage: {} },
  };
};

describe('admin initial state', () => {
  it('keeps the service status time visible on the first render', () => {
    expect(createDashboardState(createInitialData()).uptimeText).toBe(
      '2026-07-12T09:00:00.000Z',
    );
  });
});
