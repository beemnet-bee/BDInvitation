export type CardThemeType = "brutalist" | "acid" | "swiss" | "sunset" | "aurora";

export interface CardConfig {
  id: string;
  senderName: string;
  recipientName: string;
  birthdayDate: string; // "June 7"
  theme: CardThemeType;
  message: string;
  acousticMode: boolean; // whether audio is active
}
