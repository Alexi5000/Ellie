import React, { useState, useRef, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useReducedMotion, useClipboard } from '../../../hooks';

export interface CodeTab {
  id: string;
  label: string;
  language: string;
  code: string;
}

export interface CodeTabsProps {
  tabs: CodeTab[];
  defaultTab?: string;
  className?: string;
}

/**
 * CodeTabs component with syntax highlighting
 * 
 * Features:
 * - Syntax highlighting with react-syntax-highlighter
 * - Copy-to-clipboard functionality with confirmation
 * - Keyboard navigation with arrow keys
 * - Visible focus indicators
 * - Responsive horizontal scroll for mobile
 * - Accessible tab panel pattern
 * 
 * @example
 * ```tsx
 * <CodeTabs
 *   tabs={[
 *     { id: 'ts', label: 'TypeScript', language: 'typescript', code: '...' },
 *     { id: 'py', label: 'Python', language: 'python', code: '...' }
 *   ]}
 *   defaultTab="ts"
 * />
 * ```
 */
export const CodeTabs: React.FC<CodeTabsProps> = ({
  tabs,
  defaultTab,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  const { copied, copyToClipboard } = useClipboard();
  const prefersReducedMotion = useReducedMotion();
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const activeTabData = tabs.find(tab => tab.id === activeTab) || tabs[0];

  useEffect(() => {
    // Reset to first tab if active tab is removed
    if (!tabs.find(tab => tab.id === activeTab)) {
      setActiveTab(tabs[0]?.id);
    }
  }, [tabs, activeTab]);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleKeyDown = (event: React.KeyboardEvent, currentTabId: string) => {
    const currentIndex = tabs.findIndex(tab => tab.id === currentTabId);
    let nextIndex = currentIndex;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        break;
      case 'ArrowRight':
        event.preventDefault();
        nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        nextIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    const nextTab = tabs[nextIndex];
    if (nextTab) {
      setActiveTab(nextTab.id);
      tabRefs.current.get(nextTab.id)?.focus();
    }
  };

  const handleCopy = async () => {
    await copyToClipboard(activeTabData.code);
  };

  const transitionClass = prefersReducedMotion ? '' : 'transition-all duration-200';

  return (
    <div className={`w-full ${className}`}>
      {/* Tab List */}
      <div
        role="tablist"
        aria-label="Code examples"
        className="flex space-x-1 border-b border-border-primary overflow-x-auto scrollbar-thin scrollbar-thumb-border-secondary scrollbar-track-transparent"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                if (el) {
                  tabRefs.current.set(tab.id, el);
                } else {
                  tabRefs.current.delete(tab.id);
                }
              }}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleTabClick(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, tab.id)}
              className={`
                px-4 py-2 text-sm font-medium whitespace-nowrap
                border-b-2 ${transitionClass}
                focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2
                ${
                  isActive
                    ? 'border-accent-primary text-accent-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-secondary'
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="relative mt-4">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <div
              key={tab.id}
              role="tabpanel"
              id={`panel-${tab.id}`}
              aria-labelledby={`tab-${tab.id}`}
              hidden={!isActive}
              className={`
                ${isActive ? 'block' : 'hidden'}
                ${prefersReducedMotion ? '' : 'animate-fadeIn'}
              `}
            >
              {/* Copy Button */}
              <div className="absolute top-2 right-2 z-10">
                <button
                  onClick={handleCopy}
                  aria-label={copied ? 'Copied to clipboard' : 'Copy code to clipboard'}
                  className={`
                    px-3 py-1.5 text-xs font-medium rounded-md
                    bg-background-secondary/80 backdrop-blur-sm
                    text-text-secondary hover:text-text-primary
                    border border-border-primary
                    focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2
                    ${transitionClass}
                  `}
                >
                  {copied ? (
                    <span className="flex items-center space-x-1">
                      <svg
                        className="w-4 h-4 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>Copied!</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      <span>Copy</span>
                    </span>
                  )}
                </button>
              </div>

              {/* Code Block */}
              <div className="rounded-lg overflow-hidden border border-border-primary">
                <SyntaxHighlighter
                  language={tab.language}
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    padding: '1.5rem',
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                    background: 'var(--color-bg-tertiary)',
                  }}
                  showLineNumbers={false}
                  wrapLines={true}
                  wrapLongLines={true}
                >
                  {tab.code}
                </SyntaxHighlighter>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
