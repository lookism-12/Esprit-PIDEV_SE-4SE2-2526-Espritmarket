export interface UserPreferences {
  id: string;
  userId: string;
  interests: UserInterests;
  notifications: NotificationPreferences;
  display: DisplayPreferences;
  privacy: PrivacyPreferences;
  updatedAt: Date;
}

export interface UserInterests {
  academicFields: string[];
  technicalSkills: string[];
  productCategories: string[];
  carpoolingRoutes: CarpoolingRoutePreference[];
  forumTopics: string[];
}

export interface CarpoolingRoutePreference {
  from: string;
  to: string;
  preferredTime?: string;
  daysOfWeek?: number[];
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  messages: boolean;
  carpooling: boolean;
  forum: boolean;
  priceAlerts: boolean;
  systemAlerts: boolean;
}

export interface DisplayPreferences {
  language: string;
  theme: 'light' | 'dark' | 'system';
  currency: string;
  dateFormat: string;
  compactView: boolean;
}

export interface PrivacyPreferences {
  showProfile: boolean;
  showActivity: boolean;
  showFavorites: boolean;
  allowMessages: 'everyone' | 'connections' | 'none';
  showOnlineStatus: boolean;
}

// Academic/Technical Interests Options
export const ACADEMIC_FIELDS = [
  'Computer Science',
  'Software Engineering',
  'Data Science',
  'Artificial Intelligence',
  'Cybersecurity',
  'Network Engineering',
  'Web Development',
  'Mobile Development',
  'Game Development',
  'DevOps',
  'Cloud Computing',
  'Electronics',
  'Telecommunications',
  'Business Intelligence',
  'Project Management'
];

export const TECHNICAL_SKILLS = [
  'JavaScript/TypeScript',
  'Python',
  'Java',
  'C/C++',
  'PHP',
  'React/Angular/Vue',
  'Node.js',
  'Spring Boot',
  'Django/Flask',
  '.NET',
  'SQL Databases',
  'NoSQL Databases',
  'Docker/Kubernetes',
  'AWS/Azure/GCP',
  'Machine Learning',
  'UI/UX Design',
  'Figma/Adobe XD'
];

export const FORUM_TOPICS = [
  'Programming Help',
  'Career Advice',
  'Study Groups',
  'Project Collaboration',
  'Internships',
  'Events & Workshops',
  'Buy/Sell Tips',
  'Campus Life',
  'Tech News',
  'Tutorials'
];

export interface UpdatePreferencesRequest {
  interests?: Partial<UserInterests>;
  notifications?: Partial<NotificationPreferences>;
  display?: Partial<DisplayPreferences>;
  privacy?: Partial<PrivacyPreferences>;
}
