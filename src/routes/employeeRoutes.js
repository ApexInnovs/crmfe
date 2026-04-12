import { lazy } from "react";
import {
  LayoutDashboard,
  Megaphone,
  Search,
  Heart,
} from "lucide-react";

// Code splitting: lazy load page components
const EmployeeDashboard = lazy(() => import("../page/employee/EmployeeDashboard"));
const EmployeeCampaigns = lazy(() => import("../page/employee/EmployeeCampaigns"));
const EmployeeLeads = lazy(() => import("../page/employee/EmployeeLeads"));
const EmployeeCustomers = lazy(() => import("../page/employee/EmployeeCustomers"));

const allEmployeeRoutes = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    component: EmployeeDashboard,
    alwaysShow: true,
  },
  {
    id: "campaigns",
    label: "Campaigns",
    icon: Megaphone,
    component: EmployeeCampaigns,
    permission: "view_campaigns",
  },
  {
    id: "leads",
    label: "Leads",
    icon: Search,
    component: EmployeeLeads,
    permission: "view_leads",
  },
  {
    id: "customers",
    label: "Customers",
    icon: Heart,
    component: EmployeeCustomers,
    permission: "view_customers",
  },
];

export const getEmployeeRoutes = (permissions = []) => {
  return allEmployeeRoutes.filter(
    (route) => route.alwaysShow || permissions.includes(route.permission),
  );
};

export default allEmployeeRoutes;
