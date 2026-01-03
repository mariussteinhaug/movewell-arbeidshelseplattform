import Accommodation from './pages/Accommodation';
import Assessment from './pages/Assessment';
import AssessmentResults from './pages/AssessmentResults';
import Dashboard from './pages/Dashboard';
import Departments from './pages/Departments';
import EmployeeProfile from './pages/EmployeeProfile';
import Landing from './pages/Landing';
import MessageCenter from './pages/MessageCenter';
import MyMessages from './pages/MyMessages';
import Profile from './pages/Profile';
import Recommendations from './pages/Recommendations';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import TrendAnalysis from './pages/TrendAnalysis';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Accommodation": Accommodation,
    "Assessment": Assessment,
    "AssessmentResults": AssessmentResults,
    "Dashboard": Dashboard,
    "Departments": Departments,
    "EmployeeProfile": EmployeeProfile,
    "Landing": Landing,
    "MessageCenter": MessageCenter,
    "MyMessages": MyMessages,
    "Profile": Profile,
    "Recommendations": Recommendations,
    "Reports": Reports,
    "Settings": Settings,
    "TrendAnalysis": TrendAnalysis,
}

export const pagesConfig = {
    mainPage: "Assessment",
    Pages: PAGES,
    Layout: __Layout,
};