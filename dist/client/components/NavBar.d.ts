import React from 'react';
interface NavbarProps {
    currentComponent: 'landing' | 'planner' | 'project-center' | 'budget-tracker' | 'demos-trailers' | 'content-scheduler';
    onNavigate: (component: 'landing' | 'planner' | 'project-center' | 'budget-tracker' | 'demos-trailers' | 'content-scheduler') => void;
    user?: {
        name: string;
        avatar?: string;
    };
}
declare const Navbar: React.FC<NavbarProps>;
export default Navbar;
//# sourceMappingURL=NavBar.d.ts.map