/**
 * Fetch with timeout utility
 * Prevents hanging requests by enforcing a maximum wait time
 */

export interface FetchWithTimeoutOptions extends RequestInit {
  timeout?: number; // Timeout in milliseconds (default: 30000)
}

/**
 * Fetch wrapper with automatic timeout
 * @param url - URL to fetch
 * @param options - Fetch options with optional timeout
 * @returns Promise with Response or throws timeout error
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Convert abort errors to timeout errors
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    
    throw error;
  }
}
