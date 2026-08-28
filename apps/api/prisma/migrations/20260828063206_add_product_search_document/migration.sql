-- CreateTable
CREATE TABLE "product_search_documents" (
    "productId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "content" TEXT NOT NULL,
    "normalizedContent" TEXT NOT NULL,

    CONSTRAINT "product_search_documents_pkey" PRIMARY KEY ("productId","locale")
);

-- CreateIndex
CREATE INDEX "product_search_documents_locale_idx" ON "product_search_documents"("locale");

-- AddForeignKey
ALTER TABLE "product_search_documents" ADD CONSTRAINT "product_search_documents_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
