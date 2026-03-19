export interface ApiErrorDetail {
  code: string;
  message: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiErrorDetail;
}
