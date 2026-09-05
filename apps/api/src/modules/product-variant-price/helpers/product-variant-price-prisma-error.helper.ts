import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { isPrismaError } from '../../../common/helpers/prisma-error.helper';

export function handleProductVariantPricePrismaError(error: unknown): never {
  if (isPrismaError(error, 'P2002')) {
    throw new ConflictException(
      'Variant already has a price for this currency',
    );
  }

  if (isPrismaError(error, 'P2003')) {
    throw new BadRequestException('Referenced product variant not found');
  }

  if (isPrismaError(error, 'P2025')) {
    throw new NotFoundException('Product variant price not found');
  }

  throw error;
}
