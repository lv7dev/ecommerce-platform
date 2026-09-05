import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma, ProductStatus } from '../../../generated/prisma/client';
import { CartItemWithRelations } from '../../cart/constants/cart.include';
import { OrderWithRelations } from '../constants/order.include';

export interface CheckoutLine {
  item: CartItemWithRelations;
  unitAmountMinor: bigint;
  lineTotalMinor: bigint;
}

@Injectable()
export class InventoryReservationService {
  async reserveStock(
    tx: Prisma.TransactionClient,
    line: CheckoutLine,
  ): Promise<void> {
    const updated = await tx.$executeRaw`
      UPDATE "product_variants" AS pv
      SET "reserved_stock" = pv."reserved_stock" + ${line.item.quantity}
      FROM "products" AS p
      WHERE pv."id" = ${line.item.variantId}
        AND pv."productId" = p."id"
        AND pv."isActive" = true
        AND p."status" = ${ProductStatus.ACTIVE}::"ProductStatus"
        AND (pv."stock" - pv."reserved_stock") >= ${line.item.quantity}
    `;

    if (updated !== 1) {
      throw new ConflictException(
        `Insufficient available stock for SKU ${line.item.variant.sku}`,
      );
    }
  }

  async releaseReservation(
    tx: Prisma.TransactionClient,
    order: OrderWithRelations,
  ): Promise<void> {
    for (const item of order.items) {
      const updated = await tx.$executeRaw`
        UPDATE "product_variants"
        SET "reserved_stock" = "reserved_stock" - ${item.quantity}
        WHERE "id" = ${item.variantId}
          AND "reserved_stock" >= ${item.quantity}
      `;

      if (updated !== 1) {
        throw new ConflictException(
          `Cannot release reservation for SKU ${item.sku}`,
        );
      }
    }
  }

  async consumeReservation(
    tx: Prisma.TransactionClient,
    order: OrderWithRelations,
  ): Promise<void> {
    for (const item of order.items) {
      const updated = await tx.$executeRaw`
        UPDATE "product_variants"
        SET
          "stock" = "stock" - ${item.quantity},
          "reserved_stock" = "reserved_stock" - ${item.quantity}
        WHERE "id" = ${item.variantId}
          AND "stock" >= ${item.quantity}
          AND "reserved_stock" >= ${item.quantity}
      `;

      if (updated !== 1) {
        throw new ConflictException(
          `Cannot consume reservation for SKU ${item.sku}`,
        );
      }
    }
  }
}
