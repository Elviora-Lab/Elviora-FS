export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export type ListQuery = {
  page?: number;
  pageSize?: number;
  sort?: string;
  q?: string;
};

export type NormalizedError = {
  status: number;
  code: string;
  message: string;
  details?: Record<string, unknown>;
};
