import { CapacitorHttp, HttpResponse } from '@capacitor/core';

/**
 * Environment Configuration
 * -------------------------
 * Vite automatically loads environment variables based on the --mode flag:
 * 
 * Commands:
 *   npm run dev        → loads .env.development (MODE = 'development')
 *   npm run dev:qa     → loads .env.qa          (MODE = 'qa')
 *   npm run build:prod → loads .env.production  (MODE = 'production')
 * 
 * Each .env file should contain:
 *   VITE_API_URL=http://your-api-url.com
 */
const getBaseURL = (): string => {
  // VITE_API_URL is set in .env.development, .env.qa, or .env.production
  const apiUrl = import.meta.env.VITE_API_URL;
  
  if (apiUrl) {
    console.log(`[API] Mode: ${import.meta.env.MODE}, URL: ${apiUrl}`);
    return apiUrl;
  }
  
  // Fallback URLs if VITE_API_URL is not defined
  const fallbackUrls: Record<string, string> = {
    development: 'http://localhost:3000',
    qa: 'http://zkteco-qa-env.eba-nzmdmds8.us-east-2.elasticbeanstalk.com',
    production: 'http://zkteco-qa-env.eba-nzmdmds8.us-east-2.elasticbeanstalk.com', // TODO: Update with prod URL
  };
  
  const mode = import.meta.env.MODE || 'qa';
  const fallbackUrl = fallbackUrls[mode] || fallbackUrls.qa;
  
  console.warn(`[API] VITE_API_URL not set, using fallback for ${mode}: ${fallbackUrl}`);
  return fallbackUrl;
};

const baseURL = getBaseURL();

const defaultOptions = {
  connectTimeout: 10000,
  readTimeout: 10000,
}

class HttpClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string, defaultHeaders: Record<string, string> = {}) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders
    };
  }

  private buildUrl(endpoint: string): string {
    return `${this.baseURL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  }

  private mergeHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    return { ...this.defaultHeaders, ...customHeaders };
  }

  private convertParams(params?: Record<string, string | number | boolean>): Record<string, string> | undefined {
    if (!params) return undefined;

    const convertedParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      convertedParams[key] = String(value);
    }
    return convertedParams;
  }

  async get<T = HttpResponse>(endpoint: string, options: {
    params?: Record<string, string | number | boolean>;
    headers?: Record<string, string>;
  } = {}): Promise<T> {
    try {
      const response = await CapacitorHttp.get({
        url: this.buildUrl(endpoint),
        headers: this.mergeHeaders(options.headers),
        params: this.convertParams(options.params),
        ...defaultOptions,
      });

      return response as T;
    } catch (error) {
      console.error('GET Error:', error);
      throw error;
    }
  }

  async post<T = HttpResponse>(endpoint: string, data: Record<string, unknown> = {}, options: {
    headers?: Record<string, string>;
  } = {}): Promise<T> {
    try {
      const response = await CapacitorHttp.post({
        url: this.buildUrl(endpoint),
        headers: this.mergeHeaders(options.headers),
        data: data,
        ...defaultOptions,
      });

      return response as T;
    } catch (error) {
      console.error('POST Error:', error);
      throw error;
    }
  }

  async put<T = HttpResponse>(endpoint: string, data: Record<string, unknown> = {}, options: {
    headers?: Record<string, string>;
  } = {}): Promise<T> {
    try {
      const response = await CapacitorHttp.put({
        url: this.buildUrl(endpoint),
        headers: this.mergeHeaders(options.headers),
        data: data,
        ...defaultOptions,
      });

      return response as T;
    } catch (error) {
      console.error('PUT Error:', error);
      throw error;
    }
  }

  async delete<T = HttpResponse>(endpoint: string, options: {
    headers?: Record<string, string>;
  } = {}): Promise<T> {
    try {
      const response = await CapacitorHttp.delete({
        url: this.buildUrl(endpoint),
        headers: this.mergeHeaders(options.headers),
        ...defaultOptions,
      });

      return response as T;
    } catch (error) {
      console.error('DELETE Error:', error);
      throw error;
    }
  }

  async patch<T = HttpResponse>(endpoint: string, data: Record<string, unknown> = {}, options: {
    headers?: Record<string, string>
  } = {}): Promise<T> {
    try {
      const response = await CapacitorHttp.patch({
        url: this.buildUrl(endpoint),
        headers: this.mergeHeaders(options.headers),
        data: data,
        ...defaultOptions,
      });

      return response as T;
    } catch (error) {
      console.error();
      throw error;
    }
  }

  setAuthToken(token: string) {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  removeAuthToken() {
    delete this.defaultHeaders['Authorization'];
  }
}

const httpClient = new HttpClient(baseURL);

export default httpClient;