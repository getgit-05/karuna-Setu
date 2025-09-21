export async function apiGet<T>(
  url: string,
  fallback: T,
  timeout = 5000,
): Promise<T> {
  // If offline, immediately return fallback to avoid noisy network errors
  if (typeof navigator !== "undefined" && !navigator.onLine) return fallback;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(id);
    if (!res.ok) {
      // don't spam console with stack traces for normal 4xx/5xx responses
      console.warn(`apiGet ${url} returned status ${res.status}`);
      return fallback;
    }
    return (await res.json()) as T;
  } catch (err: any) {
    // fetch can throw on network failures or abort; show a concise warning only
    if (err && err.name === "AbortError") {
      console.warn(`apiGet ${url} aborted after ${timeout}ms`);
    } else {
      console.warn(
        `apiGet ${url} failed: ${err?.message || err}`,
        err?.stack ? undefined : err,
      );
    }
    return fallback;
  }
}

export async function apiPost(url: string, data: any, timeout = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: controller.signal,
    });
    clearTimeout(id);
    return res;
  } catch (err: any) {
    if (err && err.name === "AbortError") {
      console.warn(`apiPost ${url} aborted after ${timeout}ms`);
    } else {
      console.warn(
        `apiPost ${url} failed: ${err?.message || err}`,
        err?.stack ? undefined : err,
      );
    }
    return new Response(null, { status: 500 });
  }
}

