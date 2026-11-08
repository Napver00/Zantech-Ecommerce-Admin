// Rows of the variants form, shared by the product page and the new-product page.

let tempKey = 0;

export const blankRow = (base = {}) => ({
  key: `new-${++tempKey}`,
  id: null,
  name: "",
  sku: "",
  price: base.price ?? "",
  discount: base.discount ?? "",
  quantity: 0,
  display_quantity: "",
  image_id: null,
  status: true,
  ...base,
});

export const fromServer = (v) => ({
  key: `v-${v.id}`,
  id: v.id,
  name: v.name,
  sku: v.sku || "",
  price: v.price,
  discount: v.discount || "",
  quantity: v.quantity,
  display_quantity: v.display_quantity ?? "",
  image_id: v.image_id,
  status: v.status,
});

/** A row without its list key, for comparing with what is saved. */
export const withoutKey = ({ key: _key, ...rest }) => rest;

/** Problems per row key: name, duplicate name, price, discount. */
export const checkVariantRows = (rows) => {
  const found = {};
  const seen = new Set();
  rows.forEach((r) => {
    const name = r.name.trim();
    if (!name) found[r.key] = "Give it a name, e.g. 2 pin.";
    else if (seen.has(name.toLowerCase())) found[r.key] = "Two variants have this name.";
    else if (r.price === "" || Number(r.price) < 0) found[r.key] = "Enter a price.";
    else if (Number(r.discount) > Number(r.price)) found[r.key] = "The discount is more than the price.";
    seen.add(name.toLowerCase());
  });
  return found;
};

/**
 * What PUT /products/{id}/variants expects. imageIdOf turns a row's image_id
 * into a saved photo id (the new-product page picks photos before they are uploaded).
 */
export const variantRowsPayload = (rows, imageIdOf = (id) => id) =>
  rows.map((r) => ({
    id: r.id || undefined,
    name: r.name.trim(),
    sku: r.sku.trim() || null,
    price: Math.round(Number(r.price) || 0),
    discount: r.discount === "" ? null : Math.round(Number(r.discount) || 0),
    quantity: Math.round(Number(r.quantity) || 0),
    display_quantity: r.display_quantity === "" ? null : Math.round(Number(r.display_quantity) || 0),
    image_id: r.image_id ? imageIdOf(r.image_id) || null : null,
    status: !!r.status,
  }));

/** The store's "from" price and the total stock, worked out from the rows. */
export const variantSummary = (rows) => {
  const onSale = rows.filter((r) => r.status);
  const pool = onSale.length ? onSale : rows;
  const cheapest = pool.reduce(
    (best, r) => {
      const pays = Math.max(0, (Number(r.price) || 0) - (Number(r.discount) || 0));
      return best === null || pays < best.pays ? { pays, price: Number(r.price) || 0, discount: Number(r.discount) || 0 } : best;
    },
    null
  );
  return { cheapest, total: rows.reduce((n, r) => n + (Number(r.quantity) || 0), 0) };
};
