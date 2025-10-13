import { CodeTab } from './CodeTabs';

/**
 * Code snippets for "start a call" examples
 * Uses placeholder values for API keys and assistant IDs
 */
export const startCallSnippets: CodeTab[] = [
  {
    id: 'typescript',
    label: 'TypeScript',
    language: 'typescript',
    code: `import { EllieClient } from '@ellie/sdk';

const client = new EllieClient({
  apiKey: process.env.ELLIE_API_KEY,
});

const call = await client.calls.create({
  assistantId: 'asst_abc123',
  to: '+1234567890',
});

console.log('Call started:', call.id);`,
  },
  {
    id: 'python',
    label: 'Python',
    language: 'python',
    code: `from ellie import EllieClient
import os

client = EllieClient(
    api_key=os.environ.get("ELLIE_API_KEY")
)

call = client.calls.create(
    assistant_id="asst_abc123",
    to="+1234567890"
)

print(f"Call started: {call.id}")`,
  },
  {
    id: 'curl',
    label: 'cURL',
    language: 'bash',
    code: `curl https://api.ellie.ai/v1/calls \\
  -H "Authorization: Bearer $ELLIE_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "assistant_id": "asst_abc123",
    "to": "+1234567890"
  }'`,
  },
  {
    id: 'react',
    label: 'React',
    language: 'tsx',
    code: `import { useEllie } from '@ellie/react';

function CallButton() {
  const { startCall, isConnected } = useEllie({
    apiKey: process.env.REACT_APP_ELLIE_API_KEY,
  });

  return (
    <button onClick={() => startCall('asst_abc123')}>
      {isConnected ? 'Connected' : 'Start Call'}
    </button>
  );
}`,
  },
];
