import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { isPrismaError } from '../../../common/helpers/prisma-error.helper';

export function handleOptionPrismaError(error: unknown): never {
  if (isPrismaError(error, 'P2002')) {
    throw new ConflictException('Option data already exists');
  }

  if (isPrismaError(error, 'P2003')) {
    throw new BadRequestException(
      'Option is referenced by products or variants',
    );
  }

  if (isPrismaError(error, 'P2025')) {
    throw new NotFoundException('Option not found');
  }

  throw error;
}
