import { AdminPage } from '@/app/page';

import Usage, { type UsageFiltersState, type UsageRange } from './usage';

const allowedRanges = new Set<UsageRange>([
  '1h',
  '3h',
  '6h',
  '12h',
  '24h',
  '3d',
  '7d',
  'today',
  'yesterday',
]);
const allowedAutoRefreshSeconds = new Set([0, 5, 15, 30, 60, 300]);

const getSearchParams = (
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
): string[] => {
  const value = searchParams[key];
  return Array.isArray(value) ? value : value ? [value] : [];
};

const UsagePage = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const params = await searchParams;
  const range = getSearchParams(params, 'range')[0];
  const autoRefreshSeconds = Number(getSearchParams(params, 'autoRefresh')[0]);
  const initialUsageRequest: UsageFiltersState = {
    accessKey: getSearchParams(params, 'accessKey').filter(Boolean),
    credential: getSearchParams(params, 'credential').filter(Boolean),
    range: allowedRanges.has(range as UsageRange)
      ? (range as UsageRange)
      : '24h',
  };

  return (
    <AdminPage
      initialTab="usage"
      initialUsageAutoRefreshSeconds={
        allowedAutoRefreshSeconds.has(autoRefreshSeconds)
          ? autoRefreshSeconds
          : 15
      }
      initialUsageRequest={initialUsageRequest}
    >
      <Usage />
    </AdminPage>
  );
};

export default UsagePage;
