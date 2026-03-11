import React, { useState, useEffect } from 'react';
import Joyride, { STATUS } from 'react-joyride';
import { useSelector } from 'react-redux';
import { useAuth } from '../../features/auth/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const TOUR_STORAGE_KEY = 'riq_tour_completed';

export const OnboardingTour = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const themeMode = useSelector(state => state.theme.mode);
    
    // Only run the tour if the user is logged in
    const [run, setRun] = useState(false);

    useEffect(() => {
        if (!user) return;
        
        // Wait a beat to let Dashboard load properly
        const timer = setTimeout(() => {
            const hasCompleted = localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
            if (!hasCompleted && location.pathname === '/dashboard') {
                setRun(true);
            }
        }, 1500);
        
        return () => clearTimeout(timer);
    }, [user, location.pathname]);

    const steps = [
        {
            target: 'body',
            placement: 'center',
            title: 'Welcome to ReliabilityIQ!',
            content: 'Let\'s take a quick tour of your new performance and reliability management system.',
            disableBeacon: true,
        },
        {
            target: '#tour-stats',
            title: 'Performance Dashboards',
            content: 'Track your team\'s reliability and task completion rates at a glance. We automatically analyze delays.',
            placement: 'bottom',
        },
        {
            target: '#tour-add-task',
            title: 'Quick Task Creation',
            content: 'Instantly create and assign tasks. Use our AI tools here to improve descriptions or suggest the best assignee.',
            placement: 'left',
        },
        {
            target: '#tour-sidebar',
            title: 'Organized Navigation',
            content: 'Jump effortlessly between your Kanban boards, team performance analytics, and exportable reports.',
            placement: 'right',
        },
        {
            target: '#tour-profile',
            title: 'Account & Settings',
            content: 'Switch between light and dark modes, read notifications, and update your profile here.',
            placement: 'bottom',
        }
    ];

    const handleJoyrideCallback = (data) => {
        const { status } = data;
        const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            // Tour completed or skipped
            localStorage.setItem(TOUR_STORAGE_KEY, 'true');
            setRun(false);
        }
    };

    // Styling to match the brand
    const isDark = themeMode === 'dark';
    
    return (
        <Joyride
            steps={steps}
            run={run}
            continuous={true}
            showProgress={true}
            showSkipButton={true}
            callback={handleJoyrideCallback}
            styles={{
                options: {
                    zIndex: 10000,
                    arrowColor: isDark ? '#1e293b' : '#ffffff',
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    overlayColor: 'rgba(0, 0, 0, 0.45)',
                    primaryColor: '#2563eb', // brand blue-600
                    textColor: isDark ? '#f8fafc' : '#0f172a',
                },
                tooltipContainer: {
                    textAlign: 'left'
                },
                tooltip: {
                    borderRadius: '12px',
                    padding: '24px',
                    paddingBottom: '16px'
                },
                buttonNext: {
                    borderRadius: '8px',
                    fontWeight: 700,
                    padding: '8px 16px',
                    backgroundColor: '#2563eb', // bg-blue-600
                },
                buttonBack: {
                    marginRight: '8px',
                    color: isDark ? '#94a3b8' : '#64748b', // text-slate-400 / 500
                    fontWeight: 600
                },
                buttonSkip: {
                    color: isDark ? '#cbd5e1' : '#94a3b8',
                    fontWeight: 600,
                    fontSize: '13px'
                }
            }}
            locale={{
                last: 'Get Started',
                skip: 'Skip Tour'
            }}
        />
    );
};

export default OnboardingTour;
