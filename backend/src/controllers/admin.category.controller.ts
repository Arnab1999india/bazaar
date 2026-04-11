import { Request, Response } from "express";
import { Category } from "../models/Category";
import { CatalogService } from "../services/catalog.service";

export class AdminCategoryController {
  static async list(_req: Request, res: Response) {
    const tree = await CatalogService.getCategoryTree();
    res.json({ success: true, data: tree });
  }

  static async create(req: Request, res: Response) {
    const { name, slug, parentId } = req.body;
    const derivedSlug = slug || name.toLowerCase().replace(/\s+/g, "-");

    const exists = await Category.findOne({ slug: derivedSlug });
    if (exists) {
      res.status(409).json({ success: false, message: "A category with this slug already exists." });
      return;
    }

    const ancestors: string[] = [];
    if (parentId) {
      const parent = await Category.findById(parentId);
      if (!parent) {
        res.status(404).json({ success: false, message: "Parent category not found." });
        return;
      }
      ancestors.push(...(parent.ancestors ?? []), parent.id);
    }

    const category = await Category.create({ name, slug: derivedSlug, parentId: parentId || null, ancestors });
    res.status(201).json({ success: true, data: category });
  }

  static async update(req: Request, res: Response) {
    const { id } = req.params;
    const { name, slug, parentId } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      res.status(404).json({ success: false, message: "Category not found." });
      return;
    }

    if (name) category.name = name;
    if (slug) category.slug = slug;

    if (parentId !== undefined) {
      if (parentId && parentId !== String(category.parentId)) {
        const parent = await Category.findById(parentId);
        if (!parent) {
          res.status(404).json({ success: false, message: "Parent category not found." });
          return;
        }
        category.parentId = parentId;
        category.ancestors = [...(parent.ancestors ?? []), parent.id];
      } else if (!parentId) {
        category.parentId = null;
        category.ancestors = [];
      }
    }

    await category.save();
    res.json({ success: true, data: category });
  }

  static async remove(req: Request, res: Response) {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) {
      res.status(404).json({ success: false, message: "Category not found." });
      return;
    }
    // Also remove all children
    await Category.deleteMany({ ancestors: id });
    await category.deleteOne();
    res.json({ success: true, message: "Category deleted." });
  }
}
