import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { AuditLogService } from './audit-log.service';
import { FindAuditLogsQueryDto } from './dto/find-audit-logs-query.dto';
import { AuditLogListEntity } from './entities/audit-log.entity';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionsGuard)
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @ApiOperation({ summary: 'List audit logs with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'actorId', required: false, type: String })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'targetType', required: false, type: String })
  @ApiQuery({ name: 'targetId', required: false, type: String })
  @ApiOkResponse({ type: AuditLogListEntity })
  @RequirePermissions('audit:read')
  @Get()
  findAll(@Query() query: FindAuditLogsQueryDto) {
    return this.auditLogService.findAll(query);
  }
}
