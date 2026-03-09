import { createBrowserRouter } from 'react-router';
import { RootLayout } from './components/RootLayout';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { TheoryPage } from './pages/TheoryPage';
import { TheoryLessonPage } from './pages/TheoryLessonPage';
import { TasksPage } from './pages/TasksPage';
import { TaskEditorPage } from './pages/TaskEditorPage';
import { QuizPage } from './pages/QuizPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectStepPage } from './pages/ProjectStepPage';
import { ProfilePage } from './pages/ProfilePage';
import { CallbackPage } from './pages/CallbackPage';

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    children: [
      {
        path: '/callback',
        Component: CallbackPage,
      },
      {
        path: '/',
        Component: Layout,
        children: [
          { index: true, Component: HomePage },
          { path: 'theory', Component: TheoryPage },
          { path: 'theory/:chapterId/:lessonId', Component: TheoryLessonPage },
          { path: 'tasks', Component: TasksPage },
          { path: 'tasks/:chapterId/:taskId', Component: TaskEditorPage },
          { path: 'quiz', Component: QuizPage },
          { path: 'projects', Component: ProjectsPage },
          { path: 'projects/:projectId/:stepId', Component: ProjectStepPage },
          { path: 'profile', Component: ProfilePage },
        ],
      },
    ],
  },
]);
