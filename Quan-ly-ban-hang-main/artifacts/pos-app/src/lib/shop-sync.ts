import { useEffect } from "react";
import { useAuthStore } from "./auth-store";
import { useStore } from "./store";
import { getShopId } from "./shop-utils";

export function useShopSync() {
  const session = useAuthStore((s) => s.session);
  const switchShop = useStore((s) => s.switchShop);
  const initShop = useStore((s) => s.initShop);
  const clearActiveShop = useStore((s) => s.clearActiveShop);

  useEffect(() => {
    if (!session) {
      clearActiveShop();
      return;
    }

    const shopId = getShopId(session);
    if (!shopId) return;

    const shops = useStore.getState().shops;
    if (!shops[shopId]) {
      initShop(shopId, session.shopName, session.phone);
    } else {
      switchShop(shopId);
    }
  }, [session?.userId, session?.shopId, session?.ownerId, session?.shopName, session?.phone, switchShop, initShop, clearActiveShop]);
}
