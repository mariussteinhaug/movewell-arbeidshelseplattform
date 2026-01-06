import Accommodation from './pages/Accommodation';
import Assessment from './pages/Assessment';
import Dashboard from './pages/Dashboard';
import Departments from './pages/Departments';
import EmployeeProfile from './pages/EmployeeProfile';
import Landing from './pages/Landing';
import MyMessages from './pages/MyMessages';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import TrendAnalysis from './pages/TrendAnalysis';
import AcceptInvite from './pages/AcceptInvite';
import Invite from './pages/Invite';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Accommodation": Accommodation,
    "Assessment": Assessment,
    "Dashboard": Dashboard,
    "Departments": Departments,
    "EmployeeProfile": EmployeeProfile,
    "Landing": Landing,
    "MyMessages": MyMessages,
    "Profile": Profile,
    "Reports": Reports,
    "Settings": Settings,
    "TrendAnalysis": TrendAnalysis,
    "AcceptInvite": AcceptInvite,
    "Invite": Invite,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};