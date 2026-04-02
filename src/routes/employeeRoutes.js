import {
  TbLayoutDashboard,
  TbSpeakerphone,
  TbUserSearch,
  TbUserHeart,
} from "react-icons/tb";
import EmployeeDashboard from "../page/employee/EmployeeDashboard";
import EmployeeCampaigns from "../page/employee/EmployeeCampaigns";
import EmployeeLeads from "../page/employee/EmployeeLeads";
import EmployeeCustomers from "../page/employee/EmployeeCustomers";

const allEmployeeRoutes = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: TbLayoutDashboard,
    component: EmployeeDashboard,
    alwaysShow: true,
  },
  {
    id: "campaigns",
    label: "Campaigns",
    icon: TbSpeakerphone,
    component: EmployeeCampaigns,
    permission: "view_campaigns",
  },
  {
    id: "leads",
    label: "Leads",
    icon: TbUserSearch,
    component: EmployeeLeads,
    permission: "view_leads",
  },
  {
    id: "customers",
    label: "Customers",
    icon: TbUserHeart,
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
