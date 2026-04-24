/**
 * Smart Utils for Bundle Customization
 */

export const getEditableVariants = (pantry, bundleMaxPax) => {
  const editableSides = [];

  pantry.forEach(product => {
    // 1. Skip if the product only contains "main" dishes
    const sideVariants = product.variants.filter(v => !v.main);
    if (sideVariants.length === 0) return;

    // 2. Find the "Best Fit" variant
    // We look for the one where variant.pax is closest to bundleMaxPax
    // but typically we prefer the one that doesn't exceed it unless it's the only option
    const bestFit = sideVariants.reduce((prev, curr) => {
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
