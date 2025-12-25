import Dashboard from './pages/Dashboard';
import Assessment from './pages/Assessment';
import Departments from './pages/Departments';
import Recommendations from './pages/Recommendations';
import Settings from './pages/Settings';
import Landing from './pages/Landing';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Assessment": Assessment,
    "Departments": Departments,
    "Recommendations": Recommendations,
    "Settings": Settings,
    "Landing": Landing,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};