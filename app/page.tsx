import { headers } from 'next/headers';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import AdminPageLayout from '@/app/page-shell';
import type { AdminConsoleInitialData } from '@/app/page-data';
import type {
  AccessKeySummary,
  CredentialSummary,
} from '@/app/credentials/credentials';
import type { TabKey } from '@/app/page-data';
import type { UsageFiltersState } from '@/app/usage/usage';
import { listAccessKeys } from '@/lib/server/domain/access-keys';
import {
  getAdminSessionSummary,
  isAdminSessionAuthenticated,
} from '@/lib/server/admin/session';
import { getActiveConfig, getSettingLabels } from '@/lib/server/domain/config';
import {
  getCurrentCredentialInfo,
  listCredentials,
} from '@/lib/server/domain/credentials';
import { getDebugSettings, listDebugLogs } from '@/lib/server/domain/debug';
import { getUsageStats } from '@/lib/server/domain/stats';
import { getUsageAnalytics } from '@/lib/server/domain/usage';
import {
  localeCookieName,
  localePreferenceCookieName,
  parseLocalePreference,
  resolveAppLocale,
  systemLocalePreference,
  type AppLocale,
} from '@/lib/i18n/routing';
import { getMessages } from '@/lib/i18n/messages';
import { parseThemeMode, themeCookieName } from '@/lib/theme';

export const dynamic = 'force-dynamic';

const buildApiEndpoint = async () => {
  const headerStore = await headers();
  const protocol = headerStore.get('x-forwarded-proto') ?? 'http';
  const host =
    headerStore.get('x-forwarded-host') ??
    headerStore.get('host') ??
    'localhost';

  return `${protocol}://${host}/v1`;
};

const formatInitialHealthLabel = (locale: AppLocale, timestamp: string) => {
  const checkedAt = new Date(timestamp).toLocaleString(locale);
  const { serviceCheckedAt } = getMessages(locale).Admin.console;

  return `${serviceCheckedAt} ${checkedAt}`;
};

const getInitialData = async (
  locale: AppLocale,
  usageRequest: UsageFiltersState = {
    accessKey: [],
    credential: [],
    range: '24h',
  },
  usageAutoRefreshSeconds = 15,
): Promise<AdminConsoleInitialData> => {
  const timestamp = new Date().toISOString();
  const [
    accessKeys,
    apiEndpoint,
    credentials,
    currentCredential,
    activeConfig,
    debugSettings,
    debugLogs,
    stats,
    usage,
  ] = await Promise.all([
    listAccessKeys(),
    buildApiEndpoint(),
    listCredentials(),
    getCurrentCredentialInfo(),
    getActiveConfig(),
    getDebugSettings(),
    listDebugLogs(),
    getUsageStats(),
    getUsageAnalytics(usageRequest),
  ]);

  return {
    accessKeys: accessKeys.access_keys as unknown as AccessKeySummary[],
    apiEndpoint,
    credentials: credentials.credentials as unknown as CredentialSummary[],
    currentCredential:
      currentCredential as unknown as AdminConsoleInitialData['currentCredential'],
    debug: {
      autoRefreshSeconds: debugSettings.autoRefreshSeconds,
      enabled: debugSettings.enabled,
      items: debugLogs.map((log) => ({
        credentialFilename: log.credentialFilename,
        createdAt: log.createdAt,
        elapsedMs: log.elapsedMs,
        error: log.error,
        id: log.id,
        model: log.model,
        requestBody: null,
        requestKey: log.requestKey,
        route: log.route,
        transformedResponse: log.transformedResponse
          ? { body: null, headers: {}, status: log.transformedResponse.status }
          : null,
        upstreamRequest: log.upstreamRequest
          ? { method: log.upstreamRequest.method, url: log.upstreamRequest.url }
          : null,
        upstreamResponse: log.upstreamResponse
          ? { body: null, headers: {}, status: log.upstreamResponse.status }
          : null,
        usage: log.usage,
      })),
      maxEntries: debugSettings.maxEntries,
    },
    health: {
      checkedAtLabel: formatInitialHealthLabel(locale, timestamp),
      status: 'healthy',
      timestamp,
      uptimeText: formatInitialHealthLabel(locale, timestamp),
    },
    settings: {
      labels: getSettingLabels(locale),
      values: { ...activeConfig },
    },
    stats,
    usage: {
      ...usage,
      autoRefreshSeconds: usageAutoRefreshSeconds,
      request: usageRequest,
      updatedAtLabel: new Date(timestamp).toLocaleTimeString(locale),
    },
  };
};

export const AdminPage = async ({
  children,
  initialTab,
  initialUsageAutoRefreshSeconds,
  initialUsageRequest,
}: {
  children: ReactNode;
  initialTab: TabKey;
  initialUsageAutoRefreshSeconds?: number;
  initialUsageRequest?: UsageFiltersState;
}) => {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const protocol = headerStore.get('x-forwarded-proto') ?? 'http';
  const host =
    headerStore.get('x-forwarded-host') ??
    headerStore.get('host') ??
    'localhost';
  const cookieHeader = headerStore.get('cookie') ?? '';
  const request = new Request(`${protocol}://${host}/`, {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  });
  const session = await getAdminSessionSummary(request);
  const sessionAuthenticated = await isAdminSessionAuthenticated(request);

  if (session.accountConfigured && !sessionAuthenticated) {
    redirect('/login');
  }

  const localePreference = parseLocalePreference(
    cookieStore.get(localePreferenceCookieName)?.value ??
      cookieStore.get(localeCookieName)?.value,
  );
  const locale = resolveAppLocale(
    localePreference === systemLocalePreference
      ? (headerStore.get('accept-language') ?? undefined)
      : localePreference,
  );

  return (
    <AdminPageLayout
      initialData={await getInitialData(
        locale,
        initialUsageRequest,
        initialUsageAutoRefreshSeconds,
      )}
      initialLocalePreference={localePreference}
      showLogout={sessionAuthenticated}
      initialTab={initialTab}
      initialTheme={parseThemeMode(cookieStore.get(themeCookieName)?.value)}
    >
      {children}
    </AdminPageLayout>
  );
};

const RootPage = () => {
  redirect('/dashboard');
};

export default RootPage;
