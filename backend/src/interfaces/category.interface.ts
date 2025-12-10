export interface ICategory {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  ancestors: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategoryInput {
  name: string;
  slug: string;
  parentId?: string | null;
}
