import prisma from '../config/database';

export class CategoryService {
  // Create new category
  static async createCategory(categoryData: {
    name: string;
    description?: string;
    parentId?: string;
    imageUrl?: string;
  }) {
    const { name, description, parentId, imageUrl } = categoryData;

    // Check for duplicate category name at the same level
    const where: any = {
      name: {
        equals: name,
        mode: 'insensitive'
      }
    };

    if (parentId) {
      where.parentId = parentId;
      
      // Verify parent category exists
      const parentCategory = await prisma.category.findUnique({
        where: { id: parentId }
      });

      if (!parentCategory) {
        throw new Error('Parent category not found');
      }
    } else {
      where.parentId = null;
    }

    const existingCategory = await prisma.category.findFirst({ where });

    if (existingCategory) {
      throw new Error('Category with this name already exists at this level');
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
        parentId,
        imageUrl,
        isActive: true
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            children: true,
            products: true,
            services: true
          }
        }
      }
    });

    return category;
  }

  // Get all categories with hierarchy
  static async getAllCategories(includeInactive = false) {
    const where: any = {};
    
    if (!includeInactive) {
      where.isActive = true;
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: [
        { parentId: 'asc' },
        { name: 'asc' }
      ],
      include: {
        parent: {
          select: {
            id: true,
            name: true
          }
        },
        children: {
          where: includeInactive ? {} : { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            isActive: true
          }
        },
        _count: {
          select: {
            products: { where: { isActive: true } },
            services: { where: { isActive: true } }
          }
        }
      }
    });

    return categories;
  }

  // Get category by ID
  static async getCategoryById(categoryId: string) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        parent: {
          select: {
            id: true,
            name: true
          }
        },
        children: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true
          }
        },
        _count: {
          select: {
            products: { where: { isActive: true } },
            services: { where: { isActive: true } }
          }
        }
      }
    });

    if (!category) {
      throw new Error('Category not found');
    }

    return category;
  }

  // Get root categories (no parent)
  static async getRootCategories() {
    const categories = await prisma.category.findMany({
      where: {
        parentId: null,
        isActive: true
      },
      orderBy: { name: 'asc' },
      include: {
        children: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true
          }
        },
        _count: {
          select: {
            products: { where: { isActive: true } },
            services: { where: { isActive: true } }
          }
        }
      }
    });

    return categories;
  }

  // Get subcategories by parent ID
  static async getSubcategories(parentId: string) {
    const parent = await prisma.category.findUnique({
      where: { id: parentId }
    });

    if (!parent) {
      throw new Error('Parent category not found');
    }

    const subcategories = await prisma.category.findMany({
      where: {
        parentId,
        isActive: true
      },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            products: { where: { isActive: true } },
            services: { where: { isActive: true } },
            children: { where: { isActive: true } }
          }
        }
      }
    });

    return {
      parent: {
        id: parent.id,
        name: parent.name,
        description: parent.description
      },
      subcategories
    };
  }

  // Update category
  static async updateCategory(categoryId: string, updateData: {
    name?: string;
    description?: string;
    parentId?: string;
    imageUrl?: string;
    isActive?: boolean;
  }) {
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!existingCategory) {
      throw new Error('Category not found');
    }

    // Check for duplicate name if updating name
    if (updateData.name && updateData.name !== existingCategory.name) {
      const parentId = updateData.parentId !== undefined ? updateData.parentId : existingCategory.parentId;
      
      const where: any = {
        id: { not: categoryId },
        name: {
          equals: updateData.name,
          mode: 'insensitive'
        }
      };

      if (parentId) {
        where.parentId = parentId;
      } else {
        where.parentId = null;
      }

      const duplicateCategory = await prisma.category.findFirst({ where });

      if (duplicateCategory) {
        throw new Error('Category with this name already exists at this level');
      }
    }

    // Verify new parent exists if changing parent
    if (updateData.parentId && updateData.parentId !== existingCategory.parentId) {
      const parentCategory = await prisma.category.findUnique({
        where: { id: updateData.parentId }
      });

      if (!parentCategory) {
        throw new Error('Parent category not found');
      }

      // Prevent circular reference
      if (updateData.parentId === categoryId) {
        throw new Error('Category cannot be its own parent');
      }
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: updateData,
      include: {
        parent: {
          select: {
            id: true,
            name: true
          }
        },
        children: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            products: { where: { isActive: true } },
            services: { where: { isActive: true } }
          }
        }
      }
    });

    return category;
  }

  // Delete category (soft delete)
  static async deleteCategory(categoryId: string) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: {
            products: { where: { isActive: true } },
            services: { where: { isActive: true } },
            children: { where: { isActive: true } }
          }
        }
      }
    });

    if (!category) {
      throw new Error('Category not found');
    }

    // Check if category has active products, services, or subcategories
    if (category._count.products > 0 || category._count.services > 0 || category._count.children > 0) {
      throw new Error('Cannot delete category with active products, services, or subcategories');
    }

    // Soft delete
    await prisma.category.update({
      where: { id: categoryId },
      data: { isActive: false }
    });

    return { message: 'Category deleted successfully' };
  }

  // Get category hierarchy tree
  static async getCategoryTree() {
    const rootCategories = await prisma.category.findMany({
      where: {
        parentId: null,
        isActive: true
      },
      orderBy: { name: 'asc' },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
          include: {
            children: {
              where: { isActive: true },
              orderBy: { name: 'asc' },
              include: {
                _count: {
                  select: {
                    products: { where: { isActive: true } },
                    services: { where: { isActive: true } }
                  }
                }
              }
            },
            _count: {
              select: {
                products: { where: { isActive: true } },
                services: { where: { isActive: true } }
              }
            }
          }
        },
        _count: {
          select: {
            products: { where: { isActive: true } },
            services: { where: { isActive: true } }
          }
        }
      }
    });

    return rootCategories;
  }
} 