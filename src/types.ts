export interface AppButton {
  id: string;
  name: string;
  logo: string; // emoji, icon name, or image URL
  link: string; // target website URL to load
  network: "startapp" | "monetag" | "both";
  status: "active" | "inactive";
  adsEnabled?: boolean; // toggle ads for this button specifically (defaults to true)
}

export interface AdConfig {
  adsEnabled: boolean;
  startappAppId: string;
  monetagZoneId: string;
  videoDurationSeconds: number; // Duration of dynamic ad placeholder
  videoAdUrl: string; // Custom video ad URL or default simulation
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "alert";
  sentAt: string;
  active: boolean;
}

export interface PremiumItem {
  id: string;
  name: string;
  link: string;
  category: "Premium APK" | "Premium course" | "Premium book" | "New Premium movie";
  status: "active" | "inactive";
}

export interface UserFeedback {
  id: string;
  userName: string;
  userComment: string;
  submittedAt: string;
}

export interface AdFreeUser {
  id: string;
  userName: string;
  userPhoneOrTxid: string;
  amount: string;
  status: "pending" | "approved";
  activationKey: string;
  createdAt: string;
  expiryDate?: string; // ISO date string or "permanent" or "expired"
  duration?: "1day" | "1month" | "1year" | "permanent";
}

export interface DevDetails {
  name: string;
  subTitle: string;
  description: string;
  whatsappNumber: string;
  facebookUrl: string;
  avatarInitials: string;
}

export interface UserProfile {
  id: string;
  username: string;
  createdAt: string;
  lastActive: string;
  deviceInfo?: string;
  visitCount: number;
}

export interface AppConfig {
  buttons: AppButton[];
  adConfig: AdConfig;
  notifications: NotificationItem[];
  googleSheetsId: string; // spreadsheet ID of the sync sheet
  adminCode: string; // PIN code for admin panel authentication (defaults to 1234)
  adminCodeSecondary: string; // Double protection authentication PIN (defaults to 5678)
  securityQuestion: string; // Reset question, configured by admin
  securityAnswer: string; // Reset answer, configured by admin
  premiumItems: PremiumItem[]; // Premium items grouped by category
  feedbacks: UserFeedback[]; // List of user comments/requests
  devDetails?: DevDetails; // Optional developer portfolio information
  feedbackSheetUrl?: string; // Google Apps Script/Sheets Webapp URL for direct submissions
  bkashNumber?: string; // Developer's bKash wallet
  nagadNumber?: string; // Developer's Nagad wallet
  rocketNumber?: string; // Developer's Rocket wallet
  adFreeUsers?: AdFreeUser[]; // Database of premium ad-free users
  appName?: string; // Custom App Name (defaults to "ALL LIVE")
  adTitle?: string; // Custom main card header (defaults to "আপনার সুবিধাজনক বাটন বেছে নিন")
  adDescription?: string; // Custom main card sub-desc (defaults to "নিচের ওয়াচ বাটনসমূহে ক্লিক করলেই স্পন্সর বিজ্ঞাপনটি শুরু হবে। ৫ সেকেন্ড বিজ্ঞাপন দেখে ওয়েবসাইট উপভোগ করুন।")
  backButtonText?: string; // Custom button text inside browser view ("হোমপেজে ফিরুন (Ad সহ)")
  backButtonAdTrigger?: boolean; // Control if returning triggers an ad
  users?: UserProfile[]; // Database of registered user sessions (analytics)
}
