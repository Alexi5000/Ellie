import React, { useState } from 'react';
import { useReducedMotion } from '../../../hooks';
import { FlowDiagram, FlowNode, FlowConnection } from './FlowDiagram';

export interface Solution {
  id: 'inbound' | 'outbound';
  title: string;
  description: string;
  nodes: FlowNode[];
  connections: FlowConnection[];
  caseStudyUrl: string;
  tryNowUrl: string;
}

export interface SolutionsProps {
  solutions: Solution[];
  defaultSolution?: 'inbound' | 'outbound';
  className?: string;
}

/**
 * Solutions component with tabbed interface
 * 
 * Features:
 * - Tabbed interface for Inbound/Outbound solutions
 * - Flow diagram visualization for each solution
 * - Smooth transitions between tabs
 * - Respects prefers-reduced-motion for accessibility
 * - Responsive layout with mobile support
 * - Call-to-action buttons for case studies and demos
 * 
 * @example
 * ```tsx
 * <Solutions
 *   solutions={[
 *     {
 *       id: 'inbound',
 *       title: 'Inbound Calls',
 *       description: 'Handle incoming customer calls...',
 *       nodes: [...],
 *       connections: [...],
 *       caseStudyUrl: '/case-studies/inbound',
 *       tryNowUrl: '/demo/inbound'
 *     }
 *   ]}
 *   defaultSolution="inbound"
 * />
 * ```
 */
export const Solutions: React.FC<SolutionsProps> = ({
  solutions,
  defaultSolution = 'inbound',
  className = '',
}) => {
  const [activeSolution, setActiveSolution] = useState<'inbound' | 'outbound'>(
    defaultSolution
  );
  const prefersReducedMotion = useReducedMotion();

  const handleTabClick = (solutionId: 'inbound' | 'outbound') => {
    setActiveSolution(solutionId);
  };

  const handleKeyDown = (
    event: React.KeyboardEvent,
    solutionId: 'inbound' | 'outbound'
  ) => {
    const currentIndex = solutions.findIndex(s => s.id === solutionId);
    let nextIndex = currentIndex;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : solutions.length - 1;
        break;
      case 'ArrowRight':
        event.preventDefault();
        nextIndex = currentIndex < solutions.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        nextIndex = solutions.length - 1;
        break;
      default:
        return;
    }

    const nextSolution = solutions[nextIndex];
    if (nextSolution) {
      setActiveSolution(nextSolution.id);
    }
  };

  const transitionClass = prefersReducedMotion
    ? ''
    : 'transition-all duration-300 ease-in-out';

  return (
    <section
      className={`w-full py-12 sm:py-16 md:py-20 ${className}`}
      aria-label="Solutions"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
            Solutions for Every Use Case
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Whether you're handling inbound customer calls or making outbound
            campaigns, Ellie adapts to your workflow.
          </p>
        </div>

        {/* Tab List */}
        <div
          role="tablist"
          aria-label="Solution types"
          className="flex justify-center space-x-2 mb-8"
        >
          {solutions.map((solution) => {
            const isActive = solution.id === activeSolution;
            return (
              <button
                key={solution.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${solution.id}`}
                id={`tab-${solution.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => handleTabClick(solution.id)}
                onKeyDown={(e) => handleKeyDown(e, solution.id)}
                className={`
                  px-6 py-3 text-base font-medium rounded-lg ${transitionClass}
                  focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2
                  ${
                    isActive
                      ? 'bg-accent-primary text-white'
                      : 'bg-background-secondary text-text-secondary hover:text-text-primary hover:bg-background-tertiary'
                  }
                `}
              >
                {solution.title}
              </button>
            );
          })}
        </div>

        {/* Tab Panels */}
        {solutions.map((solution) => {
          const isActive = solution.id === activeSolution;
          return (
            <div
              key={solution.id}
              role="tabpanel"
              id={`panel-${solution.id}`}
              aria-labelledby={`tab-${solution.id}`}
              aria-label={solution.title}
              hidden={!isActive}
              className={`
                ${isActive ? 'block' : 'hidden'}
                ${prefersReducedMotion ? '' : 'animate-fadeIn'}
              `}
            >
              {/* Description */}
              <div className="mb-8 text-center">
                <p className="text-base sm:text-lg text-text-secondary max-w-3xl mx-auto">
                  {solution.description}
                </p>
              </div>

              {/* Flow Diagram */}
              <div className="mb-8 bg-background-secondary rounded-xl p-6 sm:p-8 border border-border-primary">
                <FlowDiagram
                  nodes={solution.nodes}
                  connections={solution.connections}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a
                  href={solution.caseStudyUrl}
                  className={`
                    inline-flex items-center justify-center
                    px-6 py-3 text-base font-medium rounded-lg
                    bg-background-secondary text-text-primary
                    border border-border-primary
                    hover:bg-background-tertiary hover:border-accent-primary
                    focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2
                    ${transitionClass}
                  `}
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Case Study
                </a>
                <a
                  href={solution.tryNowUrl}
                  className={`
                    inline-flex items-center justify-center
                    px-6 py-3 text-base font-medium rounded-lg
                    bg-accent-primary text-white
                    hover:bg-accent-secondary
                    focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2
                    ${transitionClass}
                  `}
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Try It Now
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
