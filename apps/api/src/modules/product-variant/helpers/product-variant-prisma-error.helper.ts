import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { isPrismaError } from '../../../common/helpers/prisma-error.helper';

export function handleProductVariantPrismaError(error: unknown): never {
  if (isPrismaError(error, 'P2002')) {
    throw new ConflictException('Product variant data already exists');
  }

  if (isPrismaError(error, 'P2003')) {
    throw new BadRequestException(
      'Referenced product or option value not found',
    );
  }

  if (isPrismaError(error, 'P2025')) {
    throw new NotFoundException('Product variant not found');
  }

  throw error;
}
