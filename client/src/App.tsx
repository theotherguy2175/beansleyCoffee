import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/shared/Navbar";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

import { LoginPage } from "@/routes/public/LoginPage";
import { RegisterPage } from "@/routes/public/RegisterPage";

import { MenuPage } from "@/routes/customer/MenuPage";
import { OrderPage } from "@/routes/customer/OrderPage";
import { OrderReceiptPage } from "@/routes/customer/OrderReceiptPage";
import { OrderHistoryPage } from "@/routes/customer/OrderHistoryPage";
import { AccountPage } from "@/routes/customer/AccountPage";

import { StaffLayout } from "@/routes/staff/StaffLayout";
import { StaffMenuListPage } from "@/routes/staff/StaffMenuListPage";
import { StaffCoffeeFormPage } from "@/routes/staff/StaffCoffeeFormPage";
import { StaffMenuOptionsPage } from "@/routes/staff/StaffMenuOptionsPage";
import { StaffOrdersPage } from "@/routes/staff/StaffOrdersPage";

import { AdminLayout } from "@/routes/admin/AdminLayout";
import { AdminMenuPage } from "@/routes/admin/AdminMenuPage";
import { AdminCoffeeFormPage } from "@/routes/admin/AdminCoffeeFormPage";
import { AdminMenuOptionsPage } from "@/routes/admin/AdminMenuOptionsPage";
import { AdminOrdersPage } from "@/routes/admin/AdminOrdersPage";
import { AdminUsersPage } from "@/routes/admin/AdminUsersPage";
import { AdminUserFormPage } from "@/routes/admin/AdminUserFormPage";
import { AdminSettingsPage } from "@/routes/admin/AdminSettingsPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function AppLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Navigate to="/menu" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/menu" element={<MenuPage />} />

          <Route
            path="/order/:coffeeId"
            element={
              <ProtectedRoute allow={["admin", "staff", "customer"]}>
                <OrderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute allow={["admin", "staff", "customer"]}>
                <OrderHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:orderId"
            element={
              <ProtectedRoute allow={["admin", "staff", "customer"]}>
                <OrderReceiptPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute allow={["admin", "staff", "customer"]}>
                <AccountPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/staff"
            element={
              <ProtectedRoute allow={["staff", "admin"]}>
                <StaffLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="menu" replace />} />
            <Route path="menu" element={<StaffMenuListPage />} />
            <Route path="menu/new" element={<StaffCoffeeFormPage />} />
            <Route path="menu/:coffeeId/edit" element={<StaffCoffeeFormPage />} />
            <Route path="menu/options" element={<StaffMenuOptionsPage />} />
            <Route path="orders" element={<StaffOrdersPage />} />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute allow={["admin"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="menu" replace />} />
            <Route path="menu" element={<AdminMenuPage />} />
            <Route path="menu/new" element={<AdminCoffeeFormPage />} />
            <Route path="menu/:coffeeId/edit" element={<AdminCoffeeFormPage />} />
            <Route path="menu/options" element={<AdminMenuOptionsPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="users/new" element={<AdminUserFormPage />} />
            <Route path="users/:userId/edit" element={<AdminUserFormPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/menu" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
