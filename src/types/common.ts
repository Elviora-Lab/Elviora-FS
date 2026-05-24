export type Nullable<T> = T | null;
export type Maybe<T> = T | undefined;
export type Awaitable<T> = T | Promise<T>;

export type Id = string;
export type Slug = string;
export type ISODate = string;

export type Money = {
  amount: number;
  currency: string;
};

export type SeoMeta = {
  title?: string;
  description?: string;
  ogImage?: string;
  canonical?: string;
};
