import { Checkout } from "@/components/Checkout";
import { getSettings } from "@/lib/menu";

export const metadata = { title: "إتمام الطلب" };

export default async function CheckoutPage() {
  const s = await getSettings();
  return (
    <div className="wrap py-12">
      <p className="eyebrow">خطوة أخيرة</p>
      <h1 className="mb-8 mt-3 font-display text-4xl font-bold">إتمام الطلب</h1>
      <Checkout settings={{ isOpen: s.isOpen, deliveryFee: s.deliveryFee, minOrder: s.minOrder, walletInfo: s.walletInfo, phones: s.phones }} />
    </div>
  );
}
