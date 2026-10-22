import { MyOrders } from "@/components/MyOrders";

export const metadata = { title: "طلباتي" };

export default function OrdersPage() {
  return (
    <div className="wrap py-12">
      <p className="eyebrow">بدون تسجيل دخول</p>
      <h1 className="mb-8 mt-3 font-display text-4xl font-bold">طلباتي</h1>
      <MyOrders />
    </div>
  );
}
