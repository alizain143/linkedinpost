export type ContactSubject =
  | "General question"
  | "Billing & plans"
  | "Agency & teams"
  | "Partnership"
  | "Press";

export type SubmitContactBody = {
  firstName?: string;
  lastName?: string;
  email: string;
  subject: ContactSubject;
  message: string;
};

export type SubmitContactResponse = {
  sent: boolean;
};
