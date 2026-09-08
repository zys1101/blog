import axios from "axios";
import type {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import type { ApiResponse } from "../types";

const TOKEN_KEY: string = "devlog-token";
export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string): void =>
  localStorage.setItem(TOKEN_KEY, token);
export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY);

const request: AxiosInstance = axios.create({
  baseURL: "/api",
  timeout: 12000,
});
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token: string | null = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
);
request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<unknown>>): AxiosResponse<unknown> => {
    const envelope: ApiResponse<unknown> = response.data;
    if (envelope.code !== 0) throw new Error(envelope.message || "请求失败");
    // 剥壳后 response.data 即业务数据；保留 AxiosResponse 类型，不伪造 Axios 的泛型签名。
    return { ...response, data: envelope.data };
  },
  (error: AxiosError<ApiResponse<null>>): Promise<never> => {
    if (error.response?.status === 401) {
      clearToken();
      if (window.location.pathname.startsWith("/admin/")) {
        const destination: string = window.location.pathname;
        window.location.replace(
          `/login?redirect=${encodeURIComponent(destination)}&expired=1`,
        );
      }
    }
    return Promise.reject(
      new Error(
        error.response?.data?.message || "暂时无法连接服务，请稍后重试。",
      ),
    );
  },
);
export default request;
