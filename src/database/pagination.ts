export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class Pagination {
  static paginate<T>(
    items: T[],
    options: PaginationOptions = {},
  ): PaginatedResult<T> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedData = items.slice(startIndex, endIndex);
    const total = items.length;
    const totalPages = Math.ceil(total / limit);

    return {
      data: paginatedData,
      total,
      page,
      limit,
      totalPages,
    };
  }
}
