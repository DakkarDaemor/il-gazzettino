export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
      body: "",
    };
  }

  const url = event.queryStringParameters?.url;
  if (!url) return { statusCode: 400, body: "Missing url" };

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
        "Accept-Language": "it-IT,it;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
    });

    const buf = await response.arrayBuffer();
    return {
      statusCode: response.status,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": response.headers.get("content-type") || "application/xml",
      },
      body: Buffer.from(buf).toString("base64"),
      isBase64Encoded: true,
    };
  } catch (e) {
    return { statusCode: 502, body: "Proxy error: " + e.message };
  }
};
