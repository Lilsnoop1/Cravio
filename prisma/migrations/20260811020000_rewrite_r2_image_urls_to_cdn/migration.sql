-- Hostname-only rewrite: Worker public URL → R2 custom domain.
-- Object keys are unchanged. No schema change.

UPDATE "Product"
SET image = REPLACE(
  image,
  'https://cravio-r2-upload.zulfiqarammar8.workers.dev',
  'https://cdn.craviopk.com'
)
WHERE image LIKE 'https://cravio-r2-upload.zulfiqarammar8.workers.dev%';

UPDATE "Product"
SET "companyImage" = REPLACE(
  "companyImage",
  'https://cravio-r2-upload.zulfiqarammar8.workers.dev',
  'https://cdn.craviopk.com'
)
WHERE "companyImage" LIKE 'https://cravio-r2-upload.zulfiqarammar8.workers.dev%';

UPDATE "Company"
SET image = REPLACE(
  image,
  'https://cravio-r2-upload.zulfiqarammar8.workers.dev',
  'https://cdn.craviopk.com'
)
WHERE image LIKE 'https://cravio-r2-upload.zulfiqarammar8.workers.dev%';

UPDATE "Category"
SET image = REPLACE(
  image,
  'https://cravio-r2-upload.zulfiqarammar8.workers.dev',
  'https://cdn.craviopk.com'
)
WHERE image LIKE 'https://cravio-r2-upload.zulfiqarammar8.workers.dev%';

UPDATE "Category"
SET url = REPLACE(
  url,
  'https://cravio-r2-upload.zulfiqarammar8.workers.dev',
  'https://cdn.craviopk.com'
)
WHERE url LIKE 'https://cravio-r2-upload.zulfiqarammar8.workers.dev%';

UPDATE "MarketingBanner"
SET "imageUrl" = REPLACE(
  "imageUrl",
  'https://cravio-r2-upload.zulfiqarammar8.workers.dev',
  'https://cdn.craviopk.com'
)
WHERE "imageUrl" LIKE 'https://cravio-r2-upload.zulfiqarammar8.workers.dev%';

UPDATE "User"
SET image = REPLACE(
  image,
  'https://cravio-r2-upload.zulfiqarammar8.workers.dev',
  'https://cdn.craviopk.com'
)
WHERE image LIKE 'https://cravio-r2-upload.zulfiqarammar8.workers.dev%';

UPDATE "LocalPurchase"
SET "paymentProofPath" = REPLACE(
  "paymentProofPath",
  'https://cravio-r2-upload.zulfiqarammar8.workers.dev',
  'https://cdn.craviopk.com'
)
WHERE "paymentProofPath" LIKE 'https://cravio-r2-upload.zulfiqarammar8.workers.dev%';
