'use client';

import { useState, useEffect } from 'react';
import { User, Users, Database, RefreshCw, Sparkles, Wand2, Pencil, Eye, Zap, ChevronRight, Heart, Activity, Dices, Calendar, FileText, TrendingUp, Target, AlertCircle } from 'lucide-react';
import { ServiceType } from '@/types';

type AppMode = 'api-demo' | 'impact';

interface HelpPanelProps {
  selectedService?: ServiceType;
  appMode?: AppMode;
}

interface HelpTab {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  category: string;
}

// API Demo mode tabs and categories
const apiHelpTabs: HelpTab[] = [
  { id: 'get-user', name: 'Get User', icon: <User className="w-4 h-4" />, color: '#0066CC', category: 'users' },
  { id: 'get-users', name: 'Get Users', icon: <Users className="w-4 h-4" />, color: '#0088EE', category: 'users' },
  { id: 'get-user-data', name: 'Get User Data', icon: <Database className="w-4 h-4" />, color: '#00AAFF', category: 'data' },
  { id: 'replay-stream', name: 'Replay Stream', icon: <RefreshCw className="w-4 h-4" />, color: '#00CCFF', category: 'data' },
  { id: 'generate-data', name: 'Generate Data', icon: <Sparkles className="w-4 h-4" />, color: '#22c55e', category: 'data' },
  { id: 'sparks-create', name: 'Create Prompt', icon: <Wand2 className="w-4 h-4" />, color: '#a855f7', category: 'sparks' },
  { id: 'sparks-update', name: 'Update Prompt', icon: <Pencil className="w-4 h-4" />, color: '#8b5cf6', category: 'sparks' },
  { id: 'sparks-view', name: 'View Prompts', icon: <Eye className="w-4 h-4" />, color: '#f59e0b', category: 'sparks' },
  { id: 'sparks-invoke', name: 'Invoke Prompt', icon: <Zap className="w-4 h-4" />, color: '#ef4444', category: 'sparks' },
];

const apiCategories = [
  { id: 'users', name: 'Users' },
  { id: 'data', name: 'Data' },
  { id: 'sparks', name: 'Sparks' },
];

// Impact mode tabs and categories
const impactHelpTabs: HelpTab[] = [
  { id: 'impact-overview', name: 'Overview', icon: <Heart className="w-4 h-4" />, color: '#a855f7', category: 'getting-started' },
  { id: 'impact-patients', name: 'Patient Selection', icon: <Users className="w-4 h-4" />, color: '#3b82f6', category: 'getting-started' },
  { id: 'impact-timeline', name: 'Timeline View', icon: <Calendar className="w-4 h-4" />, color: '#22c55e', category: 'data-viewing' },
  { id: 'impact-data-types', name: 'Data Types', icon: <Activity className="w-4 h-4" />, color: '#06b6d4', category: 'data-viewing' },
  { id: 'impact-generate', name: 'Generate Data', icon: <Dices className="w-4 h-4" />, color: '#22c55e', category: 'data-generation' },
  { id: 'impact-scenarios', name: 'Clinical Scenarios', icon: <Target className="w-4 h-4" />, color: '#f59e0b', category: 'data-generation' },
  { id: 'impact-gaps', name: 'Gap Analysis', icon: <AlertCircle className="w-4 h-4" />, color: '#ef4444', category: 'analysis' },
  { id: 'impact-trends', name: 'Trend Analysis', icon: <TrendingUp className="w-4 h-4" />, color: '#8b5cf6', category: 'analysis' },
];

const impactCategories = [
  { id: 'getting-started', name: 'Getting Started' },
  { id: 'data-viewing', name: 'Data Viewing' },
  { id: 'data-generation', name: 'Data Generation' },
  { id: 'analysis', name: 'Analysis' },
];

export default function HelpPanel({ selectedService, appMode = 'api-demo' }: HelpPanelProps) {
  const isImpactMode = appMode === 'impact';
  const helpTabs = isImpactMode ? impactHelpTabs : apiHelpTabs;
  const categories = isImpactMode ? impactCategories : apiCategories;
  const defaultTab = isImpactMode ? 'impact-overview' : (selectedService || 'get-user');

  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  // Reset to default tab when mode changes
  useEffect(() => {
    setActiveTab(isImpactMode ? 'impact-overview' : (selectedService || 'get-user'));
  }, [appMode, isImpactMode, selectedService]);

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
        <HelpContent helpId={activeTab} appMode={appMode} />
      </div>
    </div>
  );
}

function HelpContent({ helpId, appMode }: { helpId: string; appMode: AppMode }) {
  const guides = appMode === 'impact' ? impactHelpGuides : helpGuides;
  const content = guides[helpId];

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
        title: 'Filter by Source (Optional)',
        description: 'Select a specific source (Fitbit, Garmin, etc.) or "All Sources".',
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

  'sparks-create': {
    title: 'Create Sparks Prompt',
    description: 'Create a new AI prompt template that defines how AI processes health data.',
    prerequisites: [
      'Sparks URL configured',
      'Valid Organization ID and Auth Token',
    ],
    steps: [
      {
        title: 'Open the Prompt Builder',
        description: 'The Sparks panel shows a visual builder. Start by naming your prompt.',
      },
      {
        title: 'Configure the Model',
        description: 'Select the AI model. Claude 3.5 Sonnet is recommended.',
      },
      {
        title: 'Write System Instructions',
        description: 'Define the AI\'s role and behavior in the system message.',
        tip: 'Be specific about persona and advice constraints.',
      },
      {
        title: 'Create User Message Template',
        description: 'Use Handlebars syntax ({{variable}}) for dynamic templates.',
      },
      {
        title: 'Set Inference Parameters',
        description: 'Adjust temperature, top_p, and other generation parameters.',
      },
      {
        title: 'Create the Prompt',
        description: 'Click "Execute" to save to Sparks.',
      },
    ],
    exampleNote: 'Created prompt receives a prompt_id for use with Invoke.',
  },

  'sparks-update': {
    title: 'Update Sparks Prompt',
    description: 'Modify an existing prompt. Updates are versioned.',
    prerequisites: [
      'Existing prompt in Sparks',
      'Prompt ID to update',
    ],
    steps: [
      {
        title: 'Select the Prompt',
        description: 'Choose the prompt from the dropdown in API Setup.',
      },
      {
        title: 'Review Current Config',
        description: 'The builder loads current configuration.',
      },
      {
        title: 'Make Your Changes',
        description: 'Modify name, messages, model, or parameters.',
      },
      {
        title: 'Save Updates',
        description: 'Click "Execute" to save. A new version is created.',
      },
    ],
    exampleNote: 'Updated prompt used for subsequent Invoke calls. Previous versions retained.',
  },

  'sparks-view': {
    title: 'View Sparks Prompts',
    description: 'List and inspect all prompts in your organization.',
    prerequisites: [
      'Sparks URL configured',
      'Valid Organization ID and Auth Token',
    ],
    steps: [
      {
        title: 'Execute the Request',
        description: 'Click "Execute" to fetch all prompts.',
      },
      {
        title: 'Browse Prompts',
        description: 'Review prompt cards showing name, model, and creation info.',
      },
      {
        title: 'Expand for Details',
        description: 'Click a card to see full configuration.',
        tip: 'Copy prompt_id for Invoke requests.',
      },
    ],
    exampleNote: 'View full configurations and copy IDs for other operations.',
  },

  'sparks-invoke': {
    title: 'Invoke Sparks Prompt',
    description: 'Execute an AI prompt with real user data to generate personalized responses.',
    prerequisites: [
      'At least one prompt created',
      'User ID with health data',
      'Valid date range with data',
    ],
    steps: [
      {
        title: 'Select a Prompt',
        description: 'Choose the prompt template to invoke.',
      },
      {
        title: 'Configure User & Dates',
        description: 'Set User ID and date range for analysis.',
      },
      {
        title: 'Select Metric Types',
        description: 'Choose which health metrics to include (steps, sleep, etc.).',
        tip: 'Select metrics relevant to your prompt.',
      },
      {
        title: 'Add Variable Values',
        description: 'If prompt uses custom Handlebars variables, provide values.',
      },
      {
        title: 'Invoke',
        description: 'Click "Execute" to generate AI response.',
      },
      {
        title: 'Review AI Response',
        description: 'Sparks panel displays the generated content.',
      },
    ],
    exampleNote: 'Response time depends on data amount and prompt complexity.',
  },
};

// Impact Data Manager help guides
const impactHelpGuides: Record<string, HelpGuide> = {
  'impact-overview': {
    title: 'Validic Impact Data Manager',
    description: 'A unified interface for managing patient health data, generating test data, and analyzing clinical outcomes for Impact programs.',
    steps: [
      {
        title: 'Select a Patient',
        description: 'Choose a patient from the left panel. Patients are grouped by demo user (e.g., Jordan, Sarah).',
        tip: 'Patient data is loaded from the shared Google Sheets spreadsheet.',
      },
      {
        title: 'Set Date Range',
        description: 'Configure the time window for viewing and generating data using the date pickers.',
      },
      {
        title: 'Fetch Patient Data',
        description: 'Click "Fetch Data" to retrieve all health records for the selected patient within the date range.',
      },
      {
        title: 'Generate or Analyze',
        description: 'Use the Generate Random Data section to create test data, or review the timeline to analyze gaps and trends.',
      },
    ],
    exampleNote: 'Impact Data Manager pulls patient lists from the same spreadsheet used by the myEHR demo application.',
  },

  'impact-patients': {
    title: 'Patient Selection',
    description: 'Browse and select patients from the demo spreadsheet. Patients are organized by demo user groups.',
    prerequisites: [
      'Google Sheets API accessible',
      'Valid patient data in the spreadsheet',
    ],
    steps: [
      {
        title: 'View Patient Groups',
        description: 'Patients are organized by tab name from the spreadsheet (e.g., "Jordan", "Sarah").',
      },
      {
        title: 'Select a Patient',
        description: 'Click on a patient card to select them. Their name, UID, and ID will be displayed.',
      },
      {
        title: 'Refresh Patient List',
        description: 'Click the refresh icon to reload patients from the spreadsheet.',
        tip: 'Only tabs with "uid" and "id" columns are included.',
      },
    ],
    exampleNote: 'The patient UID is used for all API calls. The ID is the internal database reference.',
  },

  'impact-timeline': {
    title: 'Timeline View',
    description: 'View patient health data day-by-day with visual indicators for data completeness.',
    prerequisites: [
      'Patient selected',
      'Data fetched for the date range',
    ],
    steps: [
      {
        title: 'Fetch Data First',
        description: 'Click "Fetch Data" to populate the timeline with actual health records.',
      },
      {
        title: 'Review Each Day',
        description: 'The timeline shows every day in the range, newest first. Each row shows data summaries.',
      },
      {
        title: 'Identify Missing Days',
        description: 'Days without any data are highlighted in red for easy identification.',
        tip: 'Use this to find gaps that need synthetic data.',
      },
      {
        title: 'View Summary Stats',
        description: 'The footer shows total days, days with data, and missing day count.',
      },
    ],
    exampleNote: 'Data summaries show steps, workout types, sleep duration, and other key metrics at a glance.',
  },

  'impact-data-types': {
    title: 'Data Types',
    description: 'Understanding the different health data categories available in Impact.',
    steps: [
      {
        title: 'Daily Summaries',
        description: 'Aggregated daily metrics including steps, calories, distance, and activity minutes.',
      },
      {
        title: 'Workouts',
        description: 'Individual exercise sessions with type, duration, and performance metrics.',
      },
      {
        title: 'Sleep',
        description: 'Sleep records with total duration, stages (deep, light, REM), and efficiency.',
      },
      {
        title: 'Nutrition',
        description: 'Food logs with calories, macronutrients, and meal timing.',
      },
      {
        title: 'Measurements',
        description: 'Biometric readings like blood pressure, weight, blood glucose, and SpO2.',
      },
      {
        title: 'CGM Data',
        description: 'Continuous glucose monitoring readings with timestamps.',
      },
    ],
    exampleNote: 'Each data type maps to different device sources (Fitbit, Garmin, Apple Health, etc.).',
  },

  'impact-generate': {
    title: 'Generate Random Data',
    description: 'Create synthetic health data for testing Impact programs and filling data gaps.',
    prerequisites: [
      'Data Generator URL configured',
      'Valid Auth Token',
      'Patient selected',
    ],
    steps: [
      {
        title: 'Select Data Types',
        description: 'Choose which types of data to generate: Blood Glucose, Blood Pressure, Steps, Body Weight, SpO2, or CGM.',
        tip: 'You can select multiple types to generate in one batch.',
      },
      {
        title: 'Set Date Range',
        description: 'Configure the start and end dates for data generation.',
      },
      {
        title: 'Enable Gap Filling',
        description: 'Check "Skip days with existing data" to only generate on days without records.',
        tip: 'Fetch data first to enable this option.',
      },
      {
        title: 'Generate Data',
        description: 'Click "Generate Data" to create synthetic records. Progress is shown during generation.',
      },
    ],
    exampleNote: 'The system automatically groups consecutive dates into efficient API calls.',
  },

  'impact-scenarios': {
    title: 'Clinical Scenarios',
    description: 'Generate realistic health data patterns that simulate clinical outcomes over time.',
    steps: [
      {
        title: 'Coming Soon',
        description: 'Clinical scenarios will allow you to generate data that follows realistic health patterns.',
      },
      {
        title: 'Weight Loss Journey',
        description: 'Generate weight measurements trending downward over the selected period.',
      },
      {
        title: 'BP Management',
        description: 'Generate blood pressure readings showing gradual improvement.',
      },
      {
        title: 'Activity Increase',
        description: 'Generate step counts and workouts with increasing frequency and intensity.',
      },
    ],
    exampleNote: 'Scenarios are designed to test Impact program logic with realistic patient progressions.',
  },

  'impact-gaps': {
    title: 'Gap Analysis',
    description: 'Identify and fill missing data in patient health records.',
    prerequisites: [
      'Patient data fetched',
    ],
    steps: [
      {
        title: 'Review Timeline',
        description: 'Red-highlighted days in the timeline indicate missing data.',
      },
      {
        title: 'Check Footer Stats',
        description: 'The timeline footer shows how many days are missing data.',
      },
      {
        title: 'Generate Missing Data',
        description: 'Use "Skip days with existing data" option to fill only the gaps.',
        tip: 'This ensures you don\'t overwrite existing patient data.',
      },
    ],
    exampleNote: 'Gap analysis helps ensure patients have complete data for program calculations.',
  },

  'impact-trends': {
    title: 'Trend Analysis',
    description: 'Analyze health data trends and patterns over time.',
    steps: [
      {
        title: 'Coming Soon',
        description: 'Trend analysis features will provide visualizations and insights.',
      },
      {
        title: 'View Timeline Patterns',
        description: 'Currently, you can review the timeline to see data patterns day by day.',
      },
      {
        title: 'Export for Analysis',
        description: 'Use the All Users panel to export data for external analysis tools.',
      },
    ],
    exampleNote: 'Future versions will include charts and automated trend detection.',
  },
};
