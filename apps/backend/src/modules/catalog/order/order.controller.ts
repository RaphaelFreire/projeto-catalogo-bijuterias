import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ConfirmOrderPayment,
  DeleteOrder,
  Order,
  OrderItem,
  OrderNotFoundError,
} from '@sdd/catalog';
import { PrismaOrderRepository } from './order.prisma';

interface OrderResponse {
  id: string;
  code: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  paymentConfirmed: boolean;
  createdAt: Date;
}

interface OrderPageResponse {
  items: OrderResponse[];
  total: number;
  page: number;
  perPage: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 20;

@Controller('orders')
export class OrderController {
  constructor(private readonly orderRepository: PrismaOrderRepository) {}

  @Get(':id')
  async findById(@Param('id') id: string): Promise<OrderResponse> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new OrderNotFoundError();
    }
    return this.toResponse(order);
  }

  @Get()
  async findPage(
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ): Promise<OrderPageResponse> {
    const pageNumber = parsePositiveInt(page) ?? DEFAULT_PAGE;
    const perPageNumber = parsePositiveInt(perPage) ?? DEFAULT_PER_PAGE;
    const result = await this.orderRepository.findPage({
      page: pageNumber,
      perPage: perPageNumber,
    });
    return {
      items: result.items.map((order) => this.toResponse(order)),
      total: result.total,
      page: result.page,
      perPage: result.perPage,
    };
  }

  @Post(':id/confirm-payment')
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirmPayment(@Param('id') id: string): Promise<void> {
    const useCase = new ConfirmOrderPayment(this.orderRepository);
    await useCase.execute({ id });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    const useCase = new DeleteOrder(this.orderRepository);
    await useCase.execute({ id });
  }

  private toResponse(order: Order): OrderResponse {
    return {
      id: order.id,
      code: order.code,
      customerName: order.customerName,
      items: order.items,
      total: order.total,
      paymentConfirmed: order.paymentConfirmed,
      createdAt: order.createdAt,
    };
  }
}

function parsePositiveInt(value: string | undefined): number | null {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return Math.floor(parsed);
}
