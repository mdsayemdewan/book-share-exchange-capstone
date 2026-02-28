export async function uploadBase64ToImgbb({ base64, name }) {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) throw new Error('IMGBB_API_KEY is not set');

  // Accept either raw base64 or data URL. ImgBB wants raw base64.
  const raw = String(base64 || '');
  const cleaned = raw.includes('base64,') ? raw.split('base64,').pop() : raw;
  if (!cleaned) throw new Error('Missing image base64');

  const body = new URLSearchParams();
  body.set('image', cleaned);
  if (name) body.set('name', name);

  const resp = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const json = await resp.json().catch(() => null);
  if (!resp.ok || !json?.success) {
    const msg = json?.error?.message || `ImgBB upload failed (${resp.status})`;
    throw new Error(msg);
  }

  return {
    url: json.data?.url,
    displayUrl: json.data?.display_url,
    deleteUrl: json.data?.delete_url,
  };
}
