import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { isPrismaError } from '../../../common/helpers/prisma-error.helper';

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
