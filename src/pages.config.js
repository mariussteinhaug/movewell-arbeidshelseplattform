import Assessment from './pages/Assessment';
import Dashboard from './pages/Dashboard';
import Departments from './pages/Departments';
import Landing from './pages/Landing';
import Recommendations from './pages/Recommendations';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import TrendAnalysis from './pages/TrendAnalysis';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Assessment": Assessment,
    "Dashboard": Dashboard,
    "Departments": Departments,
    "Landing": Landing,
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