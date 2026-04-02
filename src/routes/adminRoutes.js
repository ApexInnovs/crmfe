import {
  TbLayoutDashboard,
  TbBuilding,
  TbKey,
  TbShieldCheck,
  TbPackage,
} from "react-icons/tb";
import Dashboard from "../page/admin/Dashboard";
import Companies from "../page/admin/Companies";
import Permissions from "../page/admin/Permissions";
import Roles from "../page/admin/Roles";
import Packages from "../page/admin/Packages";

const adminRoutes = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: TbLayoutDashboard,
    component: Dashboard,
  },
  {
    id: "companies",
    label: "Companies",
    icon: TbBuilding,
    component: Companies,
  },
  {
    id: "permissions",
    label: "Permissions",
    icon: TbKey,
    component: Permissions,
  },
  {
    id: "roles",
    label: "Roles",
    icon: TbShieldCheck,
    component: Roles,
  },
  {
    id: "packages",
    label: "Packages",
    icon: TbPackage,
    component: Packages,
  },
];

export default adminRoutes;
