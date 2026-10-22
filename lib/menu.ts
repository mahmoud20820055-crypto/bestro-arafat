import { db } from "./db";

/** Public menu: active categories with their items, in display order. */
export async function getMenu() {
  const cats = await db.category.findMany({
    where: { active: true },
    orderBy: [{ sort: "asc" }, { id: "asc" }],
    include: { items: { orderBy: [{ sort: "asc" }, { id: "asc" }], include: { variants: { orderBy: { sort: "asc" } } } } },
  });
  return cats.map((c) => ({
    id: c.id,
    name: c.name,
    note: c.note,
    items: c.items.map((i) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      price: i.price,
      imageId: i.imageId,
      available: i.available,
      featured: i.featured,
      variants: i.variants.map((v) => ({ id: v.id, name: v.name, price: v.price })),
    })),
  }));
}
export type MenuCategory = Awaited<ReturnType<typeof getMenu>>[number];
export type MenuItem = MenuCategory["items"][number];

export async function getSettings() {
  return db.setting.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
}
