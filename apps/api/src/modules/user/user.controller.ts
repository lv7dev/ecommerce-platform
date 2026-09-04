import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Delete,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { UserStatus } from '../../generated/prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { AssignRoleDto } from './dto/assign-role.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UserEntity, UserListEntity } from './entities/user.entity';
import { UserService } from './user.service';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionsGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'List users with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'status', required: false, enum: UserStatus })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'roleCode', required: false, type: String })
  @ApiOkResponse({ type: UserListEntity })
  @RequirePermissions('user:read')
  @Get()
  findAll(@Query() query: FindUsersQueryDto) {
    return this.userService.findAll(query);
  }

  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiOkResponse({ type: UserEntity })
  @RequirePermissions('user:read')
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.findOne(id);
  }

  @ApiOperation({
    summary: 'Update user status and revoke sessions when blocked',
  })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiOkResponse({ type: UserEntity })
  @RequirePermissions('user:update')
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.userService.updateStatus(
      id,
      updateUserStatusDto,
      user,
      this.getRequestContext(request),
    );
  }

  @ApiOperation({ summary: 'Assign a role to a user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiOkResponse({ type: UserEntity })
  @RequirePermissions('user:manage_roles')
  @Post(':id/roles')
  assignRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignRoleDto: AssignRoleDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.userService.assignRole(
      id,
      assignRoleDto,
      user,
      this.getRequestContext(request),
    );
  }

  @ApiOperation({ summary: 'Remove a role from a user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiParam({ name: 'roleCode', example: 'STAFF' })
  @ApiOkResponse({ type: UserEntity })
  @RequirePermissions('user:manage_roles')
  @Delete(':id/roles/:roleCode')
  @HttpCode(HttpStatus.OK)
  removeRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('roleCode') roleCode: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.userService.removeRole(
      id,
      roleCode,
      user,
      this.getRequestContext(request),
    );
  }

  @ApiOperation({ summary: 'Revoke all active sessions for a user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @RequirePermissions('session:revoke')
  @Post(':id/revoke-sessions')
  @HttpCode(HttpStatus.OK)
  revokeSessions(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.userService.revokeSessions(
      id,
      user,
      this.getRequestContext(request),
    );
  }

  private getRequestContext(request: Request) {
    return {
      userAgent: request.headers['user-agent'],
      ipAddress: request.ip,
    };
  }
}
