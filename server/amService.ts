export interface AmSendResponse {
  success: boolean;
  message: string;
  data?: any;
  rawResponse?: any;
  error?: string;
}

export interface AmVerifResponse {
  success: boolean;
  status: 'SUCCESS' | 'FAILED' | 'REQUIRES_LINK';
  message: string;
  data?: any;
  result?: string;
  rawResponse?: any;
  error?: string;
}

export interface BulkAccountItem {
  email: string;
  accessLink?: string;
  password?: string;
  token?: string;
  raw?: string;
}

export interface AmBulkResponse {
  success: boolean;
  status: 'SUCCESS' | 'FAILED';
  message: string;
  accounts?: BulkAccountItem[];
  result?: string;
  rawResponse?: any;
  error?: string;
}

const AM_BASE_URL = 'https://am.dapjisync.my.id/api';
const API_KEY = process.env.AM_API_KEY || 'FREE';

/**
 * 1. API Send AM Prem Eceran
 * Endpoint: https://am.dapjisync.my.id/api/send
 * Method: POST
 * Headers: Content-Type: application/json, X-API-Key: FREE
 * Body: { "gmail": "user@gmail.com" }
 */
export async function callAmSendApi(gmail: string): Promise<AmSendResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const cleanGmail = gmail.trim().toLowerCase();
    console.log(`[AM_API] Calling SEND endpoint for ${cleanGmail}...`);

    const response = await fetch(`${AM_BASE_URL}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify({ gmail: cleanGmail }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    let responseData: any;
    try {
      responseData = await response.json();
    } catch {
      responseData = { message: await response.text() };
    }

    console.log(`[AM_API] Send response for ${cleanGmail}:`, responseData);

    const isSuccess =
      responseData.success === true ||
      responseData.status === true ||
      responseData.status === 'success' ||
      (response.ok && !responseData.error);

    if (isSuccess) {
      return {
        success: true,
        message: responseData.message || 'Link verifikasi berhasil dikirim ke email Gmail Anda.',
        data: responseData.data || responseData,
        rawResponse: responseData,
      };
    } else {
      return {
        success: false,
        message: responseData.message || responseData.error || 'Gagal mengirim link verifikasi ke Gmail',
        error: responseData.error || responseData.message,
        rawResponse: responseData,
      };
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error(`[AM_API] Error calling send API:`, error.message);
    const isTimeout = error.name === 'AbortError';
    return {
      success: false,
      message: isTimeout
        ? 'Timeout: Server AM tidak merespons pengiriman email dalam 25 detik.'
        : `Gagal terhubung ke API AM Send: ${error.message}`,
      error: error.message,
      rawResponse: { error: error.message },
    };
  }
}

/**
 * 2. API Verify AM Prem Eceran
 * Endpoint: https://am.dapjisync.my.id/api/verif
 * Method: POST
 * Headers: Content-Type: application/json, X-API-Key: FREE
 * Body: { "gmail": "user@gmail.com", "link": "https://alight-creative.firebaseapp.com/__/auth/links?link=..." }
 */
export async function callAmVerifApi(gmail: string, link: string): Promise<AmVerifResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const cleanGmail = gmail.trim().toLowerCase();
    const cleanLink = link.trim();
    console.log(`[AM_API] Calling VERIF endpoint for ${cleanGmail}...`);

    const response = await fetch(`${AM_BASE_URL}/verif`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify({
        gmail: cleanGmail,
        link: cleanLink,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    let responseData: any;
    try {
      responseData = await response.json();
    } catch {
      responseData = { message: await response.text() };
    }

    console.log(`[AM_API] Verif response for ${cleanGmail}:`, responseData);

    const isSuccess =
      responseData.success === true ||
      responseData.status === true ||
      responseData.status === 'success' ||
      (response.ok && !responseData.error);

    if (isSuccess) {
      const msg = responseData.message || 'Verifikasi berhasil! Akun Alight Motion Premium Anda telah aktif.';
      return {
        success: true,
        status: 'SUCCESS',
        message: msg,
        data: responseData,
        result: responseData.result || `Akun ${cleanGmail} berhasil diupgrade ke Alight Motion Premium!`,
        rawResponse: responseData,
      };
    } else {
      const errorDetail =
        responseData.error ||
        responseData.message ||
        'Magic link salah, kadaluarsa, atau sudah digunakan.';
      return {
        success: false,
        status: 'FAILED',
        message: errorDetail,
        error: errorDetail,
        data: responseData,
        rawResponse: responseData,
      };
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error(`[AM_API] Error calling verif API:`, error.message);
    const isTimeout = error.name === 'AbortError';
    return {
      success: false,
      status: 'FAILED',
      message: isTimeout
        ? 'Timeout: Server AM tidak merespons verifikasi dalam 30 detik.'
        : `Gagal terhubung ke API AM Verif: ${error.message}`,
      error: error.message,
      rawResponse: { error: error.message },
    };
  }
}

/**
 * 3. API AM Prem Bulk
 * Endpoint: https://am.dapjisync.my.id/api/bulk
 * Method: POST
 * Headers: Content-Type: application/json, X-API-Key: FREE
 * Body: { "total": 5 }
 */
export async function callAmBulkApi(total: number): Promise<AmBulkResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    const numTotal = Number(total) || 1;
    console.log(`[AM_API] Calling BULK endpoint for ${numTotal} accounts...`);

    const response = await fetch(`${AM_BASE_URL}/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify({ total: numTotal }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    let responseData: any;
    try {
      responseData = await response.json();
    } catch {
      responseData = { message: await response.text() };
    }

    console.log(`[AM_API] Bulk response:`, responseData);

    const isSuccess =
      responseData.success === true ||
      responseData.status === true ||
      responseData.status === 'success' ||
      (response.ok && !responseData.error);

    if (isSuccess) {
      const parsedAccounts: BulkAccountItem[] = [];

      // DAPJISYNC format: { creator: "dapjisync", status: true, data: { total: 1, emails: [{ email, access_link }] } }
      if (responseData.data && Array.isArray(responseData.data.emails)) {
        for (const item of responseData.data.emails) {
          parsedAccounts.push({
            email: item.email || item.gmail || 'Akun AM',
            accessLink: item.access_link || item.link || item.inbox,
            password: item.password,
          });
        }
      } else if (Array.isArray(responseData.emails)) {
        for (const item of responseData.emails) {
          parsedAccounts.push({
            email: item.email || item.gmail || 'Akun AM',
            accessLink: item.access_link || item.link,
            password: item.password,
          });
        }
      } else if (Array.isArray(responseData.accounts)) {
        for (const item of responseData.accounts) {
          parsedAccounts.push({
            email: item.email || item.gmail || String(item),
            accessLink: item.access_link || item.link,
            password: item.password,
          });
        }
      } else if (Array.isArray(responseData)) {
        for (const item of responseData) {
          if (typeof item === 'string') {
            parsedAccounts.push({ email: item });
          } else {
            parsedAccounts.push({
              email: item.email || item.gmail || JSON.stringify(item),
              accessLink: item.access_link || item.link,
              password: item.password,
            });
          }
        }
      }

      // Build readable summary for user display and copying
      let resultSummary = '';
      if (parsedAccounts.length > 0) {
        resultSummary = parsedAccounts
          .map((acc, i) => {
            const parts = [`#${i + 1} Email: ${acc.email}`];
            if (acc.accessLink) parts.push(`Inbox Link: ${acc.accessLink}`);
            if (acc.password) parts.push(`Sandi: ${acc.password}`);
            return parts.join('\n');
          })
          .join('\n\n');
      } else {
        resultSummary = `${numTotal} Akun AM Premium Bulk berhasil diproses.`;
      }

      return {
        success: true,
        status: 'SUCCESS',
        message: responseData.data?.message || responseData.message || `Berhasil generate ${numTotal} akun AM Premium`,
        accounts: parsedAccounts,
        result: resultSummary,
        rawResponse: responseData,
      };
    } else {
      const errorMsg = responseData.error || responseData.message || 'Gagal memproses pembuatan akun bulk';
      return {
        success: false,
        status: 'FAILED',
        message: errorMsg,
        error: errorMsg,
        rawResponse: responseData,
      };
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error(`[AM_API] Error calling bulk API:`, error.message);
    const isTimeout = error.name === 'AbortError';
    return {
      success: false,
      status: 'FAILED',
      message: isTimeout
        ? 'Timeout: Server AM Bulk tidak merespons dalam 45 detik.'
        : `Gagal terhubung ke API AM Bulk: ${error.message}`,
      error: error.message,
      rawResponse: { error: error.message },
    };
  }
}
