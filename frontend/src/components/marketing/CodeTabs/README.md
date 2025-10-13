# CodeTabs Component

A tabbed code snippet component with syntax highlighting, copy-to-clipboard functionality, and full keyboard navigation support.

## Features

- ✅ Syntax highlighting with react-syntax-highlighter
- ✅ Copy-to-clipboard with visual confirmation
- ✅ Full keyboard navigation (Arrow keys, Home, End)
- ✅ Accessible ARIA attributes
- ✅ Respects `prefers-reduced-motion`
- ✅ Responsive horizontal scroll for mobile
- ✅ Visible focus indicators

## Usage

### Basic Example

```tsx
import { CodeTabs, startCallSnippets } from './components/marketing/CodeTabs';

function MyComponent() {
  return (
    <CodeTabs tabs={startCallSnippets} />
  );
}
```

### Custom Tabs

```tsx
import { CodeTabs, CodeTab } from './components/marketing/CodeTabs';

const customTabs: CodeTab[] = [
  {
    id: 'javascript',
    label: 'JavaScript',
    language: 'javascript',
    code: `console.log('Hello World');`,
  },
  {
    id: 'python',
    label: 'Python',
    language: 'python',
    code: `print('Hello World')`,
  },
];

function MyComponent() {
  return (
    <CodeTabs 
      tabs={customTabs} 
      defaultTab="javascript"
    />
  );
}
```

## Props

### CodeTabsProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tabs` | `CodeTab[]` | required | Array of code tabs to display |
| `defaultTab` | `string` | first tab id | ID of the tab to show by default |
| `className` | `string` | `''` | Additional CSS classes |

### CodeTab

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique identifier for the tab |
| `label` | `string` | Display label for the tab button |
| `language` | `string` | Language for syntax highlighting (e.g., 'typescript', 'python', 'bash') |
| `code` | `string` | Code content to display |

## Keyboard Navigation

- **Tab**: Move focus between tabs and copy button
- **Arrow Left/Right**: Navigate between tabs
- **Home**: Jump to first tab
- **End**: Jump to last tab
- **Enter/Space**: Activate focused tab or button

## Accessibility

The component follows WAI-ARIA tab panel pattern:

- Proper `role` attributes (`tablist`, `tab`, `tabpanel`)
- `aria-selected` indicates active tab
- `aria-controls` links tabs to panels
- `aria-labelledby` links panels to tabs
- Visible focus indicators (2px ring)
- Keyboard navigation support

## Supported Languages

The component uses `react-syntax-highlighter` with the `vscDarkPlus` theme. Supported languages include:

- TypeScript/JavaScript (`typescript`, `javascript`)
- Python (`python`)
- Bash/Shell (`bash`, `shell`)
- JSX/TSX (`jsx`, `tsx`)
- And many more...

See [react-syntax-highlighter documentation](https://github.com/react-syntax-highlighter/react-syntax-highlighter) for full language support.

## Styling

The component uses Tailwind CSS with theme variables. Key classes:

- `border-accent-primary`: Active tab border
- `text-accent-primary`: Active tab text
- `bg-background-tertiary`: Code block background
- `border-border-primary`: Borders

## Performance

- Code blocks are rendered with `hidden` attribute when inactive
- Syntax highlighter is only active for visible panels
- Respects `prefers-reduced-motion` for animations
- Optimized re-renders with proper React patterns

## Example: Pre-built Snippets

The component comes with pre-built "start a call" code snippets:

```tsx
import { CodeTabs, startCallSnippets } from './components/marketing/CodeTabs';

// startCallSnippets includes:
// - TypeScript
// - Python
// - cURL
// - React

<CodeTabs tabs={startCallSnippets} />
```
