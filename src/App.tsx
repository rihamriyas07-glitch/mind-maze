/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MistakeItem, ScreenId, StreamType, UserProfile } from './types';
import { INITIAL_MISTAKES } from './data/mockData';
import { getStoredSession, saveSession, clearSession } from './lib/authService';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MazeBackground } from './components/MazeBackground';
import { LandingPage } from './components/screens/LandingPage';
import { OnboardingScreen } from './components/screens/OnboardingScreen';
import { DashboardScreen } from './components/screens/DashboardScreen';
import { PastPaperLibraryScreen } from './components/screens/PastPaperLibraryScreen';
import { PracticeQuizScreen } from './components/screens/PracticeQuizScreen';
import { MistakeNotebookScreen } from './components/screens/MistakeNotebookScreen';
import { TargetsScreen } from './components/screens/TargetsScreen';
import { AnalyticsScreen } from './components/screens/AnalyticsScreen';
import { StudyPlansScreen } from './components/screens/StudyPlansScreen';
import { FeatureComingSoonScreen } from './components/screens/FeatureComingSoonScreen';
import { AuthModal } from './components/auth/AuthModal';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('landing');
  const [userProfile, setUserProfile] = useState<UserProfile>(() => getStoredSession());
  const [mistakes, setMistakes] = useState<MistakeItem[]>(INITIAL_MISTAKES);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [previewScreens, setPreviewScreens] = useState<Record<string, boolean>>({});

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [authModalStream, setAuthModalStream] = useState<StreamType>(userProfile.stream || 'Maths');

  // Active quiz custom parameters
  const [activeQuizQuestionId, setActiveQuizQuestionId] = useState<string | undefined>(undefined);
  const [activeQuizTopicFilter, setActiveQuizTopicFilter] = useState<string | undefined>(undefined);

  const handleNavigate = (screen: ScreenId) => {
    if (screen === 'auth') {
      setIsAuthModalOpen(true);
      return;
    }
    setCurrentScreen(screen);
    // Reset specific quiz drill overrides when navigating normally
    if (screen !== 'practice') {
      setActiveQuizQuestionId(undefined);
      setActiveQuizTopicFilter(undefined);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAuth = (mode: 'signin' | 'signup' = 'signin', stream?: StreamType) => {
    setAuthModalMode(mode);
    if (stream) {
      setAuthModalStream(stream);
    } else {
      setAuthModalStream(userProfile.stream || 'Maths');
    }
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (authenticatedProfile: UserProfile) => {
    setUserProfile(authenticatedProfile);
    setIsAuthModalOpen(false);
    // Navigate to dashboard if currently on landing
    if (currentScreen === 'landing') {
      setCurrentScreen('dashboard');
    }
  };

  const handleSignOut = () => {
    const guestProfile = clearSession();
    setUserProfile(guestProfile);
    setCurrentScreen('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectStreamAndStart = (stream: StreamType) => {
    setAuthModalStream(stream);
    handleOpenAuth('signup', stream);
  };

  const handleSaveProfile = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    saveSession(newProfile);
  };

  const handleUpdateProfilePartial = (partial: Partial<UserProfile>) => {
    setUserProfile((prev) => {
      const updated = { ...prev, ...partial };
      saveSession(updated);
      return updated;
    });
  };

  const handleSaveMistake = (newMistake: MistakeItem) => {
    setMistakes((prev) => {
      // Check if already in mistake notebook
      const exists = prev.some((m) => m.question.id === newMistake.question.id);
      if (exists) {
        return prev.map((m) =>
          m.question.id === newMistake.question.id
            ? { ...m, reviewCount: m.reviewCount + 1, savedAt: 'Just now' }
            : m
        );
      }
      return [newMistake, ...prev];
    });
  };

  const handleToggleMistakeMastered = (id: string) => {
    setMistakes((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isMastered: !m.isMastered } : m))
    );
  };

  const handleDeleteMistake = (id: string) => {
    setMistakes((prev) => prev.filter((m) => m.id !== id));
  };

  const handleStartReviewSession = (specificMistakeIds?: string[]) => {
    if (specificMistakeIds && specificMistakeIds.length > 0) {
      const found = mistakes.find((m) => m.id === specificMistakeIds[0]);
      if (found) {
        setActiveQuizQuestionId(found.question.id);
        setActiveQuizTopicFilter(undefined);
      }
    } else {
      setActiveQuizQuestionId(undefined);
      setActiveQuizTopicFilter(undefined);
    }
    setCurrentScreen('practice');
  };

  const handleStartSpecificQuiz = (questionId?: string, topic?: string) => {
    setActiveQuizQuestionId(questionId);
    setActiveQuizTopicFilter(topic);
    setCurrentScreen('practice');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateXP = (earnedXP: number) => {
    setUserProfile((prev) => {
      const newXP = prev.xp + earnedXP;
      const newCompleted = prev.dailyCompletedMCQs + 1;
      return {
        ...prev,
        xp: newXP,
        dailyCompletedMCQs: newCompleted,
      };
    });
  };

  const isAppView = currentScreen !== 'landing';

  return (
    <div className="relative min-h-screen bg-[#0F1023] bg-[radial-gradient(circle_at_top_right,_#1a1b3d_0%,_#0F1023_100%)] text-slate-100 flex flex-col selection:bg-[#6B4EFF] selection:text-white font-['Poppins',sans-serif]">
      {/* Animated Maze Canvas Background */}
      <MazeBackground opacity={currentScreen === 'landing' ? 0.35 : 0.25} />

      {/* Top Navigation Bar */}
      <Navbar
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        userProfile={userProfile}
        onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        isSidebarOpen={isMobileSidebarOpen}
        onOpenAuth={handleOpenAuth}
        onSignOut={handleSignOut}
      />

      {/* Main Layout Container */}
      <div className="relative z-10 flex-1 flex">
        {/* Collapsible Sidebar (shown on in-app screens) */}
        {isAppView && (
          <Sidebar
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
            mistakesCount={mistakes.filter((m) => !m.isMastered).length}
            isOpenMobile={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
            userProfile={userProfile}
            onOpenAuth={handleOpenAuth}
            onSignOut={handleSignOut}
          />
        )}

        {/* Content Area */}
        <main
          className={`flex-1 transition-all duration-300 ${
            isAppView ? 'p-4 sm:p-6 lg:p-8' : ''
          }`}
        >
          {currentScreen === 'landing' && (
            <LandingPage
              onNavigate={handleNavigate}
              onSelectStreamAndStart={handleSelectStreamAndStart}
              onOpenAuth={handleOpenAuth}
            />
          )}

          {currentScreen === 'onboarding' && (
            <OnboardingScreen
              initialProfile={userProfile}
              onSaveProfile={handleSaveProfile}
              onNavigate={handleNavigate}
            />
          )}

          {currentScreen === 'dashboard' && (
            <DashboardScreen
              userProfile={userProfile}
              onNavigate={handleNavigate}
              onStartSpecificQuiz={handleStartSpecificQuiz}
            />
          )}

          {currentScreen === 'study-plan' && (
            <StudyPlansScreen
              userProfile={userProfile}
              onNavigate={handleNavigate}
              onStartSpecificQuiz={handleStartSpecificQuiz}
              onUpdateXP={handleUpdateXP}
              onUpdateProfile={handleUpdateProfilePartial}
            />
          )}

          {currentScreen === 'past-papers' && (
            previewScreens['past-papers'] ? (
              <PastPaperLibraryScreen
                onNavigate={handleNavigate}
                onLaunchPaperQuiz={(paperId) => {
                  setActiveQuizQuestionId(undefined);
                  setCurrentScreen('practice');
                }}
              />
            ) : (
              <FeatureComingSoonScreen
                screenId="past-papers"
                onNavigate={handleNavigate}
                onAllowPreview={() => setPreviewScreens((p) => ({ ...p, 'past-papers': true }))}
              />
            )
          )}

          {currentScreen === 'practice' && (
            previewScreens['practice'] ? (
              <PracticeQuizScreen
                userProfile={userProfile}
                onNavigate={handleNavigate}
                onSaveMistake={handleSaveMistake}
                onUpdateXP={handleUpdateXP}
                initialQuestionId={activeQuizQuestionId}
                initialTopicFilter={activeQuizTopicFilter}
              />
            ) : (
              <FeatureComingSoonScreen
                screenId="practice"
                onNavigate={handleNavigate}
                onAllowPreview={() => setPreviewScreens((p) => ({ ...p, practice: true }))}
              />
            )
          )}

          {currentScreen === 'mistakes' && (
            previewScreens['mistakes'] ? (
              <MistakeNotebookScreen
                mistakes={mistakes}
                onNavigate={handleNavigate}
                onToggleMastered={handleToggleMistakeMastered}
                onDeleteMistake={handleDeleteMistake}
                onStartReviewSession={handleStartReviewSession}
              />
            ) : (
              <FeatureComingSoonScreen
                screenId="mistakes"
                onNavigate={handleNavigate}
                onAllowPreview={() => setPreviewScreens((p) => ({ ...p, mistakes: true }))}
              />
            )
          )}

          {currentScreen === 'targets' && (
            previewScreens['targets'] ? (
              <TargetsScreen
                userProfile={userProfile}
                onUpdateProfile={handleUpdateProfilePartial}
                onNavigate={handleNavigate}
              />
            ) : (
              <FeatureComingSoonScreen
                screenId="targets"
                onNavigate={handleNavigate}
                onAllowPreview={() => setPreviewScreens((p) => ({ ...p, targets: true }))}
              />
            )
          )}

          {currentScreen === 'analytics' && (
            previewScreens['analytics'] ? (
              <AnalyticsScreen
                userProfile={userProfile}
                onNavigate={handleNavigate}
                onPracticeTopic={(topic) => handleStartSpecificQuiz(undefined, topic)}
              />
            ) : (
              <FeatureComingSoonScreen
                screenId="analytics"
                onNavigate={handleNavigate}
                onAllowPreview={() => setPreviewScreens((p) => ({ ...p, analytics: true }))}
              />
            )
          )}
        </main>
      </div>

      {/* Authentication & Onboarding Sign Up Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        initialStream={authModalStream}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
