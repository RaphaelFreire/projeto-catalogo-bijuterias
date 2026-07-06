import { Body, Controller, Get, HttpCode, HttpException, HttpStatus, Param, Post } from '@nestjs/common';
import { Banner, Category, CreateOrder, Order, OrderItem, OrderNotFoundError, Product } from '@sdd/catalog';
import { Public } from '../../../shared/decorators/public.decorator';
import { PrismaService } from '../../../db/prisma.service';
import { PrismaProductRepository } from '../product/product.prisma';
import { PrismaStockRepository } from '../stock/stock.prisma';
import { PrismaCategoryRepository } from '../category/category.prisma';
import { PrismaBannerRepository } from '../../settings/banner/banner.prisma';
import { PrismaOrderRepository } from '../order/order.prisma';

interface StorefrontProductResponse {
  id: string;
  name: string;
  description: string | null;
  price: number;
  images: string[];
  categoryId: string | null;
  quantity: number;
  bestSeller: boolean;
  dailyDeal: boolean;
  lastUnits: boolean;
}

interface StorefrontBannerResponse {
  id: string;
  imageUrl: string;
  imageUrlMobile: string | null;
  categoryId: string | null;
  linkUrl: string | null;
}

interface StorefrontCategoryResponse {
  id: string;
  name: string;
}

interface CheckoutItemIn {
  productId: string;
  quantity: number;
}

interface CheckoutIn {
  customerName: string;
  items: CheckoutItemIn[];
}

interface StorefrontOrderResponse {
  code: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  createdAt: Date;
}

const MAX_STOREFRONT_PRODUCTS = 500;
const MAX_STOREFRONT_BANNERS = 20;
const MAX_STOREFRONT_CATEGORIES = 200;

@Controller('storefront')
export class StorefrontController {
  constructor(
    private readonly productRepository: PrismaProductRepository,
    private readonly stockRepository: PrismaStockRepository,
    private readonly categoryRepository: PrismaCategoryRepository,
    private readonly bannerRepository: PrismaBannerRepository,
    private readonly orderRepository: PrismaOrderRepository,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Get('products')
  async findActiveProducts(): Promise<StorefrontProductResponse[]> {
    const page = await this.productRepository.findPage({
      page: 1,
      perPage: MAX_STOREFRONT_PRODUCTS,
    });

    const activeProducts = page.items.filter((product) => product.status === 'active');

    return Promise.all(
      activeProducts.map(async (product) => this.toProductResponse(product)),
    );
  }

  @Public()
  @Get('banners')
  async findBanners(): Promise<StorefrontBannerResponse[]> {
    const page = await this.bannerRepository.findPage({
      page: 1,
      perPage: MAX_STOREFRONT_BANNERS,
    });

    return page.items.map((banner) => this.toBannerResponse(banner));
  }

  @Public()
  @Get('categories')
  async findCategories(): Promise<StorefrontCategoryResponse[]> {
    const page = await this.categoryRepository.findPage({
      page: 1,
      perPage: MAX_STOREFRONT_CATEGORIES,
    });

    return page.items.map((category) => this.toCategoryResponse(category));
  }

  @Public()
  @Post('checkout')
  @HttpCode(HttpStatus.CREATED)
  async checkout(@Body() body: CheckoutIn): Promise<{ code: string }> {
    const code = await this.prisma.$transaction(async (tx) => {
      // `tx` (Prisma.TransactionClient) tem os mesmos delegates de modelo que PrismaService,
      // só sem $connect/$transaction/etc — os repositórios só usam os delegates, então o cast é seguro.
      const txClient = tx as unknown as PrismaService;
      const stockRepository = new PrismaStockRepository(txClient);
      const orderItems: OrderItem[] = [];
      const insufficientItems: { productId: string }[] = [];

      for (const item of body.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        const decremented = product
          ? await stockRepository.decrementIfAvailable(item.productId, item.quantity)
          : false;

        if (!product || !decremented) {
          insufficientItems.push({ productId: item.productId });
          continue;
        }

        orderItems.push({
          productId: item.productId,
          name: product.name,
          price: product.price.toNumber(),
          quantity: item.quantity,
        });
      }

      if (insufficientItems.length > 0) {
        throw new HttpException(
          { message: ['order.stock.insufficient'], insufficientItems },
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }

      const orderRepository = new PrismaOrderRepository(txClient);
      const createOrder = new CreateOrder(orderRepository);
      return createOrder.execute({ customerName: body.customerName, items: orderItems });
    });

    return { code };
  }

  @Public()
  @Get('orders/:code')
  async findOrderByCode(@Param('code') code: string): Promise<StorefrontOrderResponse> {
    const order = await this.orderRepository.findByCode(code);
    if (!order) {
      throw new OrderNotFoundError();
    }
    return this.toOrderResponse(order);
  }

  private async toProductResponse(product: Product): Promise<StorefrontProductResponse> {
    const stock = await this.stockRepository.findByProductId(product.id);
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      images: product.images,
      categoryId: product.categoryId,
      quantity: stock?.quantity ?? 0,
      bestSeller: product.bestSeller,
      dailyDeal: product.dailyDeal,
      lastUnits: product.lastUnits,
    };
  }

  private toCategoryResponse(category: Category): StorefrontCategoryResponse {
    return {
      id: category.id,
      name: category.name,
    };
  }

  private toBannerResponse(banner: Banner): StorefrontBannerResponse {
    return {
      id: banner.id,
      imageUrl: banner.imageUrl,
      imageUrlMobile: banner.imageUrlMobile,
      categoryId: banner.categoryId,
      linkUrl: banner.linkUrl,
    };
  }

  private toOrderResponse(order: Order): StorefrontOrderResponse {
    return {
      code: order.code,
      customerName: order.customerName,
      items: order.items,
      total: order.total,
      createdAt: order.createdAt,
    };
  }
}
