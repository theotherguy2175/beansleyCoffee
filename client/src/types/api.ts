export type Role = "admin" | "staff" | "customer";

export interface PublicUser {
  id: number;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

export interface CoffeeType {
  id: number;
  name: string;
}

export interface Syrup {
  id: number;
  name: string;
}

export interface SizeOption {
  id: number;
  ounces: number;
}

export interface CoffeeStrengthOption {
  id: number;
  coffeeId: number;
  label: string;
  sortOrder: number;
}

export interface Coffee {
  id: number;
  name: string;
  description: string | null;
  imagePath: string | null;
  isAvailable: boolean;
  sortOrder: number;
  coffeeTypeId: number | null;
  coffeeTypeName: string | null;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
  strengthOptions?: CoffeeStrengthOption[];
}

export type OrderStatus = "pending" | "in_progress" | "ready" | "completed" | "cancelled";

export interface Order {
  id: number;
  userId: number;
  coffeeId: number;
  coffeeNameSnapshot: string;
  syrupNames: string[];
  sizeOz: number | null;
  strengthLabel: string | null;
  notes: string | null;
  pickupTime: string;
  status: OrderStatus;
  notificationSent: boolean;
  createdAt: string;
  // Only present on the staff/admin "all orders" endpoint.
  customerName?: string;
  customerEmail?: string;
}

export interface SystemSettings {
  maker_notification_email?: string;
  smtp_user?: string;
  smtpPassSet: boolean;
  [key: string]: string | boolean | undefined;
}

export interface ThemeColors {
  theme_background?: string;
  theme_foreground?: string;
  theme_primary?: string;
  theme_secondary?: string;
  theme_accent?: string;
  theme_card?: string;
  theme_border?: string;
}
