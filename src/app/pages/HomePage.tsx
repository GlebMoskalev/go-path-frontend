import { Link } from 'react-router';
import { BookOpen, Code2, Brain, FolderGit2, ArrowRight, CheckCircle, Zap, Trophy, Users, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { AnimatedSection, StaggerContainer, StaggerItem } from '../components/AnimatedSection';
import { CodeBlock } from '../components/CodeBlock';

const features = [
  { icon: <BookOpen size={22} />, title: 'Теория', description: 'Структурированные уроки по всем аспектам Go: от основ синтаксиса до продвинутой конкурентности.', to: '/theory', color: 'var(--go-cyan)' },
  { icon: <Code2 size={22} />, title: 'Задачи', description: 'Практические задачи с проверкой в реальном времени. Встроенный редактор кода.', to: '/tasks', color: 'var(--go-green)' },
  { icon: <Brain size={22} />, title: 'Квизы', description: 'Проверьте знания через вопросы с вариантами ответов и мгновенной обратной связью.', to: '/quiz', color: 'var(--go-amber)' },
  { icon: <FolderGit2 size={22} />, title: 'Проекты', description: 'Пошаговое создание реальных Go-приложений: REST API, CLI-инструменты.', to: '/projects', color: '#c792ea' },
];

const advantages = [
  { icon: <Zap size={18} />, title: 'Быстрый старт', desc: 'Никаких установок. Пишите и проверяйте код прямо в браузере.' },
  { icon: <CheckCircle size={18} />, title: 'Проверка кода', desc: 'Автоматические тесты дают мгновенную обратную связь.' },
  { icon: <Trophy size={18} />, title: 'Прогресс', desc: 'Отслеживайте прогресс по главам, задачам и проектам.' },
  { icon: <Users size={18} />, title: 'Реальный контент', desc: 'Материал из реальных Go-паттернов и лучших практик.' },
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
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    if (error) {
      setAuthError(error);
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => setAuthError(null), 5000);
    }
  }, []);

  return (
    <div style={{ background: 'var(--go-bg)', minHeight: '100vh' }}>
      {/* Auth error toast */}
      <AnimatePresence>
        {authError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)',
              zIndex: 1000, maxWidth: '500px', width: '90%',
            }}
          >
            <div style={{
              background: 'var(--go-surface)', border: '1px solid var(--go-red)',
              borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center',
              gap: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            }}>
              <XCircle size={20} style={{ color: 'var(--go-red)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--go-text)', marginBottom: '2px' }}>Ошибка авторизации</div>
                <div style={{ fontSize: '13px', color: 'var(--go-muted)' }}>{authError}</div>
              </div>
              <button onClick={() => setAuthError(null)} style={{ background: 'none', border: 'none', color: 'var(--go-muted)', cursor: 'pointer', padding: '4px' }}>
                <XCircle size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero */}
      <section style={{ paddingTop: '100px', paddingBottom: '100px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -60%)',
          width: '700px', height: '500px',
          background: 'radial-gradient(ellipse, var(--go-cyan-muted) 0%, transparent 70%)',
          pointerEvents: 'none', opacity: 0.6,
        }} />

        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 24px', position: 'relative' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '5px 14px', borderRadius: '20px', border: '1px solid var(--go-border)',
              background: 'var(--go-surface)', fontSize: '12px', color: 'var(--go-muted)',
              marginBottom: '32px', letterSpacing: '0.05em', textTransform: 'uppercase',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--go-green)', display: 'inline-block' }} />
              Интерактивная платформа обучения
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 800, letterSpacing: '-0.04em',
              lineHeight: '1.05', color: 'var(--go-text)', marginBottom: '24px',
            }}
          >
            Изучай{' '}
            <span style={{
              background: 'linear-gradient(135deg, var(--go-cyan), #00E5FF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Go</span>
            {' '}на практике
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              fontSize: '19px', color: 'var(--go-muted)', lineHeight: '1.65',
              maxWidth: '560px', margin: '0 auto 40px', fontWeight: 400,
            }}
          >
            Теория, задачи, квизы и проекты — всё для освоения Go с нуля до уровня уверенного разработчика
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            {user ? (
              <Link to="/theory" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 28px',
                borderRadius: '12px', background: 'var(--go-cyan)', color: '#fff', fontWeight: 700,
                fontSize: '15px', textDecoration: 'none', transition: 'all 0.2s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,173,216,0.25)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                Продолжить обучение <ArrowRight size={16} />
              </Link>
            ) : (
              <button onClick={login} style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 28px',
                borderRadius: '12px', background: 'var(--go-cyan)', border: 'none', color: '#fff',
                fontWeight: 700, fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,173,216,0.25)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                Начать бесплатно <ArrowRight size={16} />
              </button>
            )}
            <Link to="/theory" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 28px',
              borderRadius: '12px', background: 'transparent', border: '1px solid var(--go-border-2)',
              color: 'var(--go-muted)', fontWeight: 600, fontSize: '15px', textDecoration: 'none', transition: 'all 0.2s',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--go-cyan)'; e.currentTarget.style.color = 'var(--go-text)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--go-border-2)'; e.currentTarget.style.color = 'var(--go-muted)'; }}
            >
              Посмотреть теорию
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <AnimatedSection>
        <section style={{ borderTop: '1px solid var(--go-border)', borderBottom: '1px solid var(--go-border)', background: 'var(--go-surface)' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px', display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
            {stats.map((stat, i) => (
              <div key={i} style={{
                flex: '1 1 120px', textAlign: 'center', padding: '16px 24px',
                borderRight: i < stats.length - 1 ? '1px solid var(--go-border)' : 'none',
              }}>
                <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--go-cyan)', letterSpacing: '-0.03em', lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: '13px', color: 'var(--go-muted)', marginTop: '4px', fontWeight: 500 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </section>
      </AnimatedSection>

      {/* Features */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <AnimatedSection style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--go-text)', letterSpacing: '-0.03em', marginBottom: '12px' }}>
              Всё необходимое для изучения Go
            </h2>
            <p style={{ fontSize: '16px', color: 'var(--go-muted)' }}>Четыре формата обучения, которые дополняют друг друга</p>
          </AnimatedSection>

          <StaggerContainer style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {features.map((f) => (
              <StaggerItem key={f.to}>
                <Link to={f.to} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                  <div style={{
                    background: 'var(--go-surface)', border: '1px solid var(--go-border)',
                    borderRadius: '14px', padding: '28px', height: '100%', cursor: 'pointer',
                    transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = f.color; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--go-border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '12px',
                      background: 'var(--go-surface-2)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: f.color, marginBottom: '18px',
                    }}>
                      {f.icon}
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--go-text)', marginBottom: '10px', letterSpacing: '-0.01em' }}>{f.title}</h3>
                    <p style={{ fontSize: '14px', color: 'var(--go-muted)', lineHeight: '1.65', marginBottom: '20px' }}>{f.description}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: f.color, fontSize: '13px', fontWeight: 600 }}>
                      Открыть <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Code preview */}
      <AnimatedSection variant="scaleIn" style={{ padding: '0 24px 80px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <CodeBlock
            filename="goroutine_example.go"
            language="go"
            code={`package main

import (
    "fmt"
    "sync"
)

func processOrder(wg *sync.WaitGroup, id int) {
    defer wg.Done()
    fmt.Printf("Заказ #%d обработан\\n", id)
}

func main() {
    var wg sync.WaitGroup

    for i := 1; i <= 5; i++ {
        wg.Add(1)
        go processOrder(&wg, i)
    }

    wg.Wait()
    fmt.Println("Все заказы обработаны")
}`}
          />
        </div>
      </AnimatedSection>

      {/* Advantages */}
      <section style={{ padding: '0 24px 80px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <AnimatedSection style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--go-text)', letterSpacing: '-0.03em', marginBottom: '12px' }}>
              Почему Go Path?
            </h2>
          </AnimatedSection>
          <StaggerContainer style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {advantages.map((a, i) => (
              <StaggerItem key={i}>
                <div style={{
                  background: 'var(--go-surface)', border: '1px solid var(--go-border)',
                  borderRadius: '12px', padding: '24px', transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ color: 'var(--go-cyan)', marginBottom: '12px' }}>{a.icon}</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--go-text)', marginBottom: '8px' }}>{a.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--go-muted)', lineHeight: '1.6' }}>{a.desc}</div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <AnimatedSection variant="scaleIn" style={{ padding: '0 24px 80px' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{
              background: 'var(--go-surface)', border: '1px solid var(--go-border-2)',
              borderRadius: '20px', padding: '48px', textAlign: 'center', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                background: 'linear-gradient(90deg, transparent, var(--go-cyan), transparent)',
              }} />
              <h3 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--go-text)', letterSpacing: '-0.02em', marginBottom: '12px' }}>Готов начать?</h3>
              <p style={{ fontSize: '15px', color: 'var(--go-muted)', marginBottom: '28px' }}>
                Войди через Google и начни учить Go прямо сейчас — бесплатно
              </p>
              <button onClick={login} style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 32px',
                borderRadius: '12px', background: 'var(--go-cyan)', border: 'none', color: '#fff',
                fontWeight: 700, fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,173,216,0.25)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                Войти через Google
              </button>
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--go-border)', padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
            <span style={{ fontWeight: 800, fontSize: '20px', letterSpacing: '-0.04em' }}>
              <span style={{ color: 'var(--go-cyan)' }}>GO</span>
              <span style={{ color: 'var(--go-text)' }}>PATH</span>
            </span>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              {[{ label: 'Теория', to: '/theory' }, { label: 'Задачи', to: '/tasks' }, { label: 'Квизы', to: '/quiz' }, { label: 'Проекты', to: '/projects' }].map((item) => (
                <Link key={item.to} to={item.to} style={{ fontSize: '13px', color: 'var(--go-muted)', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--go-text)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--go-muted)')}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--go-subtle)' }}>
            © 2026 Go Path — Интерактивная платформа изучения Go
          </div>
        </div>
      </footer>
    </div>
  );
}
