import { Prisma } from '../../../generated/prisma/client';

export const userInclude = {
  roles: {
    include: {
      role: {
        include: {
          translations: true,
          permissions: {
            include: {
              permission: {
                include: {
                  translations: true,
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.UserInclude;

export type UserWithAuthRelations = Prisma.UserGetPayload<{
  include: typeof userInclude;
}>;
