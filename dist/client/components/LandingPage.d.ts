import React from 'react';
type CurrentView = 'landing' | 'planner' | 'project-center' | 'budget-tracker' | 'demos-trailers';
interface LandingPageProps {
    onNavigate?: (destination: CurrentView) => void;
}
declare const StreamSceneLandingPage: React.FC<LandingPageProps>;
export default StreamSceneLandingPage;
//# sourceMappingURL=LandingPage.d.ts.map