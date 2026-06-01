import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";

export interface Product {
  id: string;
  barcode: string;
  name: string;
  category: string;
  unit: string;
  costPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalDebt: number;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalDebt: number;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  barcode: string;
  unit: string;
  qty: number;
  costPrice: number;
  sellPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  customerId: string | null;
  customerName: string;
  subtotal: number;
  discount: number;
  total: number;
  amountPaid: number;
  change: number;
  paymentMethod: "cash" | "transfer" | "card";
  isDebt: boolean;
  debtAmount: number;
  note: string;
  createdAt: string;
}

export interface StockImportItem {
  productId: string;
  productName: string;
  qty: number;
  costPrice: number;
  subtotal: number;
}

export interface StockImport {
  id: string;
  importNumber: string;
  supplierId: string | null;
  supplierName: string;
  items: StockImportItem[];
  totalAmount: number;
  amountPaid: number;
  debtAmount: number;
  note: string;
  createdAt: string;
}

export interface DebtRecord {
  id: string;
  type: "customer" | "supplier";
  entityId: string;
  entityName: string;
  amount: number;
  note: string;
  orderId?: string;
  importId?: string;
  createdAt: string;
}

export interface CashEntry {
  id: string;
  type: "thu" | "chi";
  category: string;
  amount: number;
  note: string;
  referenceId?: string;
  createdAt: string;
}

export interface Settings {
  shopName: string;
  phone: string;
  address: string;
}

export interface ShopSnapshot {
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  orders: Order[];
  stockImports: StockImport[];
  debtRecords: DebtRecord[];
  cashEntries: CashEntry[];
  settings: Settings;
}

interface AppState extends ShopSnapshot {
  shops: Record<string, ShopSnapshot>;
  activeShopId: string | null;

  switchShop: (shopId: string) => void;
  initShop: (shopId: string, shopName: string, phone?: string, withDemoData?: boolean) => void;
  clearActiveShop: () => void;

  addProduct: (product: Omit<Product, "id" | "createdAt">) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  addCustomer: (customer: Omit<Customer, "id" | "createdAt" | "totalDebt">) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  addSupplier: (supplier: Omit<Supplier, "id" | "createdAt" | "totalDebt">) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  createOrder: (order: Omit<Order, "id" | "orderNumber" | "createdAt">) => string;
  createStockImport: (importData: Omit<StockImport, "id" | "importNumber" | "createdAt">) => string;

  payCustomerDebt: (customerId: string, amount: number, note: string) => void;
  paySupplierDebt: (supplierId: string, amount: number, note: string) => void;

  addCashEntry: (entry: Omit<CashEntry, "id" | "createdAt">) => void;
  updateSettings: (settings: Partial<Settings>) => void;

  exportData: () => string;
  importData: (jsonData: string) => boolean;
  clearAllData: () => void;
}

const generateId = () => uuidv4();
const now = () => new Date().toISOString();

const emptySettings = (shopName = "Cửa Hàng", phone = "", address = ""): Settings => ({
  shopName,
  phone,
  address,
});

const emptySnapshot = (shopName = "Cửa Hàng", phone = "", address = ""): ShopSnapshot => ({
  products: [],
  customers: [],
  suppliers: [],
  orders: [],
  stockImports: [],
  debtRecords: [],
  cashEntries: [],
  settings: emptySettings(shopName, phone, address),
});

const createDemoSnapshot = (shopName: string, phone = "", address = ""): ShopSnapshot => ({
  products: [
    { id: generateId(), barcode: "8931234567890", name: "Cà phê G7 3in1", category: "Đồ uống", unit: "Hộp", costPrice: 45000, sellPrice: 55000, stock: 50, minStock: 10, createdAt: now() },
    { id: generateId(), barcode: "8930987654321", name: "Mì Hảo Hảo Tôm Chua Cay", category: "Thực phẩm", unit: "Thùng", costPrice: 90000, sellPrice: 110000, stock: 20, minStock: 5, createdAt: now() },
    { id: generateId(), barcode: "8935555555555", name: "Nước giải khát Coca Cola", category: "Đồ uống", unit: "Lon", costPrice: 8000, sellPrice: 10000, stock: 120, minStock: 24, createdAt: now() },
    { id: generateId(), barcode: "8934444444444", name: "Bánh Cosy Marie", category: "Bánh kẹo", unit: "Hộp", costPrice: 35000, sellPrice: 45000, stock: 30, minStock: 10, createdAt: now() },
    { id: generateId(), barcode: "8933333333333", name: "Sữa tươi Vinamilk 180ml", category: "Sữa", unit: "Lốc", costPrice: 28000, sellPrice: 32000, stock: 40, minStock: 10, createdAt: now() },
  ],
  customers: [
    { id: generateId(), name: "Anh Tuấn", phone: "0901234567", address: "Q1, TP.HCM", totalDebt: 0, createdAt: now() },
    { id: generateId(), name: "Chị Mai", phone: "0919876543", address: "Q3, TP.HCM", totalDebt: 0, createdAt: now() },
  ],
  suppliers: [
    { id: generateId(), name: "Đại lý Nước ngọt Thành Phát", phone: "02833334444", address: "Bình Tân, TP.HCM", totalDebt: 0, createdAt: now() },
    { id: generateId(), name: "NPP Thực phẩm Hưng Thịnh", phone: "02855556666", address: "Q5, TP.HCM", totalDebt: 0, createdAt: now() },
  ],
  orders: [],
  stockImports: [],
  debtRecords: [],
  cashEntries: [],
  settings: emptySettings(shopName, phone, address),
});

const extractSnapshot = (state: Pick<AppState, keyof ShopSnapshot>): ShopSnapshot => ({
  products: state.products,
  customers: state.customers,
  suppliers: state.suppliers,
  orders: state.orders,
  stockImports: state.stockImports,
  debtRecords: state.debtRecords,
  cashEntries: state.cashEntries,
  settings: state.settings,
});

const applySnapshot = (snapshot: ShopSnapshot): Pick<AppState, keyof ShopSnapshot> => ({
  products: snapshot.products,
  customers: snapshot.customers,
  suppliers: snapshot.suppliers,
  orders: snapshot.orders,
  stockImports: snapshot.stockImports,
  debtRecords: snapshot.debtRecords,
  cashEntries: snapshot.cashEntries,
  settings: snapshot.settings,
});

const generateOrderNumber = (orders: Order[]) => {
  const count = orders.length + 1;
  return `HD${String(count).padStart(3, "0")}`;
};

const generateImportNumber = (imports: StockImport[]) => {
  const count = imports.length + 1;
  return `PN${String(count).padStart(3, "0")}`;
};

const persistActiveShop = (state: AppState, snapshot: ShopSnapshot): Partial<AppState> => {
  if (!state.activeShopId) return {};
  return {
    shops: { ...state.shops, [state.activeShopId]: snapshot },
  };
};

const commitSnapshot = (
  state: AppState,
  updater: (snapshot: ShopSnapshot) => ShopSnapshot
): Partial<AppState> => {
  const nextSnapshot = updater(extractSnapshot(state));
  return {
    ...applySnapshot(nextSnapshot),
    ...persistActiveShop(state, nextSnapshot),
  };
};

const defaultSnapshot = createDemoSnapshot("Cửa Hàng Tạp Hóa", "0909123456", "123 Đường Số 1, TP.HCM");

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      shops: {},
      activeShopId: null,
      ...defaultSnapshot,

      switchShop: (shopId) => {
        const state = get();
        let shops = { ...state.shops };

        if (state.activeShopId && state.activeShopId !== shopId) {
          shops[state.activeShopId] = extractSnapshot(state);
        }

        const snapshot = shops[shopId];
        if (!snapshot) return;

        set({
          shops,
          activeShopId: shopId,
          ...applySnapshot(snapshot),
        });
      },

      initShop: (shopId, shopName, phone = "", withDemoData = true) => {
        const state = get();
        let shops = { ...state.shops };

        if (state.activeShopId) {
          shops[state.activeShopId] = extractSnapshot(state);
        }

        if (shops[shopId]) {
          set({ shops, activeShopId: shopId, ...applySnapshot(shops[shopId]) });
          return;
        }

        const hasLegacyData =
          state.products.length > 0 ||
          state.customers.length > 0 ||
          state.orders.length > 0 ||
          state.stockImports.length > 0;

        const snapshot =
          hasLegacyData && Object.keys(shops).length === 0
            ? {
                ...extractSnapshot(state),
                settings: {
                  ...state.settings,
                  shopName,
                  phone: phone || state.settings.phone,
                },
              }
            : withDemoData
              ? createDemoSnapshot(shopName, phone)
              : emptySnapshot(shopName, phone);

        shops[shopId] = snapshot;

        set({
          shops,
          activeShopId: shopId,
          ...applySnapshot(snapshot),
        });
      },

      clearActiveShop: () => {
        const state = get();
        let shops = { ...state.shops };
        if (state.activeShopId) {
          shops[state.activeShopId] = extractSnapshot(state);
        }
        set({
          shops,
          activeShopId: null,
          ...emptySnapshot(),
        });
      },

      addProduct: (product) =>
        set((state) =>
          commitSnapshot(state, (snapshot) => ({
            ...snapshot,
            products: [...snapshot.products, { ...product, id: generateId(), createdAt: now() }],
          }))
        ),

      updateProduct: (id, product) =>
        set((state) =>
          commitSnapshot(state, (snapshot) => ({
            ...snapshot,
            products: snapshot.products.map((p) => (p.id === id ? { ...p, ...product } : p)),
          }))
        ),

      deleteProduct: (id) =>
        set((state) =>
          commitSnapshot(state, (snapshot) => ({
            ...snapshot,
            products: snapshot.products.filter((p) => p.id !== id),
          }))
        ),

      addCustomer: (customer) =>
        set((state) =>
          commitSnapshot(state, (snapshot) => ({
            ...snapshot,
            customers: [...snapshot.customers, { ...customer, id: generateId(), createdAt: now(), totalDebt: 0 }],
          }))
        ),

      updateCustomer: (id, customer) =>
        set((state) =>
          commitSnapshot(state, (snapshot) => ({
            ...snapshot,
            customers: snapshot.customers.map((c) => (c.id === id ? { ...c, ...customer } : c)),
          }))
        ),

      deleteCustomer: (id) =>
        set((state) =>
          commitSnapshot(state, (snapshot) => ({
            ...snapshot,
            customers: snapshot.customers.filter((c) => c.id !== id),
          }))
        ),

      addSupplier: (supplier) =>
        set((state) =>
          commitSnapshot(state, (snapshot) => ({
            ...snapshot,
            suppliers: [...snapshot.suppliers, { ...supplier, id: generateId(), createdAt: now(), totalDebt: 0 }],
          }))
        ),

      updateSupplier: (id, supplier) =>
        set((state) =>
          commitSnapshot(state, (snapshot) => ({
            ...snapshot,
            suppliers: snapshot.suppliers.map((s) => (s.id === id ? { ...s, ...supplier } : s)),
          }))
        ),

      deleteSupplier: (id) =>
        set((state) =>
          commitSnapshot(state, (snapshot) => ({
            ...snapshot,
            suppliers: snapshot.suppliers.filter((s) => s.id !== id),
          }))
        ),

      createOrder: (orderData) => {
        const state = get();
        const id = generateId();
        const orderNumber = generateOrderNumber(state.orders);
        const order: Order = { ...orderData, id, orderNumber, createdAt: now() };

        const newProducts = [...state.products];
        order.items.forEach((item) => {
          const product = newProducts.find((p) => p.id === item.productId);
          if (product) {
            product.stock -= item.qty;
          }
        });

        let newCustomers = [...state.customers];
        const newDebtRecords = [...state.debtRecords];

        if (order.isDebt && order.customerId) {
          const customer = newCustomers.find((c) => c.id === order.customerId);
          if (customer) {
            customer.totalDebt += order.debtAmount;
            newDebtRecords.push({
              id: generateId(),
              type: "customer",
              entityId: customer.id,
              entityName: customer.name,
              amount: order.debtAmount,
              note: `Ghi nợ từ hóa đơn ${orderNumber}`,
              orderId: id,
              createdAt: now(),
            });
          }
        }

        const newCashEntries = [...state.cashEntries];
        if (order.amountPaid > 0) {
          newCashEntries.push({
            id: generateId(),
            type: "thu",
            category: "Bán lẻ",
            amount: order.amountPaid,
            note: `Thu tiền hóa đơn ${orderNumber} - ${order.customerName || "Khách lẻ"}`,
            referenceId: id,
            createdAt: now(),
          });
        }

        const nextSnapshot: ShopSnapshot = {
          ...extractSnapshot(state),
          orders: [...state.orders, order],
          products: newProducts,
          customers: newCustomers,
          debtRecords: newDebtRecords,
          cashEntries: newCashEntries,
        };

        set({
          ...applySnapshot(nextSnapshot),
          ...persistActiveShop(state, nextSnapshot),
        });

        return id;
      },

      createStockImport: (importData) => {
        const state = get();
        const id = generateId();
        const importNumber = generateImportNumber(state.stockImports);
        const stockImport: StockImport = { ...importData, id, importNumber, createdAt: now() };

        const newProducts = [...state.products];
        stockImport.items.forEach((item) => {
          const product = newProducts.find((p) => p.id === item.productId);
          if (product) {
            product.stock += item.qty;
            product.costPrice = item.costPrice;
          }
        });

        let newSuppliers = [...state.suppliers];
        const newDebtRecords = [...state.debtRecords];

        if (stockImport.debtAmount > 0 && stockImport.supplierId) {
          const supplier = newSuppliers.find((s) => s.id === stockImport.supplierId);
          if (supplier) {
            supplier.totalDebt += stockImport.debtAmount;
            newDebtRecords.push({
              id: generateId(),
              type: "supplier",
              entityId: supplier.id,
              entityName: supplier.name,
              amount: -stockImport.debtAmount,
              note: `Ghi nợ từ phiếu nhập ${importNumber}`,
              importId: id,
              createdAt: now(),
            });
          }
        }

        const newCashEntries = [...state.cashEntries];
        if (stockImport.amountPaid > 0) {
          newCashEntries.push({
            id: generateId(),
            type: "chi",
            category: "Nhập hàng",
            amount: stockImport.amountPaid,
            note: `Chi tiền phiếu nhập ${importNumber} - ${stockImport.supplierName || "NCC lẻ"}`,
            referenceId: id,
            createdAt: now(),
          });
        }

        const nextSnapshot: ShopSnapshot = {
          ...extractSnapshot(state),
          stockImports: [...state.stockImports, stockImport],
          products: newProducts,
          suppliers: newSuppliers,
          debtRecords: newDebtRecords,
          cashEntries: newCashEntries,
        };

        set({
          ...applySnapshot(nextSnapshot),
          ...persistActiveShop(state, nextSnapshot),
        });

        return id;
      },

      payCustomerDebt: (customerId, amount, note) => {
        const state = get();
        const customer = state.customers.find((c) => c.id === customerId);
        if (!customer) return;

        const nextSnapshot: ShopSnapshot = {
          ...extractSnapshot(state),
          customers: state.customers.map((c) =>
            c.id === customerId ? { ...c, totalDebt: c.totalDebt - amount } : c
          ),
          debtRecords: [
            ...state.debtRecords,
            {
              id: generateId(),
              type: "customer",
              entityId: customer.id,
              entityName: customer.name,
              amount: -amount,
              note: note || "Khách trả nợ",
              createdAt: now(),
            },
          ],
          cashEntries: [
            ...state.cashEntries,
            {
              id: generateId(),
              type: "thu",
              category: "Thu nợ",
              amount,
              note: note || `Thu nợ khách hàng ${customer.name}`,
              createdAt: now(),
            },
          ],
        };

        set({
          ...applySnapshot(nextSnapshot),
          ...persistActiveShop(state, nextSnapshot),
        });
      },

      paySupplierDebt: (supplierId, amount, note) => {
        const state = get();
        const supplier = state.suppliers.find((s) => s.id === supplierId);
        if (!supplier) return;

        const nextSnapshot: ShopSnapshot = {
          ...extractSnapshot(state),
          suppliers: state.suppliers.map((s) =>
            s.id === supplierId ? { ...s, totalDebt: s.totalDebt - amount } : s
          ),
          debtRecords: [
            ...state.debtRecords,
            {
              id: generateId(),
              type: "supplier",
              entityId: supplier.id,
              entityName: supplier.name,
              amount,
              note: note || "Trả nợ nhà cung cấp",
              createdAt: now(),
            },
          ],
          cashEntries: [
            ...state.cashEntries,
            {
              id: generateId(),
              type: "chi",
              category: "Trả nợ NCC",
              amount,
              note: note || `Trả nợ NCC ${supplier.name}`,
              createdAt: now(),
            },
          ],
        };

        set({
          ...applySnapshot(nextSnapshot),
          ...persistActiveShop(state, nextSnapshot),
        });
      },

      addCashEntry: (entry) =>
        set((state) =>
          commitSnapshot(state, (snapshot) => ({
            ...snapshot,
            cashEntries: [...snapshot.cashEntries, { ...entry, id: generateId(), createdAt: now() }],
          }))
        ),

      updateSettings: (newSettings) =>
        set((state) =>
          commitSnapshot(state, (snapshot) => ({
            ...snapshot,
            settings: { ...snapshot.settings, ...newSettings },
          }))
        ),

      exportData: () => {
        const state = get();
        const snapshot = extractSnapshot(state);
        return JSON.stringify(snapshot);
      },

      importData: (jsonData) => {
        try {
          const data = JSON.parse(jsonData) as Partial<ShopSnapshot>;
          set((state) =>
            commitSnapshot(state, (snapshot) => ({
              ...snapshot,
              ...data,
              settings: { ...snapshot.settings, ...data.settings },
            }))
          );
          return true;
        } catch {
          return false;
        }
      },

      clearAllData: () =>
        set((state) => {
          const shopName = state.settings.shopName;
          const nextSnapshot = emptySnapshot(shopName, state.settings.phone, state.settings.address);
          return {
            ...applySnapshot(nextSnapshot),
            ...persistActiveShop(state, nextSnapshot),
          };
        }),
    }),
    {
      name: "pos-app-storage-v2",
      partialize: (state) => {
        const shops = { ...state.shops };
        if (state.activeShopId) {
          shops[state.activeShopId] = extractSnapshot(state);
        }
        return { shops, activeShopId: state.activeShopId };
      },
      merge: (persisted, current) => {
        const saved = persisted as Partial<AppState> & ShopSnapshot & { shops?: Record<string, ShopSnapshot> };

        if (saved.shops && Object.keys(saved.shops).length > 0) {
          const activeShopId = saved.activeShopId ?? null;
          const snapshot =
            (activeShopId && saved.shops[activeShopId]) ||
            Object.values(saved.shops)[0] ||
            defaultSnapshot;

          return {
            ...current,
            shops: saved.shops,
            activeShopId,
            ...applySnapshot(snapshot),
          };
        }

        const legacySnapshot: ShopSnapshot = {
          products: saved.products ?? defaultSnapshot.products,
          customers: saved.customers ?? defaultSnapshot.customers,
          suppliers: saved.suppliers ?? defaultSnapshot.suppliers,
          orders: saved.orders ?? [],
          stockImports: saved.stockImports ?? [],
          debtRecords: saved.debtRecords ?? [],
          cashEntries: saved.cashEntries ?? [],
          settings: saved.settings ?? defaultSnapshot.settings,
        };

        return {
          ...current,
          shops: {},
          activeShopId: null,
          ...applySnapshot(legacySnapshot),
        };
      },
      onRehydrateStorage: () => () => {
        try {
          const legacy = localStorage.getItem("pos-app-storage");
          const current = localStorage.getItem("pos-app-storage-v2");
          if (legacy && !current) {
            const parsed = JSON.parse(legacy);
            const state = parsed?.state ?? parsed;
            if (state?.products) {
              localStorage.setItem(
                "pos-app-storage-v2",
                JSON.stringify({
                  state: {
                    shops: {},
                    activeShopId: null,
                    ...state,
                  },
                  version: 0,
                })
              );
            }
          }
        } catch {
          /* ignore migration errors */
        }
      },
    }
  )
);
