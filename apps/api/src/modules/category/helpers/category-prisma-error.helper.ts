import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

export function handleCategoryPrismaError(error: unknown): never {
  if (isPrismaError(error, 'P2002')) {
    throw new ConflictException('Category data already exists');
  }

  if (isPrismaError(error, 'P2003')) {
    throw new BadRequestException('Referenced parent category not found');
  }

  if (isPrismaError(error, 'P2025')) {
    throw new NotFoundException('Category not found');
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
