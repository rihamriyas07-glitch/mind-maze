export type StreamType = 'Maths' | 'Bio';
export type SyllabusType = 'current' | 'old';
export type PaperType = 'MCQ' | 'Structured' | 'Essay';
export type MediumType = 'English' | 'Sinhala' | 'Tamil';

export type ScreenId = 
  | 'landing'
  | 'auth'
  | 'onboarding'
  | 'dashboard'
  | 'study-plan'
  | 'past-papers'
  | 'practice'
  | 'mistakes'
  | 'targets'
  | 'analytics';

export interface UserProfile {
  id?: string;
  name: string;
  email?: string;
  avatar?: string;
  provider?: 'google' | 'email' | 'guest';
  isAuthenticated?: boolean;
  stream: StreamType;
  selectedSubjects: string[];
  targetGrade: string; // e.g. "3 A's"
  examDate: string; // e.g. "2026-11-25"
  syllabus: SyllabusType;
  medium?: MediumType;
  currentOnlyFilter: boolean;
  xp: number;
  streakDays: number;
  streakFreezes: number;
  dailyGoalMCQs: number;
  dailyCompletedMCQs: number;
  level: number;
}

export interface QuestionOption {
  id: string; // 'A' | 'B' | 'C' | 'D' or '1' | '2' | '3' | '4'
  text: string;
  isCorrect: boolean;
}

export interface TryExample {
  id: string;
  title: string;
  summary: string;
  questionText: string;
  options: QuestionOption[];
  solution: string;
}

export interface QuestionExplanation {
  correctOptionId: string;
  correctOptionText: string;
  conceptNote: string; // 3-4 lines
  stepByStep: string[]; // Numbered list
  tryExamples: TryExample[];
  keyFormula?: string;
  commonPitfall?: string;
}

export interface Question {
  id: string;
  subject: string;
  stream: StreamType;
  topic: string;
  subtopic?: string;
  paperYear: number;
  syllabus: SyllabusType;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  repeatFrequency: string; // e.g. "Appeared in 2016, 2019, 2022, 2023"
  repeatYears: number[];
  questionText: string;
  diagramCode?: string; // description or SVG flag
  options: QuestionOption[];
  explanation: QuestionExplanation;
}

export interface PastPaper {
  id: string;
  title: string;
  subject: string;
  stream: StreamType;
  year: number;
  syllabus: SyllabusType;
  type: PaperType;
  medium: MediumType;
  topicTags: string[];
  hasExplanation: boolean;
  questionCount: number;
  durationMinutes: number;
  downloadSize: string;
  isModelPaper?: boolean;
}

export interface MistakeItem {
  id: string;
  question: Question;
  userSelectedOptionId: string;
  savedAt: string;
  reviewCount: number;
  isMastered: boolean;
  userNotes?: string;
}

export interface TargetCard {
  id: string;
  timeframe: 'Daily' | 'Weekly' | 'Monthly';
  title: string;
  description: string;
  current: number;
  target: number;
  unit: string;
  xpReward: number;
  completed: boolean;
  category: 'MCQs' | 'Revision' | 'Past Paper' | 'Mistakes';
}

export interface MilestoneBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
  category: 'Streak' | 'Accuracy' | 'Volume' | 'Mastery';
}

export interface TopicMastery {
  topic: string;
  subject: string;
  masteryPercentage: number;
  attempted: number;
  correct: number;
  status: 'Weak' | 'Moderate' | 'Strong';
  repeatFrequency: string;
  repeatYears: number[];
  predictedLikelihood: 'Very High' | 'High' | 'Moderate';
  lastPracticed: string;
}

export interface StudyPlanPhase {
  phaseNumber: number;
  title: string;
  duration: string;
  focus: string;
  topics: string[];
  targetPapers: string;
  status: 'completed' | 'in-progress' | 'upcoming';
}

export interface StudyPlan {
  id: string;
  title: string;
  tagline: string;
  description: string;
  durationDays: number;
  intensity: 'High Intensity' | 'Balanced' | 'Rapid Revision' | 'Comprehensive' | 'Structured Sprint';
  stream: StreamType;
  recommendedDailyHours: number;
  dailyMCQTarget: number;
  progressPercentage: number;
  currentDay: number;
  isActive: boolean;
  phases: StudyPlanPhase[];
  keyOutcomes: string[];
  badgeUnlockTitle: string;
}

export interface TimetableSlot {
  id: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  timeSlot: 'Morning (06:00 - 08:00)' | 'Afternoon (14:00 - 16:30)' | 'Evening (18:00 - 20:00)' | 'Night (20:30 - 22:30)' | 'Custom';
  startTime: string;
  endTime: string;
  subject: string;
  topic: string;
  activityType: 'Theory Revision' | 'Past Paper MCQ Sprint' | 'Mistake Analysis' | 'Formula Recall' | 'Timed Model Paper';
  isCompleted: boolean;
  targetMCQCount?: number;
  notes?: string;
}

export interface DailyCoverTopic {
  id: string;
  dateStr: string; // YYYY-MM-DD
  dayLabel: string; // e.g. "Today", "Tomorrow", "Day 14"
  subject: string;
  topic: string;
  syllabusUnit: string;
  syllabusCode: string;
  subtopics: string[];
  repeatProbability: number; // e.g. 96
  repeatYears: number[];
  examTips: string;
  targetMCQs: number;
  completedMCQs: number;
  isTheoryReviewed: boolean;
  isFormulasLocked: boolean;
  isMCQsCompleted: boolean;
  status: 'completed' | 'in-progress' | 'scheduled';
}
