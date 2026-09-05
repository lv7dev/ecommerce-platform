import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { isPrismaError } from '../../../common/helpers/prisma-error.helper';

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
