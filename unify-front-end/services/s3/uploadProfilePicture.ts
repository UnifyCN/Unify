import { supabase } from '@/lib/supabase';
const SUPABASE_URL = 'https://wrbauxutkysljmsqojts.supabase.co';

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

async function getAccessToken(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error('Not logged in');
  return token;
}

export async function uploadProfilePicture(
  file: Blob | Uint8Array,
  contentType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg'
): Promise<UploadResult> {
  try {
    const token = await getAccessToken();

    // 1) sign PUT
    const signResp = await fetch(
      `${SUPABASE_URL}/functions/v1/profile-picture-upload`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ contentType }),
      }
    );

    const signJson = await signResp.json().catch(() => ({}));
    if (!signResp.ok) {
      throw new Error(
        signJson?.error ?? `Failed to sign upload (${signResp.status})`
      );
    }

    const { uploadUrl, key } = signJson as { uploadUrl: string; key: string };

    // 2) PUT to S3
    const putResp = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: file as any,
    });

    if (!putResp.ok) {
      const text = await putResp.text().catch(() => '');
      throw new Error(`S3 upload failed (${putResp.status}): ${text}`);
    }

    // 3) get signed GET url for displaying (optional but useful)
    const url = await getProfilePictureUrl(key);

    return { success: true, key, url };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Upload failed',
    };
  }
}
export async function getProfilePictureUrl(key: string): Promise<string> {
  const token = await getAccessToken();

  const resp = await fetch(`${SUPABASE_URL}/functions/v1/profile-picture-get`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ key }),
  });

  const json = await resp.json().catch(() => ({}));
  if (!resp.ok)
    throw new Error(json?.error ?? `Failed to sign GET (${resp.status})`);

  return json.url as string;
}

export async function deleteProfilePicture(key: string): Promise<UploadResult> {
  try {
    const token = await getAccessToken();

    const resp = await fetch(
      `${SUPABASE_URL}/functions/v1/profile-picture-remove`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ key }),
      }
    );

    const json = await resp.json().catch(() => ({}));
    if (!resp.ok)
      throw new Error(json?.error ?? `Failed to sign delete (${resp.status})`);

    const deleteUrl = json.deleteUrl as string;

    const delResp = await fetch(deleteUrl, { method: 'DELETE' });
    if (!delResp.ok) {
      const text = await delResp.text().catch(() => '');
      throw new Error(`S3 delete failed (${delResp.status}): ${text}`);
    }

    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Delete failed',
    };
  }
}
