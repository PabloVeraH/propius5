export interface ClockPort {
  now(): Date;
  addMinutes(date: Date, minutes: number): Date;
  addDays(date: Date, days: number): Date;
}