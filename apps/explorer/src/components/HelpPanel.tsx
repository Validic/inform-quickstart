'use client';

import { useState, useEffect } from 'react';
import { User, Users, Database, RefreshCw, Sparkles } from 'lucide-react';
import { ServiceType } from '@/types';

interface HelpPanelProps {
  selectedService?: ServiceType;
}

interface HelpTab {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  category: string;
}

const apiHelpTabs: HelpTab[] = [
  { id: 'get-user', name: 'Get User', icon: <User className="w-4 h-4" />, color: '#0066CC', category: 'users' },
  { id: 'get-users', name: 'Get Users', icon: <Users className="w-4 h-4" />, color: '#0088EE', category: 'users' },
  { id: 'get-user-data', name: 'Get User Data', icon: <Database className="w-4 h-4" />, color: '#00AAFF', category: 'data' },
  { id: 'replay-stream', name: 'Replay Stream', icon: <RefreshCw className="w-4 h-4" />, color: '#00CCFF', category: 'data' },
  { id: 'generate-data', name: 'Generate Data', icon: <Sparkles className="w-4 h-4" />, color: '#22c55e', category: 'data' },
];

const apiCategories = [
  { id: 'users', name: 'Users' },
  { id: 'data', name: 'Data' },
];

export default function HelpPanel({ selectedService }: HelpPanelProps) {
  const helpTabs = apiHelpTabs;
  const categories = apiCategories;

  const [activeTab, setActiveTab] = useState<string>(selectedService || 'get-user');

  // Reset to default tab when selected service changes
  useEffect(() => {
    setActiveTab(selectedService || 'get-user');
  }, [selectedService]);

  return (
    <div className="h-full flex">
      {/* Left Column - Navigation */}
      <div className="w-48 flex-shrink-0 border-r border-blue-500/20 p-3 overflow-y-auto">
        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category.id}>
              <div className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>
                {category.name}
              </div>
              <div className="space-y-0.5">
                {helpTabs
                  .filter((tab) => tab.category === category.id)
                  .map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-all ${
                        activeTab === tab.id
                          ? 'bg-blue-500/20'
                          : 'hover:bg-gray-700/30'
                      }`}
                      style={{ color: activeTab === tab.id ? tab.color : 'var(--text-secondary)' }}
                    >
                      {tab.icon}
                      <span className="flex-1 text-left text-xs">{tab.name}</span>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column - Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <HelpContent helpId={activeTab} />
      </div>
    </div>
  );
}

function HelpContent({ helpId }: { helpId: string }) {
  const content = helpGuides[helpId];

  if (!content) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Help content not available for this topic.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Title & Description */}
      <div>
        <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          {content.title}
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {content.description}
        </p>
      </div>

      {/* Prerequisites */}
      {content.prerequisites && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-yellow-400 mb-1.5">Prerequisites</h4>
          <ul className="text-xs space-y-0.5" style={{ color: 'var(--text-secondary)' }}>
            {content.prerequisites.map((prereq, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-yellow-400 mt-0.5">•</span>
                {prereq}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Steps */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
          Step-by-Step
        </h4>
        <div className="space-y-3">
          {content.steps.map((step, index) => (
            <div key={index} className="flex gap-3">
              <div
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'var(--accent-color, #3b82f6)', color: 'white' }}
              >
                {index + 1}
              </div>
              <div className="flex-1 pt-0.5">
                <h5 className="text-sm font-medium mb-0.5" style={{ color: 'var(--text-primary)' }}>
                  {step.title}
                </h5>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {step.description}
                </p>
                {step.tip && (
                  <p className="text-xs mt-1.5 px-2 py-1.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300">
                    💡 {step.tip}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Example Response */}
      {content.exampleNote && (
        <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
          <h4 className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
            What to Expect
          </h4>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {content.exampleNote}
          </p>
        </div>
      )}
    </div>
  );
}

interface HelpGuide {
  title: string;
  description: string;
  prerequisites?: string[];
  steps: {
    title: string;
    description: string;
    tip?: string;
  }[];
  exampleNote?: string;
}

const helpGuides: Record<string, HelpGuide> = {
  'get-user': {
    title: 'Get User',
    description: 'Retrieve detailed information about a specific user in your organization, including their marketplace token, mobile token, and location data.',
    prerequisites: [
      'Valid Organization ID configured',
      'Valid Auth Token configured',
      'User ID of an existing user',
    ],
    steps: [
      {
        title: 'Configure Your Environment',
        description: 'Ensure your Core API URL, Organization ID, and Auth Token are set in the Configuration panel.',
        tip: 'The health indicator should be green.',
      },
      {
        title: 'Enter the User ID',
        description: 'In the API Setup panel, enter the User ID of the user you want to retrieve.',
      },
      {
        title: 'Execute the Request',
        description: 'Click the "Execute" button to send the GET request.',
      },
      {
        title: 'View the Response',
        description: 'The Response panel will display the user\'s information including their marketplace URL.',
      },
    ],
    exampleNote: 'Response includes marketplace token (for device connections), mobile token, and timezone/location info.',
  },

  'get-users': {
    title: 'Get Users',
    description: 'List all users in your organization. Returns up to 100 users per request.',
    prerequisites: [
      'Valid Organization ID configured',
      'Valid Auth Token configured',
    ],
    steps: [
      {
        title: 'Configure Your Environment',
        description: 'Ensure your Core API URL, Organization ID, and Auth Token are set.',
      },
      {
        title: 'Execute the Request',
        description: 'Click "Execute" to retrieve the list of users.',
      },
      {
        title: 'Browse Users',
        description: 'User cards will appear for each user. Click to expand details.',
        tip: 'Use User IDs from here for other API requests.',
      },
    ],
    exampleNote: 'Returns up to 100 users. Use individual User IDs for Get User or Get User Data.',
  },

  'get-user-data': {
    title: 'Get User Data',
    description: 'Fetch health and fitness data for a specific user within a date range.',
    prerequisites: [
      'Valid Organization ID and Auth Token',
      'User ID with connected devices and synced data',
    ],
    steps: [
      {
        title: 'Set the User ID',
        description: 'Enter the User ID whose health data you want to retrieve.',
      },
      {
        title: 'Configure Date Range',
        description: 'Set Start and End dates. Defaults to last 7 days.',
        tip: 'Larger ranges return more data but take longer.',
      },
      {
        title: 'Filter by Data Type (Optional)',
        description: 'Choose Summaries, Workouts, Sleep, etc. or "All Data".',
        tip: 'Specific types are faster and more focused.',
      },
      {
        title: 'Execute and Review',
        description: 'Click "Execute" and review health records in the Response panel.',
      },
    ],
    exampleNote: 'Returns daily summaries, workouts, sleep records based on synced device data.',
  },

  'replay-stream': {
    title: 'Replay Stream',
    description: 'Connect to an SSE stream that replays historical data events. Useful for testing webhooks.',
    prerequisites: [
      'Valid Auth Token configured',
      'Organization with historical data',
    ],
    steps: [
      {
        title: 'Configure Stream Date',
        description: 'Select the date for which you want to replay events.',
      },
      {
        title: 'Start the Stream',
        description: 'Click "Execute" to open the SSE connection.',
      },
      {
        title: 'Monitor Events',
        description: 'Watch events flow through the visualization, grouped by type.',
        tip: 'Stream auto-reconnects if connection drops.',
      },
      {
        title: 'Stop the Stream',
        description: 'Click "Stop Stream" to close the connection.',
      },
    ],
    exampleNote: 'See "poke" (keep-alive), "data" (health data), and "connection" (device status) events.',
  },

  'generate-data': {
    title: 'Generate Data',
    description: 'Create synthetic health data for testing. Generates realistic patterns.',
    prerequisites: [
      'Data Generator URL configured',
      'Valid Auth Token',
      'Target User ID',
    ],
    steps: [
      {
        title: 'Enter User ID',
        description: 'Specify the User ID that will own the generated data.',
      },
      {
        title: 'Set Date Range',
        description: 'Configure Start and End dates for generation.',
      },
      {
        title: 'Select Data Type',
        description: 'Choose what type of data to generate.',
      },
      {
        title: 'Generate',
        description: 'Click "Execute" to create synthetic data.',
      },
    ],
    exampleNote: 'Generated data appears in Get User Data requests. Useful for testing without real devices.',
  },
};

