import { apiFetch } from './client';

export { ApiError, getAccessToken, setTokens, clearTokens } from './client';

// ---- Types ----

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  picture: string;
  google_id: string;
  is_active: boolean;
  last_login_at: string;
  created_at: string;
  updated_at: string;
}

export interface ChapterProgress {
  total: number;
  completed: number;
}

export interface TheoryChapter {
  slug: string;
  title: string;
  description: string;
  order: number;
  lessons: TheoryLessonSummary[];
  progress?: ChapterProgress;
}

export interface TheoryLessonSummary {
  slug: string;
  title: string;
  description: string;
  order: number;
  completed?: boolean;
}

export interface TheoryLesson {
  slug: string;
  title: string;
  description: string;
  order: number;
  chapter_slug: string;
  chapter_title: string;
  content: string;
  completed?: boolean;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface TaskChapter {
  slug: string;
  title: string;
  description: string;
  order: number;
  solved_count: number;
  tasks: TaskSummary[];
}

export interface TaskSummary {
  slug: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  order: number;
  solved: boolean | null;
}

export interface TaskSubmission {
  id: string;
  user_id: string;
  chapter_slug: string;
  task_slug: string;
  code: string;
  passed: boolean;
  result: SubmitResult;
  created_at: string;
}

export interface TaskDetail {
  slug: string;
  title: string;
  description: string;
  template: string;
  difficulty: Difficulty;
  order: number;
  chapter_slug: string;
  chapter_title: string;
  solved: boolean | null;
  submissions?: TaskSubmission[];
  completions?: Completion[];
}

export interface SubmitResult {
  passed: boolean;
  tests: SubmitTestResult[] | null;
  error?: string;
}

export interface SubmitTestResult {
  name: string;
  passed: boolean;
  output: string;
}

export interface QuizChapterInfo {
  slug: string;
  title: string;
  question_count: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  chapter_slug: string;
}

export interface QuizAnswerResult {
  correct: boolean;
  correct_answer: number;
  explanation: string;
}

export interface ProjectSummary {
  slug: string;
  title: string;
  description: string;
  order: number;
  solved_count: number;
  steps: ProjectStepSummary[];
}

export interface ProjectStepSummary {
  slug: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  order: number;
  solved: boolean | null;
}

export interface ProjectStepDetail {
  slug: string;
  title: string;
  description: string;
  template: string;
  difficulty: Difficulty;
  hints: string[];
  file: string;
  order: number;
  project_slug: string;
  project_title: string;
  solved: boolean | null;
  completions?: Completion[];
  submissions?: TaskSubmission[];
}

export interface AnalysisResult {
  recommendation: string;
}

export interface CompletionField {
  name: string;
  type: string;
  doc: string;
}

export interface CompletionSymbol {
  name: string;
  kind: string;
  detail: string;
  doc: string;
  fields?: CompletionField[];
}

export interface Completion {
  name: string;
  doc: string;
  symbols: CompletionSymbol[];
}

export interface StatsChapterItem {
  slug: string;
  title: string;
  total: number;
  completed?: number;
  solved?: number;
}

export interface StatsProjectItem {
  slug: string;
  title: string;
  total: number;
  solved: number;
}

export interface TheoryStats {
  total_lessons: number;
  completed_lessons: number;
  chapters: StatsChapterItem[];
}

export interface TasksStats {
  total_tasks: number;
  solved_tasks: number;
  chapters: StatsChapterItem[];
}

export interface ProjectsStats {
  total_steps: number;
  solved_steps: number;
  projects: StatsProjectItem[];
}

export interface UserStats {
  theory: TheoryStats;
  tasks: TasksStats;
  projects: ProjectsStats;
}

// ---- API Functions ----

// Auth
export function loginWithGoogle() {
  window.location.href = '/api/google/login';
}

export function refreshTokens(refreshToken: string) {
  return apiFetch<{ access_token: string; refresh_token: string; expires_in: number }>('/api/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

export function logoutApi() {
  return apiFetch<{ message: string }>('/api/auth/logout', { method: 'POST' });
}

// Users
export function fetchProfile() {
  return apiFetch<UserProfile>('/api/users/profile');
}

export function updateProfile(data: { name: string; picture?: string }) {
  return apiFetch<{ message: string }>('/api/users/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteAccount() {
  return apiFetch<{ message: string }>('/api/users/account', { method: 'DELETE' });
}

// Theory
export function fetchTheoryChapters() {
  return apiFetch<TheoryChapter[]>('/api/theory/');
}

export function fetchTheoryChapter(chapterSlug: string) {
  return apiFetch<TheoryChapter>(`/api/theory/${encodeURIComponent(chapterSlug)}`);
}

export function fetchTheoryLesson(chapterSlug: string, lessonSlug: string) {
  return apiFetch<TheoryLesson>(
    `/api/theory/${encodeURIComponent(chapterSlug)}/${encodeURIComponent(lessonSlug)}`
  );
}

export function completeTheoryLesson(chapterSlug: string, lessonSlug: string) {
  return apiFetch<{ message: string }>(
    `/api/theory/${encodeURIComponent(chapterSlug)}/${encodeURIComponent(lessonSlug)}/complete`,
    { method: 'PUT' }
  );
}

// Tasks
export function fetchTaskChapters() {
  return apiFetch<TaskChapter[]>('/api/tasks/');
}

export function fetchTaskChapter(chapterSlug: string) {
  return apiFetch<TaskChapter>(`/api/tasks/${encodeURIComponent(chapterSlug)}`);
}

export function fetchTask(chapterSlug: string, taskSlug: string) {
  return apiFetch<TaskDetail>(
    `/api/tasks/${encodeURIComponent(chapterSlug)}/${encodeURIComponent(taskSlug)}`
  );
}

export function submitTask(chapterSlug: string, taskSlug: string, code: string) {
  return apiFetch<SubmitResult>(
    `/api/tasks/${encodeURIComponent(chapterSlug)}/${encodeURIComponent(taskSlug)}/submit`,
    { method: 'POST', body: JSON.stringify({ code }) }
  );
}

// Quiz
export function fetchQuizChapters() {
  return apiFetch<QuizChapterInfo[]>('/api/quiz/chapters');
}

export function fetchQuizQuestions(chapters?: string[], limit?: number) {
  const params = new URLSearchParams();
  if (chapters && chapters.length > 0) params.set('chapters', chapters.join(','));
  if (limit !== undefined) params.set('limit', String(limit));
  const qs = params.toString();
  return apiFetch<QuizQuestion[]>(`/api/quiz/${qs ? '?' + qs : ''}`);
}

export function submitQuizAnswer(questionId: string, answer: number) {
  return apiFetch<QuizAnswerResult>('/api/quiz/answer', {
    method: 'POST',
    body: JSON.stringify({ question_id: questionId, answer }),
  });
}

// Projects
export function fetchProjects() {
  return apiFetch<ProjectSummary[]>('/api/projects/');
}

export function fetchProject(projectSlug: string) {
  return apiFetch<ProjectSummary>(`/api/projects/${encodeURIComponent(projectSlug)}`);
}

export function fetchProjectStep(projectSlug: string, stepSlug: string) {
  return apiFetch<ProjectStepDetail>(
    `/api/projects/${encodeURIComponent(projectSlug)}/${encodeURIComponent(stepSlug)}`
  );
}

export function submitProjectStep(projectSlug: string, stepSlug: string, code: string) {
  return apiFetch<SubmitResult>(
    `/api/projects/${encodeURIComponent(projectSlug)}/${encodeURIComponent(stepSlug)}/submit`,
    { method: 'POST', body: JSON.stringify({ code }) }
  );
}

// Stats
export function fetchUserStats() {
  return apiFetch<UserStats>('/api/users/stats');
}

// AI Analysis
export function analyzeTask(chapterSlug: string, taskSlug: string, code: string) {
  return apiFetch<AnalysisResult>(
    `/api/analyze/task/${encodeURIComponent(chapterSlug)}/${encodeURIComponent(taskSlug)}`,
    { method: 'POST', body: JSON.stringify({ code }) }
  );
}

export function analyzeProjectStep(projectSlug: string, stepSlug: string, code: string) {
  return apiFetch<AnalysisResult>(
    `/api/analyze/project/${encodeURIComponent(projectSlug)}/${encodeURIComponent(stepSlug)}`,
    { method: 'POST', body: JSON.stringify({ code }) }
  );
}

// Format
export interface FormatResult {
  code: string;
}

export function formatCode(code: string) {
  return apiFetch<FormatResult>('/api/format', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export function formatProjectCode(projectSlug: string, stepSlug: string, code: string) {
  return apiFetch<FormatResult>(
    `/api/format/${encodeURIComponent(projectSlug)}/${encodeURIComponent(stepSlug)}`,
    { method: 'POST', body: JSON.stringify({ code }) }
  );
}
