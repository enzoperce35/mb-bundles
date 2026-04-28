/**
 * Smart Utils for Bundle Customization
 */

export const getEditableVariants = (pantry, bundleMaxPax) => {
  const editableSides = [];
  const isMinBundle = bundleMaxPax <= 5;

  pantry.forEach(product => {
    // 1. FILTER: Apply the solo vs party rules
    const allowedPool = product.variants.filter(v => {
      if (v.main) return false;

      if (isMinBundle) {
        // If it's a 5-pax bundle, exclude big Party Sizes
        return v.isPartySize !== true;
      } else {
        // If it's 10-pax or more, exclude tiny Solo items
        return v.isSoloOnly !== true;
      }
    });

    if (allowedPool.length === 0) return;

    // 2. BEST FIT: Match the closest size from the allowed list
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
