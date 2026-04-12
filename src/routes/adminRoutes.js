import { lazy } from "react";
import {
  LayoutDashboard,
  Building2,
  Key,
  ShieldCheck,
  Package,
} from "lucide-react";

// Code splitting: lazy load page components
const Dashboard = lazy(() => import("../page/admin/Dashboard"));
const Companies = lazy(() => import("../page/admin/Companies"));
const Permissions = lazy(() => import("../page/admin/Permissions"));
const Roles = lazy(() => import("../page/admin/Roles"));
const Packages = lazy(() => import("../page/admin/Packages"));

const adminRoutes = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    component: Dashboard,
  },
  {
    id: "companies",
    label: "Companies",
    icon: Building2,
    component: Companies,
  },
  {
    id: "permissions",
    label: "Permissions",
    icon: Key,
    component: Permissions,
  },
  {
    id: "roles",
    label: "Roles",
    icon: ShieldCheck,
    component: Roles,
  },
  {
    id: "packages",
    label: "Packages",
    icon: Package,
    component: Packages,
  },
];

export default adminRoutes;
