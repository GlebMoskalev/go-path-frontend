import { Link } from 'react-router';
import { BookOpen, Code2, Brain, FolderGit2, ArrowRight, CheckCircle, Zap, Trophy, Users, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';

const features = [
  {
    icon: <BookOpen size={22} />,
    title: 'Теория',
    description: 'Структурированные уроки по всем аспектам Go: от основ синтаксиса до продвинутой конкурентности. Markdown с примерами кода.',
    to: '/theory',
    color: '#00ADD8',
  },
  {
    icon: <Code2 size={22} />,
    title: 'Задачи',
    description: 'Практические задачи с проверкой в реальном времени. Встроенный редактор кода с подсветкой синтаксиса.',
    to: '/tasks',
    color: '#10B981',
  },
  {
    icon: <Brain size={22} />,
    title: 'Квизы',
    description: 'Проверьте знания через вопросы с вариантами ответов. Мгновенная обратная связь и объяснения.',
    to: '/quiz',
    color: '#F59E0B',
  },
  {
    icon: <FolderGit2 size={22} />,
    title: 'Проекты',
    description: 'Пошаговое создание реальных Go-приложений: REST API, CLI-инструменты, веб-скраперы.',
    to: '/projects',
    color: '#c792ea',
  },
];

const advantages = [
  { icon: <Zap size={18} />, title: 'Быстрый старт', desc: 'Никаких установок. Пишите и проверяйте код прямо в браузере.' },
  { icon: <CheckCircle size={18} />, title: 'Проверка кода', desc: 'Автоматические тесты дают мгновенную обратную связь по каждому решению.' },
  { icon: <Trophy size={18} />, title: 'Прогресс и достижения', desc: 'Отслеживайте прогресс по главам, задачам и проектам.' },
  { icon: <Users size={18} />, title: 'Реальный контент', desc: 'Весь материал — реальные Go-паттерны и лучшие практики из production-кода.' },
];

const stats = [
  { value: '40+', label: 'уроков' },
  { value: '60+', label: 'задач' },
  { value: '4', label: 'проекта' },
  { value: '100+', label: 'вопросов' },
];

export function HomePage() {
  const { user, login } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Проверяем наличие ошибки авторизации в URL
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    
    if (error) {
      setAuthError(error);
      // Очищаем URL от параметра ошибки
      window.history.replaceState({}, '', window.location.pathname);
      
      // Автоматически скрываем ошибку через 5 секунд
      setTimeout(() => setAuthError(null), 5000);
    }
  }, []);
  return (
    <div style={{ background: '#0F111A', minHeight: '100vh' }}>
      {/* Ошибка авторизации */}
      {authError && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          maxWidth: '500px',
          width: '90%',
        }}>
          <div style={{
            background: '#1E1B2E',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            <XCircle size={20} style={{ color: '#EF4444', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#F1F5F9', marginBottom: '2px' }}>
                Ошибка авторизации
              </div>
              <div style={{ fontSize: '13px', color: '#94A3B8' }}>
                {authError}
              </div>
            </div>
            <button
              onClick={() => setAuthError(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Hero */}
      <section style={{ paddingTop: '96px', paddingBottom: '96px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Subtle background glow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -60%)',
            width: '600px',
            height: '400px',
            background: 'radial-gradient(ellipse, rgba(0,173,216,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 24px', position: 'relative' }}>
          {/* Label */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 14px',
              borderRadius: '20px',
              border: '1px solid #1E2A3A',
              background: '#141824',
              fontSize: '12px',
              color: '#94A3B8',
              marginBottom: '32px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
            Интерактивная платформа обучения
          </div>

          {/* Heading */}
          <h1
            style={{
              fontSize: 'clamp(40px, 6vw, 72px)',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: '1.05',
              color: '#F1F5F9',
              marginBottom: '24px',
            }}
          >
            Изучай{' '}
            <span style={{ color: '#00ADD8' }}>Go</span>
            {' '}на практике
          </h1>

          {/* Subheading */}
          <p
            style={{
              fontSize: '19px',
              color: '#94A3B8',
              lineHeight: '1.65',
              maxWidth: '560px',
              margin: '0 auto 40px',
              fontWeight: 400,
            }}
          >
            Теория, задачи, квизы и проекты — всё для освоения Go с нуля до уровня уверенного разработчика
          </p>

          {/* CTA */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {user ? (
              <Link
                to="/theory"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '13px 28px',
                  borderRadius: '10px',
                  background: '#00ADD8',
                  color: '#0F111A',
                  fontWeight: 700,
                  fontSize: '15px',
                  textDecoration: 'none',
                  letterSpacing: '-0.01em',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#00C4F5')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#00ADD8')}
              >
                Продолжить обучение
                <ArrowRight size={16} />
              </Link>
            ) : (
              <button
                onClick={login}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '13px 28px',
                  borderRadius: '10px',
                  background: '#00ADD8',
                  border: 'none',
                  color: '#0F111A',
                  fontWeight: 700,
                  fontSize: '15px',
                  cursor: 'pointer',
                  letterSpacing: '-0.01em',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#00C4F5')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#00ADD8')}
              >
                Начать бесплатно
                <ArrowRight size={16} />
              </button>
            )}
            <Link
              to="/theory"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '13px 28px',
                borderRadius: '10px',
                background: 'transparent',
                border: '1px solid #253047',
                color: '#94A3B8',
                fontWeight: 600,
                fontSize: '15px',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '#00ADD8';
                (e.currentTarget as HTMLElement).style.color = '#F1F5F9';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '#253047';
                (e.currentTarget as HTMLElement).style.color = '#94A3B8';
              }}
            >
              Посмотреть теорию
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{ borderTop: '1px solid #1E2A3A', borderBottom: '1px solid #1E2A3A', background: '#141824' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0' }}>
          {stats.map((stat, i) => (
            <div
              key={i}
              style={{
                flex: '1 1 120px',
                textAlign: 'center',
                padding: '16px 24px',
                borderRight: i < stats.length - 1 ? '1px solid #1E2A3A' : 'none',
              }}
            >
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#00ADD8', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '13px', color: '#94A3B8', marginTop: '4px', fontWeight: 500 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.03em', marginBottom: '12px' }}>
              Всё необходимое для изучения Go
            </h2>
            <p style={{ fontSize: '16px', color: '#94A3B8' }}>
              Четыре формата обучения, которые дополняют друг друга
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {features.map((f) => (
              <Link
                key={f.to}
                to={f.to}
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    background: '#141824',
                    border: '1px solid #1E2A3A',
                    borderRadius: '12px',
                    padding: '28px',
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s, transform 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = f.color;
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#1E2A3A';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      background: `${f.color}15`,
                      border: `1px solid ${f.color}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: f.color,
                      marginBottom: '18px',
                    }}
                  >
                    {f.icon}
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#F1F5F9', marginBottom: '10px', letterSpacing: '-0.01em' }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: '1.65', marginBottom: '20px' }}>
                    {f.description}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: f.color, fontSize: '13px', fontWeight: 600 }}>
                    Открыть <ArrowRight size={14} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Code preview */}
      <section style={{ padding: '0 24px 80px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div
            style={{
              background: '#0D1117',
              border: '1px solid #1E2A3A',
              borderRadius: '14px',
              overflow: 'hidden',
            }}
          >
            {/* Window chrome */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #1E2A3A', background: '#141824', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444', opacity: 0.7 }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B', opacity: 0.7 }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981', opacity: 0.7 }} />
              <span style={{ marginLeft: '8px', fontSize: '12px', color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}>
                goroutine_example.go
              </span>
            </div>
            <pre
              style={{
                margin: 0,
                padding: '28px 32px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '14px',
                lineHeight: '1.7',
                overflowX: 'auto',
                color: '#e2e8f0',
              }}
            >
              <code>
                <span style={{ color: '#c792ea' }}>package</span>
                <span style={{ color: '#e2e8f0' }}> main{'\n\n'}</span>
                <span style={{ color: '#c792ea' }}>import</span>
                <span style={{ color: '#e2e8f0' }}> (</span>
                <span style={{ color: '#10B981' }}>{'\n    "fmt"'}</span>
                <span style={{ color: '#10B981' }}>{'\n    "sync"'}</span>
                <span style={{ color: '#e2e8f0' }}>{'\n)\n\n'}</span>
                <span style={{ color: '#c792ea' }}>func</span>
                <span style={{ color: '#00ADD8' }}> processOrder</span>
                <span style={{ color: '#e2e8f0' }}>(wg </span>
                <span style={{ color: '#F59E0B' }}>*sync.WaitGroup</span>
                <span style={{ color: '#e2e8f0' }}>, id </span>
                <span style={{ color: '#F59E0B' }}>int</span>
                <span style={{ color: '#e2e8f0' }}>) {'{'}</span>
                <span style={{ color: '#e2e8f0' }}>{'\n    '}</span>
                <span style={{ color: '#c792ea' }}>defer</span>
                <span style={{ color: '#e2e8f0' }}> wg.Done(){'\n    '}</span>
                <span style={{ color: '#94a3b8' }}>// Обработка заказа #{'{'}id{'}'}</span>
                <span style={{ color: '#e2e8f0' }}>{'\n    fmt.Printf('}</span>
                <span style={{ color: '#10B981' }}>"Заказ #%d обработан\n"</span>
                <span style={{ color: '#e2e8f0' }}>{', id)\n}'}</span>
                <span style={{ color: '#e2e8f0' }}>{'\n\n'}</span>
                <span style={{ color: '#c792ea' }}>func</span>
                <span style={{ color: '#00ADD8' }}> main</span>
                <span style={{ color: '#e2e8f0' }}>() {'{'}</span>
                <span style={{ color: '#e2e8f0' }}>{'\n    '}</span>
                <span style={{ color: '#c792ea' }}>var</span>
                <span style={{ color: '#e2e8f0' }}> wg sync.</span>
                <span style={{ color: '#F59E0B' }}>WaitGroup</span>
                <span style={{ color: '#e2e8f0' }}>{'\n\n    '}</span>
                <span style={{ color: '#c792ea' }}>for</span>
                <span style={{ color: '#e2e8f0' }}> i := </span>
                <span style={{ color: '#F59E0B' }}>1</span>
                <span style={{ color: '#e2e8f0' }}>; i {'<='} </span>
                <span style={{ color: '#F59E0B' }}>5</span>
                <span style={{ color: '#e2e8f0' }}>; i++ {'{'}</span>
                <span style={{ color: '#e2e8f0' }}>{'\n        '}wg.Add(</span>
                <span style={{ color: '#F59E0B' }}>1</span>
                <span style={{ color: '#e2e8f0' }}>){'\n        '}</span>
                <span style={{ color: '#c792ea' }}>go</span>
                <span style={{ color: '#e2e8f0' }}> processOrder(&wg, i){'\n    }'}</span>
                <span style={{ color: '#e2e8f0' }}>{'\n\n    '}wg.Wait(){'\n    '}fmt.Println(</span>
                <span style={{ color: '#10B981' }}>"Все заказы обработаны"</span>
                <span style={{ color: '#e2e8f0' }}>){'\n}'}</span>
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* Advantages */}
      <section style={{ padding: '0 24px 80px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.03em', marginBottom: '12px' }}>
              Почему GO Platform?
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {advantages.map((a, i) => (
              <div
                key={i}
                style={{
                  background: '#141824',
                  border: '1px solid #1E2A3A',
                  borderRadius: '10px',
                  padding: '24px',
                }}
              >
                <div style={{ color: '#00ADD8', marginBottom: '12px' }}>{a.icon}</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#F1F5F9', marginBottom: '8px' }}>{a.title}</div>
                <div style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.6' }}>{a.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      {!user && (
        <section style={{ padding: '0 24px 80px' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div
              style={{
                background: '#141824',
                border: '1px solid #253047',
                borderRadius: '16px',
                padding: '48px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: 'linear-gradient(90deg, transparent, #00ADD8, transparent)',
                }}
              />
              <h3 style={{ fontSize: '26px', fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.02em', marginBottom: '12px' }}>
                Готов начать?
              </h3>
              <p style={{ fontSize: '15px', color: '#94A3B8', marginBottom: '28px' }}>
                Войди через Google и начни учить Go прямо сейчас — бесплатно
              </p>
              <button
                onClick={login}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '13px 32px',
                  borderRadius: '10px',
                  background: '#00ADD8',
                  border: 'none',
                  color: '#0F111A',
                  fontWeight: 700,
                  fontSize: '15px',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#00C4F5')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#00ADD8')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Войти через Google
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #1E2A3A', padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
            <span style={{ fontWeight: 800, fontSize: '20px', color: '#00ADD8', letterSpacing: '-0.04em' }}>GO</span>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              {['Теория', 'Задачи', 'Квизы', 'Проекты'].map((item, i) => (
                <Link
                  key={i}
                  to={['theory', 'tasks', 'quiz', 'projects'][i] ? `/${['theory', 'tasks', 'quiz', 'projects'][i]}` : '/'}
                  style={{ fontSize: '13px', color: '#94A3B8', textDecoration: 'none' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#F1F5F9')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
          <div style={{ fontSize: '13px', color: '#64748B' }}>
            © 2026 GO Platform — Интерактивная платформа изучения Go
          </div>
        </div>
      </footer>
    </div>
  );
}
