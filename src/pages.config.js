import Assessment from './pages/Assessment';
import Dashboard from './pages/Dashboard';
import Departments from './pages/Departments';
import Landing from './pages/Landing';
import Recommendations from './pages/Recommendations';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Assessment": Assessment,
    "Dashboard": Dashboard,
    "Departments": Departments,
    "Landing": Landing,
    "Recommendations": Recommendations,
    "Settings": Settings,
    "Reports": Reports,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};