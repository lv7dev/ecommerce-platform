import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

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

function isPrismaError(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === code
  );
}
