/** @jsxImportSource react */
import type { Logo } from '../components/marketing/LogosStrip';
import type { KPIStatProps } from '../components/marketing/KPIBand';
import type { Solution } from '../components/marketing/Solutions';
import type { ExplainerStep } from '../components/marketing/Explainer';

/**
 * Sample logos for the LogosStrip component
 * Replace with actual company/technology logos
 */
export const sampleLogos: Logo[] = [
  {
    name: 'React',
    src: '/logos/react.svg',
    srcDark: '/logos/react-dark.svg',
    alt: 'React',
    width: 120,
    height: 40,
  },
  {
    name: 'TypeScript',
    src: '/logos/typescript.svg',
    srcDark: '/logos/typescript-dark.svg',
    alt: 'TypeScript',
    width: 120,
    height: 40,
  },
  {
    name: 'Python',
    src: '/logos/python.svg',
    srcDark: '/logos/python-dark.svg',
    alt: 'Python',
    width: 120,
    height: 40,
  },
  {
    name: 'Node.js',
    src: '/logos/nodejs.svg',
    srcDark: '/logos/nodejs-dark.svg',
    alt: 'Node.js',
    width: 120,
    height: 40,
  },
];

/**
 * KPI statistics for the KPIBand component
 */
export const kpiStats: Omit<KPIStatProps, 'isVisible'>[] = [
  {
    label: 'Calls Processed',
    value: 150000000,
    format: 'abbreviated',
    suffix: '+',
  },
  {
    label: 'Assistants Launched',
    value: 1500000,
    format: 'abbreviated',
    suffix: '+',
  },
  {
    label: 'Developers',
    value: 350000,
    format: 'abbreviated',
    suffix: '+',
  },
];

/**
 * Solutions data for the Solutions component
 */
export const solutionsData: Solution[] = [
  {
    id: 'inbound',
    title: 'Inbound',
    description:
      'Handle incoming customer calls with intelligent routing, natural conversation, and seamless handoff to human agents when needed.',
    nodes: [
      { id: 'receive', label: 'Receive Call', type: 'start' },
      { id: 'greet', label: 'Greet Customer', type: 'action' },
      { id: 'identify', label: 'Identify Intent', type: 'action' },
      { id: 'check', label: 'Can Handle?', type: 'condition' },
      { id: 'resolve', label: 'Resolve Issue', type: 'action' },
      { id: 'transfer', label: 'Transfer to Agent', type: 'action' },
      { id: 'end', label: 'End Call', type: 'end' },
    ],
    connections: [
      { from: 'receive', to: 'greet' },
      { from: 'greet', to: 'identify' },
      { from: 'identify', to: 'check' },
      { from: 'check', to: 'resolve', label: 'Yes' },
      { from: 'check', to: 'transfer', label: 'No' },
      { from: 'resolve', to: 'end' },
      { from: 'transfer', to: 'end' },
    ],
    caseStudyUrl: '/case-studies/inbound',
    tryNowUrl: '/demo/inbound',
  },
  {
    id: 'outbound',
    title: 'Outbound',
    description:
      'Make proactive calls for sales, surveys, reminders, and follow-ups with personalized messaging and intelligent scheduling.',
    nodes: [
      { id: 'schedule', label: 'Schedule Call', type: 'start' },
      { id: 'dial', label: 'Dial Number', type: 'action' },
      { id: 'connected', label: 'Connected?', type: 'condition' },
      { id: 'deliver', label: 'Deliver Message', type: 'action' },
      { id: 'collect', label: 'Collect Response', type: 'action' },
      { id: 'retry', label: 'Schedule Retry', type: 'action' },
      { id: 'end', label: 'End Call', type: 'end' },
    ],
    connections: [
      { from: 'schedule', to: 'dial' },
      { from: 'dial', to: 'connected' },
      { from: 'connected', to: 'deliver', label: 'Yes' },
      { from: 'connected', to: 'retry', label: 'No' },
      { from: 'deliver', to: 'collect' },
      { from: 'collect', to: 'end' },
      { from: 'retry', to: 'end' },
    ],
    caseStudyUrl: '/case-studies/outbound',
    tryNowUrl: '/demo/outbound',
  },
];

/**
 * Icon components for explainer steps
 */
const WorkflowIcon = () => (
  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
    />
  </svg>
);

const PlugIcon = () => (
  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 10V3L4 14h7v7l9-11h-7z"
    />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

/**
 * Explainer steps data
 */
export const explainerSteps: ExplainerStep[] = [
  {
    id: 'choose',
    title: 'Choose your workflow',
    description:
      'Select from pre-built templates or create custom workflows tailored to your specific use case. Configure your assistant in minutes.',
    icon: <WorkflowIcon />,
  },
  {
    id: 'plugin',
    title: 'Plug it in',
    description:
      'Integrate with your existing systems using our RESTful API or SDKs. Connect to your CRM, database, or any external tool.',
    icon: <PlugIcon />,
  },
  {
    id: 'done',
    title: 'Done',
    description:
      'Your AI assistant is ready to handle calls. Monitor performance, gather insights, and iterate based on real-world data.',
    icon: <CheckIcon />,
  },
];
