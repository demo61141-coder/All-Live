export interface AppButton {
  id: string;
  name: string;
  logo: string; // emoji, icon name, or image URL
  link: string; // target website URL to load
  network: "startapp" | "monetag" | "both";
  status: "active" | "inactive";
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

export interface AppConfig {
  buttons: AppButton[];
  adConfig: AdConfig;
  notifications: NotificationItem[];
  googleSheetsId: string; // spreadsheet ID of the sync sheet
  adminCode: string; // PIN code for admin panel authentication (defaults to 1234)
}
