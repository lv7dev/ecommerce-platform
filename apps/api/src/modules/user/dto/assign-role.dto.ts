import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class AssignRoleDto {
  @ApiProperty({ example: 'STAFF' })
  @IsString()
  @Matches(/^[A-Z][A-Z0-9_]*$/)
  roleCode: string;
}
