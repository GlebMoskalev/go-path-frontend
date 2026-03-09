import { useParams, Link } from 'react-router';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { fetchTheoryLesson, type TheoryLesson } from '../api';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { useEffect, useState } from 'react';

export function TheoryLessonPage() {
  const { chapterId, lessonId } = useParams<{ chapterId: string; lessonId: string }>();
  const [lesson, setLesson] = useState<TheoryLesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!chapterId || !lessonId) return;
    
    setIsLoading(true);
    fetchTheoryLesson(chapterId, lessonId)
      .then(setLesson)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [chapterId, lessonId]);

  if (isLoading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F111A' }}>
        <div style={{ fontSize: '14px', color: '#94A3B8' }}>Загрузка...</div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F111A' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <h2 style={{ color: '#F1F5F9', marginBottom: '8px' }}>Урок не найден</h2>
          <Link to="/theory" style={{ color: '#00ADD8', textDecoration: 'none' }}>← Вернуться к теории</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#0F111A', minHeight: 'calc(100vh - 56px)' }}>
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 48px 80px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '28px', flexWrap: 'wrap' }}>
          <Link to="/theory" style={{ fontSize: '13px', color: '#94A3B8', textDecoration: 'none' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#F1F5F9')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
          >
            Теория
          </Link>
          <ChevronRight size={13} style={{ color: '#64748B' }} />
          <span style={{ fontSize: '13px', color: '#94A3B8' }}>{lesson.chapter_slug}</span>
          <ChevronRight size={13} style={{ color: '#64748B' }} />
          <span style={{ fontSize: '13px', color: '#F1F5F9' }}>{lesson.title}</span>
        </div>

        {/* Lesson header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
            Урок {lesson.order}
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.03em', marginBottom: '8px' }}>
            {lesson.title}
          </h1>
          <p style={{ fontSize: '15px', color: '#94A3B8' }}>{lesson.description}</p>
        </div>

        {/* Content */}
        <MarkdownRenderer content={lesson.content} />

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '48px', paddingTop: '32px', borderTop: '1px solid #1E2A3A' }}>
          <Link
            to="/theory"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '14px 20px',
              borderRadius: '10px',
              border: '1px solid #1E2A3A',
              background: '#141824',
              textDecoration: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = '#00ADD8';
              (e.currentTarget as HTMLElement).style.background = '#1A2035';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = '#1E2A3A';
              (e.currentTarget as HTMLElement).style.background = '#141824';
            }}
          >
            <ChevronLeft size={16} style={{ color: '#00ADD8', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '2px' }}>Назад</div>
              <div style={{ fontSize: '13px', color: '#E2E8F0', fontWeight: 500 }}>Все уроки</div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
