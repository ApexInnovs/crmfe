import { lazy } from "react";
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Search,
  Heart,
  CreditCard,
} from "lucide-react";

// Code splitting: lazy load page components
const CompanyDashboard = lazy(() => import("../page/company/CompanyDashboard"));
const CompanyEmployees = lazy(() => import("../page/company/CompanyEmployees"));
const CompanyCampaigns = lazy(() => import("../page/company/CompanyCampaigns"));
const CompanyLeads = lazy(() => import("../page/company/CompanyLeads"));
const CompanyCustomers = lazy(() => import("../page/company/CompanyCustomers"));
const CompanySubscription = lazy(
  () => import("../page/company/CompanySubcription"),
);

const companyRoutes = [
  {
    id: "dashboard",
    path: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    component: CompanyDashboard,
  },
  {
    id: "employees",
    path: "employees",
    label: "Employees",
    icon: Users,
    component: CompanyEmployees,
  },
  {
    id: "campaigns",
    path: "campaigns",
    label: "Campaigns",
    icon: Megaphone,
    component: CompanyCampaigns,
  },
  {
    id: "leads",
    path: "leads",
    label: "Leads",
    icon: Search,
    component: CompanyLeads,
  },
  {
    id: "customers",
    path: "customers",
    label: "Clients",
    icon: Heart,
    component: CompanyCustomers,
  },
];

export default companyRoutes;
