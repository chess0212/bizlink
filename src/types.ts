export interface UserProfile {
  uid: string;
  email: string | null;
  phoneNumber?: string | null;
  role: 'seller' | 'admin';
  onboarded?: boolean;
  shopId?: string;
  createdAt: any;
}

export interface Shop {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  slogan?: string;
  logo?: string;
  bannerImage?: string;
  sliderImages?: string[];
  whatsappNumber: string;
  instagram?: string;
  tiktok?: string;
  facebook?: string;
  city: string;
  orangeMoney?: string;
  mtnMoney?: string;
  moovMoney?: string;
  deliveryZones?: string[];
  currency: 'XOF';
  accentColor?: string;
  createdAt: any;
}

export interface Product {
  id?: string;
  shopId: string;
  name: string;
  description: string;
  image?: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
  variants?: Record<string, string[]>;
  isActive: boolean;
  createdAt: any;
}

export type OrderStatus = 'pending' | 'confirmed' | 'delivering' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'pending' | 'paid';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  variant?: string;
}

export interface Order {
  id: string;
  shopId: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  deliveryAddress: string;
  createdAt: string;
}

export interface BusinessStats {
  totalRevenue: number;
  totalOrders: number;
  activeProducts: number;
}
