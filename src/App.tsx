import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/Login.tsx";
import Dashboard from "./pages/admin/Dashboard.tsx";
import Events from "./pages/admin/Events.tsx";
import EventDetail from "./pages/admin/EventDetail.tsx";
import Users from "./pages/admin/Users.tsx";
import Templates from "./pages/admin/Templates.tsx";
import TemplateDetail from "./pages/admin/TemplateDetail.tsx";
import AssetLibrary from "./pages/admin/AssetLibrary.tsx";
import SiteSettings from "./pages/admin/SiteSettings.tsx";
import Billing from "./pages/admin/Billing.tsx";
import Reports from "./pages/admin/Reports.tsx";
import AuditLog from "./pages/admin/AuditLog.tsx";
import CustomerEvents from "./pages/customer/CustomerEvents.tsx";
import CustomerEventDetail from "./pages/customer/CustomerEventDetail.tsx";
import GatePage from "./pages/public/GatePage.tsx";
import InvitePage from "./pages/public/InvitePage.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />

          {/* Admin */}
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/events" element={<Events />} />
          <Route path="/admin/events/:id" element={<EventDetail />} />
          <Route path="/admin/templates" element={<Templates />} />
          <Route path="/admin/templates/:id" element={<TemplateDetail />} />
          <Route path="/admin/asset-library" element={<AssetLibrary />} />
          {/* Legacy redirect target — old links to /admin/agenda-library still work. */}
          <Route path="/admin/agenda-library" element={<AssetLibrary />} />
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/billing" element={<Billing />} />
          <Route path="/admin/reports" element={<Reports />} />
          <Route path="/admin/site-settings" element={<SiteSettings />} />
          <Route path="/admin/audit-log" element={<AuditLog />} />

          {/* Customer */}
          <Route path="/customer" element={<CustomerEvents />} />
          <Route path="/customer/events/:id" element={<CustomerEventDetail />} />

          {/* Public guest pages */}
          <Route path="/:slug" element={<GatePage />} />
          <Route path="/:slug/invite" element={<InvitePage />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
