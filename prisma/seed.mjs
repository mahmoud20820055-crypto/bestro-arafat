// Seeds the Bistro Arafat menu (from the printed menu), default settings and the first admin.
// Safe to re-run: it only fills an empty menu and never overwrites an existing admin.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const v = (...pairs) => pairs.map(([name, price], sort) => ({ name, price, sort }));

const MENU = [
  { name: "وجبات البرجر", note: "تشكن أو بيف", items: [
    { name: "برجر مكسيكي", variants: v(["تشكن", 40], ["بيف", 40]), featured: true },
    { name: "الفريدو برجر", variants: v(["تشكن", 35], ["بيف", 40]) },
    { name: "برجر تشيز", variants: v(["تشكن", 30], ["بيف", 35]) },
    { name: "برجر كلاسيك", variants: v(["تشكن", 25], ["بيف", 30]) },
    { name: "برجر تشكن كريزي", price: 40, featured: true },
    { name: "ناشفل برجر", price: 35 },
    { name: "ماك برجر", price: 35 },
    { name: "برجر تشكن كرسبي", price: 35 },
  ]},
  { name: "الشاورما", items: [
    { name: "باجيت شاورما", price: 14 },
    { name: "فرشوحة بيسترو", price: 35, featured: true },
    { name: "فرشوحة شاورما عادي", price: 20 },
    { name: "فرشوحة شاورما دبل", price: 22 },
    { name: "فرشوحة شاورما دبل دبل", price: 25 },
    { name: "فرشوحة دبل شاورما", price: 30 },
    { name: "شاورما سوري", price: 35 },
    { name: "صفيحة شاورما بالجبنة والزيتون", price: 40 },
    { name: "أساور شاورما", price: 40 },
    { name: "شاورما بوكس", price: 50, featured: true },
    { name: "وجبة اللغوصة", price: 45 },
  ]},
  { name: "سندويشات الدجاج", note: "سندويش أو وجبة", items: [
    { name: "تشكن مكسيكي", variants: v(["سندويش", 35], ["وجبة", 55]) },
    { name: "تشكن بيباروتشي", variants: v(["سندويش", 35], ["وجبة", 55]) },
    { name: "زنجر راب", variants: v(["سندويش", 40], ["وجبة", 55]) },
    { name: "صفيحة فخذ مسحب", variants: v(["سندويش", 40], ["وجبة", 55]) },
    { name: "تشكن هوت", variants: v(["سندويش", 35], ["وجبة", 55]) },
    { name: "كورن كرسبي", price: 35 },
    { name: "تشكن تاكس", price: 35 },
    { name: "ماك آند تشيز", price: 40 },
    { name: "مكس الشيف", price: 45 },
    { name: "مكس الصيف", price: 55 },
    { name: "تشكن تولينا", price: 40 },
    { name: "كالزوني", price: 35 },
    { name: "بيتزا وسط", variants: v(["خضار", 25], ["دجاج", 30], ["شاورما", 35]) },
  ]},
  { name: "وجبات الشرقي", note: "السعر حسب اليوم", items: [
    { name: "دجاج شواية", price: null },
    { name: "دجاج مسخن", price: null },
    { name: "نص دجاجة مع رز", price: null },
    { name: "وجبة شخص", description: "ربع دجاجة مع رز", price: null },
    { name: "صحن رز", variants: v(["صغير", 15], ["وسط", 20], ["كبير", 25]) },
  ]},
  { name: "السلطات", items: [
    { name: "سلطة سيزر", price: 15 }, { name: "ذرة بالمايونيز", price: 8 }, { name: "ملفوف أحمر", price: 8 },
    { name: "تركية", price: 8 }, { name: "سلطة مشكل", price: 10 },
  ]},
  { name: "مقبلات", items: [
    { name: "أصابع دجاج", price: 12 }, { name: "أصابع جبنة", price: 12 }, { name: "حلقات بصل", price: 10 },
  ]},
  { name: "الصوصات", items: [
    { name: "صوص جبنة", price: 5 }, { name: "صوص ثومية", price: 5 }, { name: "صوص بيكانتي", price: 5 }, { name: "صوص رانش", price: 5 },
  ]},
];

async function main() {
  await db.setting.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });

  if ((await db.category.count()) === 0) {
    for (const [ci, c] of MENU.entries()) {
      await db.category.create({
        data: {
          name: c.name, note: c.note ?? null, sort: ci,
          items: { create: c.items.map((it, ii) => ({
            name: it.name, description: it.description ?? null, price: it.price ?? null,
            featured: !!it.featured, sort: ii,
            variants: it.variants ? { create: it.variants } : undefined,
          })) },
        },
      });
    }
    console.log("Menu seeded");
  }

  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD;
  if (password && !(await db.admin.findUnique({ where: { username } }))) {
    await db.admin.create({ data: { username, name: "المدير", passwordHash: await bcrypt.hash(password, 10) } });
    console.log(`Admin "${username}" created`);
  }
}

main().finally(() => db.$disconnect());
