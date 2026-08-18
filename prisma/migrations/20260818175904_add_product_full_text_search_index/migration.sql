CREATE INDEX product_search_idx
ON "Product"
USING GIN (
  to_tsvector(
    'portuguese',
    coalesce("name", '') || ' ' || coalesce("description", '')
  )
);
