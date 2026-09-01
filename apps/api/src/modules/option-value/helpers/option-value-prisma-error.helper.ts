import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

export function handleOptionValuePrismaError(error: unknown): never {
  if (isPrismaError(error, 'P2002')) {
    throw new ConflictException('Option value data already exists');
  }

  if (isPrismaError(error, 'P2003')) {
    throw new BadRequestException('Option value is referenced by variants');
  }

  if (isPrismaError(error, 'P2025')) {
    throw new NotFoundException('Option value not found');
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
