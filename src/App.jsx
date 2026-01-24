import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Toaster } from "react-hot-toast";
import "./i18n";
import LoadingScreen from "@/components/layout/LoadingScreen";

/** 🔔 Notifications provider wiring */
import { NotificationsProvider } from "@/providers/NotificationsProvider";
import { useRole } from "@/hooks/useRole";
import { supabase } from "@/lib/supabaseClient";

// Core pages
import LandingPage from "@/pages/LandingPage";
import ElmadPlatform from "@/components/common/ElmadPlatform";
import About from "@/components/common/About";
import HowItWorks from "@/pages/HowItWorks";
import Join from "@/pages/Join";
import Contact from "@/components/common/Contact";
import BusinessDetails from "@/pages/BusinessDetails";

import AdminCookieLogs from "@/pages/admin/AdminCookieLogs";
import AdminBilling from "@/pages/admin/AdminBilling";

// Auth pages
import AuthPage from "@/pages/AuthPage";
import UserLogin from "@/pages/user-login";
import UserSignup from "@/pages/user-signup";
import OwnerLogin from "@/pages/owner-login";
import OwnerSignup from "@/pages/owner-signup";
import LoginAdmin from "@/pages/LoginAdmin";
import OperatorLogin from "@/pages/operator-login";
import EmailVerifyCallback from "./pages/EmailVerifyCallback";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AuthCallback from "./pages/AuthCallback";
import SettingsPage from "@/pages/Settings";
import OwnerBilling from "@/pages/owner/OwnerBilling";
import OwnerMessages from "@/pages/owner/OwnerMessages";
// Dashboards
import UserDashboard from "@/pages/UserDashboard";
import OwnerDashboard from "@/pages/owner-dashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import DashboardRouter from "@/pages/DashboardRouter";

// Business / AI
import AIDashboard from "@/components/common/AIDashboard";
import BusinessCard from "@/components/business/public/BusinessCard";
import OwnerBusinessAdd from "@/components/owner/OwnerBusinessAdd";
import OwnerBusinessEdit from "@/components/owner/OwnerBusinessEdit";
import OwnerAiDashboard from "@/pages/owner-ai-dashboard";
import OwnerToolsCenter from "@/pages/OwnerToolsCenter.jsx";

// Video tools
import VideoEditor from "@/components/video/VideoEditor";
import VideoDashboard from "@/components/video/VideoDashboard";

// User features
import Favorites from "@/components/user/Favorites";

// Notifications (role-based)
import NotificationsRouter from "@/pages/notifications/NotificationsRouter";
import UserNotifications from "@/pages/notifications/UserNotifications";
import OwnerNotifications from "@/pages/notifications/OwnerNotifications";
import AdminNotifications from "@/pages/notifications/AdminNotifications";
import OperatorNotifications from "@/pages/notifications/OperatorNotifications";

// Route guards
import ProtectedRoute from "@/components/routing/ProtectedRoute";
import OwnerProtectedRoute from "@/components/routing/OwnerProtectedRoute";
import UserProtectedRoute from "@/components/routing/UserProtectedRoute";

// layouts
import UserLayout from "@/layouts/UserLayout";
import OwnerLayout from "@/layouts/OwnerLayout";
import AdminLayout from "@/layouts/AdminLayout";

import Terms from "./pages/legal/Terms";
import Privacy from "./pages/legal/Privacy";
import Cookies from "./pages/legal/Cookies";
import CookieBanner from "@/components/CookieBanner";
import PricingPage from "@/pages/PricingPage";

// Operator
import OperatorDashboard from "@/pages/dashboard/operator-dashboard";
import DashboardLayout from "@/layouts/DashboardLayout";
import OperatorBusinesses from "@/pages/businesses/OperatorBusinesses";
import OperatorNetwork from "@/pages/network/OperatorNetwork";
import OperatorSystem from "@/pages/system/OperatorSystem";
import OperatorInsights from "@/pages/operator/OperatorInsights";
import OperatorUsers from "@/pages/operator/OperatorUsers";
import OperatorLogs from "@/pages/operator/OperatorLogs";
import OperatorNotificationsPage from "@/pages/operator/OperatorNotificationsPage";
import OperatorAITools from "@/pages/operator/OperatorAITools";
import OperatorReports from "@/pages/operator/OperatorReports";
import OperatorMap from "@/pages/operator/OperatorMap";

export default function App() {

  const [loading, setLoading] = useState(true);
  const location = useLocation();

  /** 🔔 Provider inputs */
  const role = useRole();
  const [userId, setUserId] = useState(null);

  // Simple fake splash
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  /** 🔔 Keep userId in sync with auth state */
  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setUserId(data?.user?.id ?? null);
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUserId(session?.user?.id ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) return <LoadingScreen />;

  // Hide global navbar/footer on fullscreen video editor if you want
  const hideGlobalNavbar = false;

  return (
    <NotificationsProvider userId={userId} role={role}>
      {/* Global toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#1e293b",
            color: "white",
            borderRadius: "8px",
            fontSize: "14px",
          },
          success: { iconTheme: { primary: "#22c55e", secondary: "#1e293b" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "#1e293b" } },
        }}
      />

      {/* Global NAVBAR (hidden only on video editor full-screen mode) */}
      {!hideGlobalNavbar && <Navbar />}

      {/* Video tools local nav */}
      {(location.pathname === "/video-editor" ||
        location.pathname === "/video-dashboard") && (
        <nav
          className="sticky top-0 z-40 flex justify-center gap-8 py-3
                    bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800
                    text-white shadow-lg border-b border-slate-700
                    backdrop-blur-md transition-all duration-300"
        >
          <Link
            to="/video-editor"
            className="flex items-center gap-1 hover:text-sky-300 transition-colors font-medium"
          >
            ✂️ Editor
          </Link>
          <Link
            to="/video-dashboard"
            className="flex items-center gap-1 hover:text-amber-300 transition-colors font-medium"
          >
            📁 Dashboard
          </Link>
        </nav>
      )}

      {/* PAGE CONTENT BELOW NAVBAR */}
      <div className="pt-16 pb-14">
        <Routes>
          {/* Unified Login */}
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/email-verify-callback" element={<EmailVerifyCallback />} />
          <Route path="/auth/callback" element={<EmailVerifyCallback />} />


          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Redirect wrappers */}
          <Route path="/user-login" element={<UserLogin />} />
          <Route path="/owner-login" element={<OwnerLogin />} />
          <Route path="/operator-login" element={<OperatorLogin />} />
          <Route path="/admin-login" element={<LoginAdmin />} />

          {/* Legal pages */}
          <Route path="/legal/terms" element={<Terms />} />
          <Route path="/legal/privacy" element={<Privacy />} />
          <Route path="/legal/cookies" element={<Cookies />} />

          <Route path="/" element={<LandingPage />} />
          <Route path="/platform" element={<ElmadPlatform />} />
          <Route path="/settings" element={<SettingsPage />} />

          <Route
            path="/pricing"
            element={
              <PricingPage
                onSelectPlan={(interval) => {
                  const priceId =
                    interval === "year"
                      ? import.meta.env.VITE_STRIPE_PRO_YEARLY_PRICE_ID
                      : import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID;

                  window.location.href = `/owner/billing?checkout=${priceId}`;
                }}
              />
            }
          />

          {/* Operator Dashboard */}
          <Route
            path="/operator-dashboard"
            element={
              <DashboardLayout>
                <OperatorDashboard />
              </DashboardLayout>
            }
          />

          {/* Operator Businesses */}
          <Route
            path="/operator-businesses"
            element={
              <DashboardLayout>
                <OperatorBusinesses />
              </DashboardLayout>
            }
          />

          {/* Operator Network */}
          <Route
            path="/operator-network"
            element={
              <DashboardLayout>
                <OperatorNetwork />
              </DashboardLayout>
            }
          />

          {/* Operator System */}
          <Route
            path="/operator-system"
            element={
              <DashboardLayout>
                <OperatorSystem />
              </DashboardLayout>
            }
          />

          <Route
            path="/operator-insights"
            element={
              <DashboardLayout>
                <OperatorInsights />
              </DashboardLayout>
            }
          />
          <Route
            path="/operator-users"
            element={
              <DashboardLayout>
                <OperatorUsers />
              </DashboardLayout>
            }
          />
          <Route
            path="/operator-logs"
            element={
              <DashboardLayout>
                <OperatorLogs />
              </DashboardLayout>
            }
          />
          <Route
            path="/operator-ai-tools"
            element={
              <DashboardLayout>
                <OperatorAITools />
              </DashboardLayout>
            }
          />
          <Route
            path="/operator-reports"
            element={
              <DashboardLayout>
                <OperatorReports />
              </DashboardLayout>
            }
          />
          <Route
            path="/operator-map"
            element={
              <DashboardLayout>
                <OperatorMap />
              </DashboardLayout>
            }
          />

          {/* Notifications Router */}
          <Route path="/notifications" element={<NotificationsRouter />} />

          {/* User Notifications */}
          <Route
            path="/notifications/user"
            element={
              <UserProtectedRoute>
                <UserLayout>
                  <UserNotifications />
                </UserLayout>
              </UserProtectedRoute>
            }
          />

          {/* Owner Notifications */}
          <Route
            path="/notifications/owner"
            element={
              <OwnerProtectedRoute>
                <OwnerLayout>
                  <OwnerNotifications />
                </OwnerLayout>
              </OwnerProtectedRoute>
            }
          />

          {/* Admin Notifications */}
          <Route
            path="/notifications/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminLayout>
                  <AdminNotifications />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Operator Notifications */}
          <Route
            path="/notifications/operator"
            element={<OperatorNotifications />}
          />
          <Route
            path="/operator-notifications"
            element={
              <DashboardLayout>
                <OperatorNotificationsPage />
              </DashboardLayout>
            }
          />

          {/* Public pages */}
          <Route path="/" element={<ElmadPlatform />} />
          <Route path="/about" element={<About />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/business/:id" element={<BusinessDetails />} />
          <Route path="/ai-dashboard" element={<AIDashboard />} />

          {/* Signup Routes */}
          <Route path="/user-signup" element={<UserSignup />} />
          <Route path="/owner-signup" element={<OwnerSignup />} />

          {/* User Features */}
          <Route
            path="/favorites"
            element={
              <UserProtectedRoute>
                <UserLayout>
                  <Favorites />
                </UserLayout>
              </UserProtectedRoute>
            }
          />

          {/* Smart Dashboard Router */}
          <Route path="/dashboard" element={<DashboardRouter />} />

          {/* Direct User Dashboard */}
          <Route
            path="/user-dashboard"
            element={
              <UserProtectedRoute>
                <UserLayout>
                  <UserDashboard />
                </UserLayout>
              </UserProtectedRoute>
            }
          />

          {/* Owner routes */}
          <Route
            path="/owner/business-card/:id"
            element={<BusinessCard />}
          />

          <Route path="/owner/tools" element={<OwnerToolsCenter />} />

          <Route
            path="/owner/business/add"
            element={
              <OwnerLayout>
                <OwnerBusinessAdd />
              </OwnerLayout>
            }
          />

          <Route
            path="/owner/business/:id/edit"
            element={
              <OwnerLayout>
                <OwnerBusinessEdit />
              </OwnerLayout>
            }
          />

          <Route
            path="/owner/ai-dashboard"
            element={
              <OwnerLayout>
                <OwnerAiDashboard />
              </OwnerLayout>
            }
          />

          <Route
            path="/owner/messages"
            element={
              <OwnerProtectedRoute>
                <OwnerLayout>
                  <OwnerMessages />
                </OwnerLayout>
              </OwnerProtectedRoute>
            }
          />

          <Route
            path="/owner-dashboard"
            element={
              <OwnerProtectedRoute>
                <OwnerLayout>
                  <OwnerDashboard />
                </OwnerLayout>
              </OwnerProtectedRoute>
            }
          />

          <Route
            path="/owner/billing"
            element={
              <OwnerProtectedRoute>
                <OwnerLayout>
                  <OwnerBilling />
                </OwnerLayout>
              </OwnerProtectedRoute>
            }
          />

          {/* Join */}
          <Route
            path="/join"
            element={
              <OwnerProtectedRoute>
                <Join />
              </OwnerProtectedRoute>
            }
          />

          {/* Video Tools */}
          <Route
            path="/video-editor"
            element={
              <OwnerProtectedRoute>
                <VideoEditor />
              </OwnerProtectedRoute>
            }
          />

          <Route
            path="/video-dashboard"
            element={
              <OwnerProtectedRoute>
                <VideoDashboard />
              </OwnerProtectedRoute>
            }
          />

          {/* Admin Dashboard */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute adminOnly>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          <Route path="/admin/billing" element={<AdminBilling />} />

          <Route
            path="/admin/cookie-logs"
            element={
              <ProtectedRoute adminOnly>
                <AdminLayout>
                  <AdminCookieLogs />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>

      {/* GLOBAL FOOTER (also hidden on video editor) */}
      {!hideGlobalNavbar && <Footer />}

      {/* COOKIE BANNER — Always visible unless consent given */}
      <CookieBanner />
    </NotificationsProvider>
  );
}
