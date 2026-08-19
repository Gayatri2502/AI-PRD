export type ApiError = { error: string | unknown };
export type ApiSuccess<T> = { data: T };
export type Paginated<T> = { items: T[]; total: number; page: number; pageSize: number };
