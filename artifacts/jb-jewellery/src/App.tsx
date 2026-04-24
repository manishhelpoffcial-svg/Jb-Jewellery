import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Component, ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { AdminAuthProvider, RequireAdmin } from "@/context/AdminAuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { SiteSettingsProvider } from "@/context/SiteSettingsContext";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: unknown) { console.error('[JB ErrorBoundary]', error); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 bg-white">
          <h1 className="text-2xl font-black text-black">Something went wrong</h1>
          <p className="text-gray-500 text-sm text-center max-w-sm">We hit an unexpected error. Please refresh the page or go back to continue shopping.</p>
          <button onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }} className="px-6 py-3 bg-yellow-400 text-black font-bold rounded-full hover:bg-yellow-500 transition-all">
            Go to Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

import Home from "./pages/Home";
import Products from "./pages/Products";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import MyOrders from "./pages/MyOrders";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminSettings from "./pages/admin/AdminSettings";
import NotFound from "./pages/not-found";

import ProfilePage from "./pages/profile/ProfilePage";
import ProfileOrders from "./pages/profile/ProfileOrders";
import ProfileOrderDetail from "./pages/profile/ProfileOrderDetail";
import ProfileAddresses from "./pages/profile/ProfileAddresses";
import ProfileWishlist from "./pages/profile/ProfileWishlist";
import ProfileReviews from "./pages/profile/ProfileReviews";
import ProfileCoupons from "./pages/profile/ProfileCoupons";
import ProfileRecently from "./pages/profile/ProfileRecently";
import ProfileNotifications from "./pages/profile/ProfileNotifications";
import ProfilePassword from "./pages/profile/ProfilePassword";
import ProfileHelp from "./pages/profile/ProfileHelp";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/products" component={Products} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/order-success" component={OrderSuccess} />
      <Route path="/my-orders" component={MyOrders} />

      {/* Profile Section */}
      <Route path="/profile" component={ProfilePage} />
      <Route path="/profile/orders" component={ProfileOrders} />
      <Route path="/profile/orders/:id" component={ProfileOrderDetail} />
      <Route path="/profile/addresses" component={ProfileAddresses} />
      <Route path="/profile/wishlist" component={ProfileWishlist} />
      <Route path="/profile/reviews" component={ProfileReviews} />
      <Route path="/profile/coupons" component={ProfileCoupons} />
      <Route path="/profile/recently" component={ProfileRecently} />
      <Route path="/profile/notifications" component={ProfileNotifications} />
      <Route path="/profile/password" component={ProfilePassword} />
      <Route path="/profile/help" component={ProfileHelp} />

      {/* Admin Section */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/orders">{() => <RequireAdmin><AdminOrders /></RequireAdmin>}</Route>
      <Route path="/admin/products">{() => <RequireAdmin><AdminProducts /></RequireAdmin>}</Route>
      <Route path="/admin/customers">{() => <RequireAdmin><AdminCustomers /></RequireAdmin>}</Route>
      <Route path="/admin/coupons">{() => <RequireAdmin><AdminCoupons /></RequireAdmin>}</Route>
      <Route path="/admin/settings">{() => <RequireAdmin><AdminSettings /></RequireAdmin>}</Route>
      <Route path="/admin">{() => <RequireAdmin><AdminDashboard /></RequireAdmin>}</Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SiteSettingsProvider>
          <AuthProvider>
            <AdminAuthProvider>
              <CartProvider>
                <WishlistProvider>
                  <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                    <Router />
                    <AuthModal />
                    <CartDrawer />
                  </WouterRouter>
                </WishlistProvider>
              </CartProvider>
            </AdminAuthProvider>
          </AuthProvider>
        </SiteSettingsProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
