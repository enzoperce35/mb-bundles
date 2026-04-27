// 🎯 Get discount rate based on pax
export const getDiscountRate = (pax) => {
  const parsed = parseInt(pax, 10);

  switch (parsed) {
    case 10:
      return 0.0192;
    case 15:
      return 0.0288;
    case 20:
      return 0.0384;
    default:
      return 0;
  }
};

// 🎯 Round to nearest 10 (₱10 precision)
export const roundToNearestTen = (amount) => {
  return Math.round(amount / 10) * 10;
};

// 🎯 Main helper: compute final designed price
export const getDesignedBundlePrice = (rawTotal, pax) => {
  if (!rawTotal || isNaN(rawTotal)) return 0;

  const discountRate = 0.0300;
  const discounted = rawTotal * (1 - discountRate);

  return roundToNearestTen(discounted);
};
