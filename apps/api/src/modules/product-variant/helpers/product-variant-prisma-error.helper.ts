import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

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

function isPrismaError(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === code
  );
}
