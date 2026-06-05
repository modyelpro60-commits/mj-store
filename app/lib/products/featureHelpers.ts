export type ProductFeatureRow = {
  id: number;
  product_id: number;
  name: string;
  sort_order: number;
};

export function normalizeFeatureList(value: unknown): string[] {
  if (value == null) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter((item) => item.length > 0);
  }

  const raw = String(value).trim();
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => String(item).trim())
        .filter((item) => item.length > 0);
    }
  } catch {
    // ignore malformed JSON
  }

  const cleaned = raw
    .replace(/^\[|\]$/g, "")
    .replaceAll('"', "")
    .replaceAll("'", "");

  return cleaned
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function normalizeProductFeatures(product: Record<string, unknown>) {
  const featureRows = product.product_features;

  if (Array.isArray(featureRows) && featureRows.length > 0) {
    return (featureRows as ProductFeatureRow[])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((feature) => String(feature.name).trim())
      .filter((feature) => feature.length > 0);
  }

  return normalizeFeatureList(product?.features);
}

export function buildFeatureRows(productId: number | string, features: unknown) {
  return normalizeFeatureList(features).map((name, index) => ({
    product_id: Number(productId),
    name,
    sort_order: index,
  }));
}
