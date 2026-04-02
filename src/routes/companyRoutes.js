import {
  TbLayoutDashboard,
  TbUsers,
  TbSpeakerphone,
  TbUserSearch,
  TbUserHeart,
} from "react-icons/tb";
import { TbCreditCard } from "./subscriptionIcon";
import CompanyDashboard from "../page/company/CompanyDashboard";
import CompanyEmployees from "../page/company/CompanyEmployees";
import CompanyCampaigns from "../page/company/CompanyCampaigns";
import CompanyLeads from "../page/company/CompanyLeads";
import CompanyCustomers from "../page/company/CompanyCustomers";
import CompanySubscription from "../page/company/CompanySubcription";

const companyRoutes = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: TbLayoutDashboard,
    component: CompanyDashboard,
  },
  {
    id: "employees",
    label: "Employees",
    icon: TbUsers,
    component: CompanyEmployees,
  },
  {
    id: "campaigns",
    label: "Campaigns",
    icon: TbSpeakerphone,
    component: CompanyCampaigns,
  },
  {
    id: "leads",
    label: "Leads",
    icon: TbUserSearch,
    component: CompanyLeads,
  },
  {
    id: "customers",
    label: "Customers",
    icon: TbUserHeart,
    component: CompanyCustomers,
  },
  {
    id: "subscription",
    label: "Subscription",
    icon: TbCreditCard,
    component: CompanySubscription,
  },
];

export default companyRoutes;
