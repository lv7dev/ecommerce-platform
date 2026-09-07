import { ApiProperty } from '@nestjs/swagger';

export class CsrfTokenEntity {
  @ApiProperty({ example: 'x-csrf-token' })
  headerName: string;

  @ApiProperty({ example: '2026-09-07T10:00:00.000Z' })
  expiresAt: string;

  @ApiProperty({ example: 'csrf-token' })
  csrfToken: string;
}
