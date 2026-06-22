import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Component, ReactNode, lazy, Suspense } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { AdminAuthProvider, RequireAdmin } from "@/context/AdminAuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { SiteSettingsProvider } from "@/context/SiteSettingsContext";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; errorMsg: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }
  static getDerivedStateFromError(error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return { hasError: true, errorMsg: msg };
  }
  componentDidCatch(error: unknown, info: unknown) {
    console.error('[JB ErrorBoundary]', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 bg-white">
          <h1 className="text-2xl font-black text-black">Something went wrong</h1>
          <p className="text-gray-500 text-sm text-center max-w-sm">We hit an unexpected error. Please refresh the page or go back to continue shopping.</p>
          {this.state.errorMsg && (
            <pre className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 max-w-md overflow-auto whitespace-pre-wrap text-left">
              {this.state.errorMsg}
            </pre>
          )}
          <button onClick={() => { this.setState({ hasError: false, errorMsg: '' }); window.location.href = '/'; }} className="px-6 py-3 bg-yellow-400 text-black font-bold rounded-full hover:bg-yellow-500 transition-all">
            Go to Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

import Home from "./pages/Home";
import Products from "./pages/Products";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/not-found";

const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));

const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminProductReviews = lazy(() => import("./pages/admin/AdminProductReviews"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminEmail = lazy(() => import("./pages/admin/AdminEmail"));
const AdminCreateInvoice = lazy(() => import("./pages/admin/AdminCreateInvoice"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));

const ProfilePage = lazy(() => import("./pages/profile/ProfilePage"));
const ProfileOrders = lazy(() => import("./pages/profile/ProfileOrders"));
const ProfileOrderDetail = lazy(() => import("./pages/profile/ProfileOrderDetail"));
const ProfileAddresses = lazy(() => import("./pages/profile/ProfileAddresses"));
const ProfileWishlist = lazy(() => import("./pages/profile/ProfileWishlist"));
const ProfileReviews = lazy(() => import("./pages/profile/ProfileReviews"));
const ProfileCoupons = lazy(() => import("./pages/profile/ProfileCoupons"));
const ProfileRecently = lazy(() => import("./pages/profile/ProfileRecently"));
const ProfileNotifications = lazy(() => import("./pages/profile/ProfileNotifications"));
const ProfilePassword = lazy(() => import("./pages/profile/ProfilePassword"));
const ProfileHelp = lazy(() => import("./pages/profile/ProfileHelp"));
const ProfileReturns = lazy(() => import("./pages/profile/ProfileReturns"));
const ProfilePayments = lazy(() => import("./pages/profile/ProfilePayments"));

const queryClient = new QueryClient();

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/products" component={Products} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/order-success" component={OrderSuccess} />
        <Route path="/my-orders" component={MyOrders} />
        <Route path="/category/:slug" component={CategoryPage} />

        <Route path="/profile" component={ProfilePage} />
        <Route path="/profile/orders" component={ProfileOrders} />
        <Route path="/profile/orders/:id" component={ProfileOrderDetail} />
        <Route path="/profile/addresses" component={ProfileAddresses} />
        <Route path="/profile/wishlist" component={ProfileWishlist} />
        <Route path="/profile/reviews" component={ProfileReviews} />
        <Route path="/profile/coupons" component={ProfileCoupons} />
        <Route path="/profile/recently" component={ProfileRecently} />
        <Route path="/profile/notifications" component={ProfileNotifications} />
        <Route path="/profile/returns" component={ProfileReturns} />
        <Route path="/profile/payments" component={ProfilePayments} />
        <Route path="/profile/password" component={ProfilePassword} />
        <Route path="/profile/help" component={ProfileHelp} />

        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin/orders">{() => <RequireAdmin><AdminOrders /></RequireAdmin>}</Route>
        <Route path="/admin/products">{() => <RequireAdmin><AdminProducts /></RequireAdmin>}</Route>
        <Route path="/admin/customers">{() => <RequireAdmin><AdminCustomers /></RequireAdmin>}</Route>
        <Route path="/admin/coupons">{() => <RequireAdmin><AdminCoupons /></RequireAdmin>}</Route>
        <Route path="/admin/settings">{() => <RequireAdmin><AdminSettings /></RequireAdmin>}</Route>
        <Route path="/admin/reviews">{() => <RequireAdmin><AdminProductReviews /></RequireAdmin>}</Route>
        <Route path="/admin/categories">{() => <RequireAdmin><AdminCategories /></RequireAdmin>}</Route>
        <Route path="/admin/email">{() => <RequireAdmin><AdminEmail /></RequireAdmin>}</Route>
        <Route path="/admin/invoices/new">{() => <RequireAdmin><AdminCreateInvoice /></RequireAdmin>}</Route>
        <Route path="/admin/analytics">{() => <RequireAdmin><AdminAnalytics /></RequireAdmin>}</Route>
        <Route path="/admin">{() => <RequireAdmin><AdminDashboard /></RequireAdmin>}</Route>

        <Route component={NotFound} />
      </Switch>
    </Suspense>
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
