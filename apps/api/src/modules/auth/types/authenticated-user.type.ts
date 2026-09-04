import { UserStatus } from '../../../generated/prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  status: UserStatus;
  sessionId: string;
  roles: string[];
  permissions: string[];
}
