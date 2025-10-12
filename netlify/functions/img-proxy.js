export async function handler(event) {
  const file = event.path.replace('/.netlify/functions/img-proxy/', '');
  const targetUrl = `http://202.28.34.203:30000/upload/${encodeURIComponent(file)}`;

  try {
    const response = await fetch(targetUrl);
    if (!response.ok) {
      return { statusCode: response.status, body: 'Not Found' };
    }

    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      },
      body: Buffer.from(arrayBuffer).toString('base64'),
      isBase64Encoded: true
    };
  } catch (err) {
    console.error('Proxy error:', err);
    return { statusCode: 500, body: 'Proxy failed' };
  }
}
