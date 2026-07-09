import type { NextRequest } from 'next/server';

import { getAuthErrorResponse } from '@/lib/server/auth';
import { handleMessagesRequest } from '@/lib/server/anthropic';
import { getJsonBody } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = async (request: NextRequest): Promise<Response> => {
  const authError = getAuthErrorResponse(request);

  if (authError) {
    return authError;
  }

  return handleMessagesRequest(request, await getJsonBody(request));
};
