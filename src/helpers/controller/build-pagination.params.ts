export function buildPagination(offset: number, limit: number, total: number) {
  const page = Math.floor(offset / limit) + 1;

  return {
    page,
    page_size: limit,
    total,
    total_pages: Math.ceil(total / limit),
  };
}