import type { JSONContent } from '@tiptap/react';
export type Doc = JSONContent;
export type Page = 'home' | 'subjects' | 'schedule' | 'exams' | 'notes' | 'faith' | 'achievements' | 'settings';
export interface Entity { id: string; createdAt: string; updatedAt: string; order: number }
export interface Subject extends Entity { name: string; color: string; icon: string }
export interface Section extends Entity { subjectId: string; parentId: string | null; name: string }
export interface Task extends Entity { subjectId: string | null; sectionId: string | null; title: string; body: Doc; date: string | null; done: boolean; completedAt: string | null; priority: 'normal' | 'high' | 'low' }
export interface Note extends Entity { subjectId: string | null; title: string; body: Doc; pinned: boolean }
export interface Exam extends Entity { subjectId: string | null; title: string; date: string; time: string; notes: string }
export interface Settings { name: string; theme: 'royal' | 'plum' | 'midnight'; accent: string; font: 'Tajawal' | 'Cairo' | 'Amiri'; fontSize: number; animations: boolean }
export type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export interface PrayerLog extends Entity { date:string; completed:PrayerKey[] }
export interface Khatma extends Entity { title:string; totalPages:number; startDate:string; targetDate:string|null }
export interface Reading extends Entity { planId:string; date:string; fromPage:number; toPage:number; note:string }
export interface FaithData { prayers:PrayerLog[]; plans:Khatma[]; readings:Reading[]; activePlanId:string|null }
export interface PlannerData { schemaVersion: 2; deviceId: string; createdAt: string; updatedAt: string; revision: number; subjects: Subject[]; sections: Section[]; tasks: Task[]; notes: Note[]; exams: Exam[]; settings: Settings; faith:FaithData }
export interface Backup { app: 'TALA Study Planner'; schemaVersion: 2; exportedAt: string; data: PlannerData }
export const emptyDoc: Doc = { type: 'doc', content: [{ type: 'paragraph' }] };
export const colors = ['#b886df', '#84bcd3', '#e4a7bd', '#8dbdab', '#d7b777', '#ba9ee8', '#f0aa83', '#a5aef1'];
export const icons = ['book', 'calculator', 'flask', 'feather', 'moon', 'hourglass', 'globe', 'atom', 'heart', 'graduation'];
export const fonts = ['Tajawal', 'Cairo', 'Amiri'] as const;
