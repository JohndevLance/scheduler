export class ApiResponseDto<T> {
  data: T;
  message?: string;
  statusCode: number;
  timestamp: string;

  static success<T>(
    data: T,
    message?: string,
    statusCode = 200,
  ): ApiResponseDto<T> {
    const res = new ApiResponseDto<T>();
    res.data = data;
    res.message = message;
    res.statusCode = statusCode;
    res.timestamp = new Date().toISOString();
    return res;
  }
}

export class PaginatedResponseDto<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;

  static of<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): PaginatedResponseDto<T> {
    const res = new PaginatedResponseDto<T>();
    res.data = data;
    res.total = total;
    res.page = page;
    res.limit = limit;
    res.totalPages = Math.ceil(total / limit);
    return res;
  }
}
