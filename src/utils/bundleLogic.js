/**
 * Smart Utils for Bundle Customization
 */

export const getEditableVariants = (pantry, bundleMaxPax) => {
  const editableSides = [];
  // Rule: bundleMaxPax of 5 is considered the "Minimum Bundle"
  const isMinBundle = bundleMaxPax <= 5;

  pantry.forEach(product => {
    // 1. FILTER: Apply boundary rules to create the allowed pool
    const allowedPool = product.variants.filter(v => {
      // Always exclude main dishes from the "Sides/Inclusions" pool
      if (v.main) return false;

      if (isMinBundle) {
        // Minimum Bundle (5 pax): Block "Party Sizes" (Bilaos)
        // This keeps it restricted to Solo items or Universal items
        return v.isPartySize !== true;
      } else {
        // Larger Bundles (> 5 pax): Block "Solo Only" items
        // This makes it versatile for all party sizes
        return v.isSoloOnly !== true;
      }
    });

    // If no variants for this product are allowed for this bundle size, skip it
    if (allowedPool.length === 0) return;

    // 2. BEST FIT: Reduce the pool down to exactly ONE winner per product
    // We pick the variant whose pax count is closest to the bundleMaxPax
    const bestFit = allowedPool.reduce((prev, curr) => {
      const prevDiff = Math.abs(prev.pax - bundleMaxPax);
      const currDiff = Math.abs(curr.pax - bundleMaxPax);
      return currDiff < prevDiff ? curr : prev;
    });

    editableSides.push({
      ...bestFit,
      product_name: product.product_name,
      public_id: product.public_id,
      rails_parent_id: product.rails_parent_id
    });
  });

  return editableSides;
};

export const calculateSmartQuantity = (variantPax, bundleMaxPax) => {
  if (!variantPax || variantPax <= 0) return 1;
  // Pick the highest multiple that stays under or equal to the limit
  const qty = Math.floor(bundleMaxPax / variantPax);
  return qty > 0 ? qty : 1; 
};

export const formatItemName = (variant, quantity) => {
  const name = variant.name || variant.mb_name;
  if (variant.count) {
    return `${quantity * variant.count}pcs ${name}`;
  }
  return `${quantity} ${name}`;
};
