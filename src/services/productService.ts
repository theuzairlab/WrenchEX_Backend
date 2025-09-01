import prisma from '../config/database';
import { ProductFilters } from '../types';

export class ProductService {
  // Helper method to get seller by user ID
  static async getSellerByUserId(userId: string) {
    const seller = await prisma.seller.findUnique({
      where: { userId },
      select: { id: true, isApproved: true }
    });
    return seller;
  }

  // Create new product
  static async createProduct(sellerId: string, productData: {
    title: string;
    description: string;
    specifications?: any;
    price: number;
    categoryId: string;
    images?: string[];
  }) {
    const { title, description, specifications, price, categoryId, images } = productData;

    // Verify seller exists and is approved
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
      select: { id: true, isApproved: true }
    });

    if (!seller) {
      throw new Error('Seller not found');
    }

    if (!seller.isApproved) {
      throw new Error('Seller account must be approved to create products');
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, isActive: true }
    });

    if (!category) {
      throw new Error('Category not found');
    }

    if (!category.isActive) {
      throw new Error('Category is not active');
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        sellerId,
        categoryId,
        title,
        description,
        specifications: specifications || {},
        price,
        images: images || [],
        isActive: true,
        isFlagged: false
      },
      include: {
        seller: {
          select: {
            id: true,
            shopName: true,
            city: true,
            area: true,
            ratingAverage: true,
            ratingCount: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return product;
  }

  // Get product by ID
  static async getProductById(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        seller: {
          select: {
            id: true,
            userId: true,
            shopName: true,
            shopDescription: true,
            shopAddress: true,
            city: true,
            area: true,
            ratingAverage: true,
            ratingCount: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true
              }
            }
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (!product.isActive) {
      throw new Error('Product is not available');
    }

    return product;
  }

  // Get products with filters and pagination
  static async getProducts(filters: ProductFilters) {
    const {
      category,
      seller,
      sellerId,
      city,
      area,
      minPrice,
      maxPrice,
      search,
      status,
      includeInactive = false,
      page = 1,
      limit = 10
    } = filters;

    const skip = (page - 1) * limit;
    const where: any = {
      isFlagged: false,
      seller: {
        isApproved: true
      }
    };

    // Include/exclude inactive products
    if (!includeInactive) {
      where.isActive = true;
    }

    // Status filter (for seller's own products)
    if (status) {
      if (status === 'active') {
        where.isActive = true;
      } else if (status === 'inactive') {
        where.isActive = false;
      }
    }

    // Category filter
    if (category) {
      where.categoryId = category;
    }

    // Seller filter (legacy - by seller ID string)
    if (seller) {
      where.sellerId = seller;
    }

    // Seller filter (new - for seller's own products)
    if (sellerId) {
      where.sellerId = sellerId;
    }

    // Location filters
    if (city) {
      where.seller.city = {
        contains: city,
        mode: 'insensitive'
      };
    }

    if (area) {
      where.seller.area = {
        contains: area,
        mode: 'insensitive'
      };
    }

    // Price filters
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    // Search filter
    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          seller: {
            shopName: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          seller: {
            select: {
              id: true,
              shopName: true,
              city: true,
              area: true,
              ratingAverage: true,
              ratingCount: true
            }
          },
          category: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),
      prisma.product.count({ where })
    ]);

    return {
      products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get products by seller
  static async getProductsBySeller(sellerId: string, includeInactive = false) {
    const where: any = { sellerId };
    
    if (!includeInactive) {
      where.isActive = true;
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return products;
  }

  // Update product
  static async updateProduct(productId: string, sellerId: string, updateData: {
    title?: string;
    description?: string;
    specifications?: any;
    price?: number;
    stockQuantity?: number;
    categoryId?: string;
    images?: string[];
    isActive?: boolean;
  }) {
    // Verify product exists and belongs to seller
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        sellerId
      }
    });

    if (!existingProduct) {
      throw new Error('Product not found or you do not have permission to update it');
    }

    // If updating category, verify it exists and is active
    if (updateData.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: updateData.categoryId },
        select: { id: true, isActive: true }
      });

      if (!category) {
        throw new Error('Category not found');
      }

      if (!category.isActive) {
        throw new Error('Category is not active');
      }
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        seller: {
          select: {
            id: true,
            shopName: true,
            city: true,
            area: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return product;
  }

  // Toggle product status (activate/deactivate)
  static async toggleProductStatus(productId: string, sellerId: string) {
    // Verify product exists and belongs to seller
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        sellerId
      }
    });

    if (!existingProduct) {
      throw new Error('Product not found or you do not have permission to modify it');
    }

    // Toggle the active status
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { isActive: !existingProduct.isActive },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return {
      product: updatedProduct,
      message: `Product ${updatedProduct.isActive ? 'activated' : 'deactivated'} successfully`
    };
  }

  // Delete product (hard delete from database)
  static async deleteProduct(productId: string, sellerId: string) {
    // Verify product exists and belongs to seller
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        sellerId
      }
    });

    if (!existingProduct) {
      throw new Error('Product not found or you do not have permission to delete it');
    }

    // Hard delete the product
    await prisma.product.delete({
      where: { id: productId }
    });

    return { message: 'Product permanently deleted from database' };
  }

  // Get featured products (highest rated, most recent)
  static async getFeaturedProducts(limit = 8) {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        isFlagged: false,
        seller: {
          isApproved: true
        }
      },
      orderBy: [
        { ratingAverage: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      include: {
        seller: {
          select: {
            id: true,
            shopName: true,
            city: true,
            ratingAverage: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return products;
  }

  // Flag product for admin review
  static async flagProduct(productId: string, isFlagged: boolean) {
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new Error('Product not found');
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { isFlagged },
      include: {
        seller: {
          select: {
            shopName: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    return {
      product: updatedProduct,
      message: `Product ${isFlagged ? 'flagged for review' : 'unflagged'} successfully`
    };
  }
} 