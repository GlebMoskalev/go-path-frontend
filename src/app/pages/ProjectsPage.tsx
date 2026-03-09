import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { CheckCircle2, Circle, ChevronRight, Tag } from 'lucide-react';
import { fetchProjects, type ProjectSummary } from '../api';
import { DifficultyBadge } from '../components/DifficultyBadge';
import { ProgressBar } from '../components/ProgressBar';
import { AnimatedSection, StaggerContainer, StaggerItem } from '../components/AnimatedSection';

export function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProjects()
      .then(setProjects)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div style={{ background: 'var(--go-bg)', minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '14px', color: 'var(--go-muted)' }}>Загрузка...</div>
      </div>
    );
  }
  return (
    <div style={{ background: 'var(--go-bg)', minHeight: 'calc(100vh - 56px)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--go-text)', letterSpacing: '-0.03em', marginBottom: '8px' }}>
            Проекты
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--go-muted)' }}>
            Создавайте реальные приложения на Go пошагово — от идеи до рабочего кода
          </p>
        </div>

        {/* Projects grid */}
        <StaggerContainer style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {projects.map((project) => {
            const solved = project.solved_count || 0;
            const pct = project.steps.length > 0 ? (solved / project.steps.length) * 100 : 0;

            return (
              <StaggerItem key={project.slug}>
                <div
                  style={{
                    background: 'var(--go-surface)',
                    border: '1px solid var(--go-border)',
                    borderRadius: '14px',
                    overflow: 'hidden',
                  }}
                >
                  {/* Project header */}
                  <div style={{ padding: '24px', borderBottom: '1px solid var(--go-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--go-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                          Проект {project.order}
                        </div>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--go-text)', marginBottom: '6px', letterSpacing: '-0.01em' }}>
                          {project.title}
                        </h2>
                        <p style={{ fontSize: '14px', color: 'var(--go-muted)' }}>{project.description}</p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--go-cyan)', letterSpacing: '-0.02em' }}>
                          {solved}/{project.steps.length}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--go-muted)' }}>шагов</div>
                      </div>
                    </div>
                    <ProgressBar
                      value={pct}
                      total={project.steps.length}
                      completed={solved}
                      showLabel
                      height={5}
                    />
                  </div>

                  {/* Steps */}
                  <div style={{ padding: '8px' }}>
                    {project.steps.map((step) => (
                      <Link
                        key={step.slug}
                        to={`/projects/${project.slug}/${step.slug}`}
                        style={{ textDecoration: 'none' }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--go-surface-2)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          {step.solved ? (
                            <CheckCircle2 size={18} style={{ color: 'var(--go-green)', flexShrink: 0 }} />
                          ) : (
                            <Circle size={18} style={{ color: 'var(--go-border-2)', flexShrink: 0 }} />
                          )}

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--go-text-secondary)', marginBottom: '2px' }}>
                              {step.title}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--go-muted)' }}>
                              {step.description}
                            </div>
                          </div>

                          <DifficultyBadge difficulty={step.difficulty} size="sm" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </div>
  );
}
