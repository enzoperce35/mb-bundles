export const buildOrderMessage = ({
  bundle,
  sortedItems,
  pantryMap,
  pax,
  price,
  cloudUrl,
  formatItemName
}) => {
  const now = new Date();

  const formattedDate = now.toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).replace(',', '').toLowerCase();

  const itemCount = sortedItems.length;

  const itemsText = sortedItems
    .map(i => {
      const pantryItem = pantryMap[i.product_variant_id];
      const quantity = i.quantity || 1;
      return `  ↳ ${formatItemName(pantryItem, quantity)}`;
    })
    .join("\n\n");

  return `*MA'DONNA DELICACIES*
${formattedDate}

● ${bundle.name}
${itemsText}

Pax: ${pax}
Items: ${itemCount}
Total: ₱${price.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}

📎 Image: ${cloudUrl}`;
};
