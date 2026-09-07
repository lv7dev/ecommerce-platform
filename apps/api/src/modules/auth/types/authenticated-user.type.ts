import { UserStatus } from '../../../generated/prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  emailVerifiedAt: string | null;
  name: string | null;
  status: UserStatus;
  sessionId: string;
  roles: string[];
  permissions: string[];
}
