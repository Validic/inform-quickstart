'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronUp, Clock, MapPin, Smartphone, Globe, Copy, Check, Store } from 'lucide-react';
import { DataRecord } from '@/types';
import { getDisplayName } from '@/data/names';
import MarketplaceModal from '@/components/MarketplaceModal';

interface UserCardProps {
  user: DataRecord;
  index: number;
}

// Generate a consistent color based on user ID
function getUserColor(uid: string): string {
  const colors = [
    '#3b82f6', // blue
    '#22c55e', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#f97316', // orange
  ];
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = uid.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Activity types for the human figures
type ActivityType = 'jumping-jacks' | 'running' | 'squats' | 'yoga' | 'dancing' | 'boxing' | 'cycling' | 'stretching';

const ACTIVITIES: ActivityType[] = ['jumping-jacks', 'running', 'squats', 'yoga', 'dancing', 'boxing', 'cycling', 'stretching'];

// Get a consistent activity based on user ID
function getUserActivity(uid: string): ActivityType {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = uid.charCodeAt(i) + ((hash << 7) - hash);
  }
  return ACTIVITIES[Math.abs(hash) % ACTIVITIES.length];
}

// Animated human figure SVG component with various activities
function HumanFigure({ color, isActive, isAnimating, activity }: {
  color: string;
  isActive: boolean;
  isAnimating: boolean;
  activity: ActivityType;
}) {
  // Get pose based on activity and animation state
  const getPose = () => {
    const poses = {
      'jumping-jacks': {
        head: isAnimating ? { cy: 10 } : { cy: 12 },
        body: isAnimating ? "M24 22 L24 38" : "M24 24 L24 42",
        arms: isAnimating ? "M24 26 L8 14 M24 26 L40 14" : "M24 28 L12 36 M24 28 L36 36",
        legs: isAnimating ? "M24 38 L8 56 M24 38 L40 56" : "M24 42 L14 58 M24 42 L34 58",
        eyeY: isAnimating ? 8 : 10,
        smile: isAnimating ? "M18 13 Q24 18 30 13" : "M20 15 Q24 18 28 15",
        translateY: isAnimating ? -2 : 0,
      },
      'running': {
        head: { cy: isAnimating ? 11 : 12 },
        body: "M24 24 L24 42",
        arms: isAnimating ? "M24 28 L10 22 M24 28 L38 34" : "M24 28 L38 22 M24 28 L10 34",
        legs: isAnimating ? "M24 42 L10 54 M24 42 L32 58" : "M24 42 L32 54 M24 42 L10 58",
        eyeY: isAnimating ? 9 : 10,
        smile: "M20 15 Q24 17 28 15",
        translateY: isAnimating ? -1 : 1,
      },
      'squats': {
        head: { cy: isAnimating ? 18 : 12 },
        body: isAnimating ? "M24 30 L24 42" : "M24 24 L24 42",
        arms: isAnimating ? "M24 32 L8 28 M24 32 L40 28" : "M24 28 L8 24 M24 28 L40 24",
        legs: isAnimating ? "M24 42 L10 50 L10 58 M24 42 L38 50 L38 58" : "M24 42 L18 58 M24 42 L30 58",
        eyeY: isAnimating ? 16 : 10,
        smile: isAnimating ? "M20 21 Q24 24 28 21" : "M20 15 Q24 18 28 15",
        translateY: isAnimating ? 4 : 0,
      },
      'yoga': {
        head: { cy: 12 },
        body: "M24 24 L24 42",
        arms: isAnimating ? "M24 28 L4 28 M24 28 L44 28" : "M24 28 L18 12 M24 28 L30 12",
        legs: isAnimating ? "M24 42 L14 58 M24 42 L34 58" : "M24 42 L24 50 L14 58 M24 50 L34 58",
        eyeY: 10,
        smile: "M20 15 Q24 17 28 15",
        translateY: 0,
      },
      'dancing': {
        head: { cy: isAnimating ? 11 : 13 },
        body: isAnimating ? "M24 23 L22 40" : "M24 25 L26 42",
        arms: isAnimating ? "M23 27 L6 20 M23 27 L36 18" : "M25 29 L42 22 M25 29 L12 20",
        legs: isAnimating ? "M22 40 L8 56 M22 40 L30 58" : "M26 42 L40 56 M26 42 L18 58",
        eyeY: isAnimating ? 9 : 11,
        smile: isAnimating ? "M18 14 Q24 19 30 14" : "M20 16 Q24 19 28 16",
        translateY: isAnimating ? -2 : 0,
      },
      'boxing': {
        head: { cy: 12 },
        body: "M24 24 L24 42",
        arms: isAnimating ? "M24 28 L6 24 M24 28 L36 32" : "M24 28 L36 24 M24 28 L6 32",
        legs: isAnimating ? "M24 42 L16 58 M24 42 L34 56" : "M24 42 L34 58 M24 42 L16 56",
        eyeY: 10,
        smile: "M20 15 Q24 16 28 15",
        translateY: isAnimating ? -1 : 1,
      },
      'cycling': {
        head: { cy: isAnimating ? 14 : 14 },
        body: "M24 26 L24 40",
        arms: "M24 28 L14 24 M24 28 L34 24",
        legs: isAnimating ? "M24 40 L14 50 L14 58 M24 40 L34 46 L34 54" : "M24 40 L34 50 L34 58 M24 40 L14 46 L14 54",
        eyeY: 12,
        smile: "M20 17 Q24 19 28 17",
        translateY: 2,
      },
      'stretching': {
        head: { cy: isAnimating ? 10 : 12 },
        body: isAnimating ? "M24 22 L24 40" : "M24 24 L24 42",
        arms: isAnimating ? "M24 26 L4 10 M24 26 L44 10" : "M24 28 L4 28 M24 28 L44 28",
        legs: isAnimating ? "M24 40 L14 58 M24 40 L34 58" : "M24 42 L4 50 M24 42 L44 50",
        eyeY: isAnimating ? 8 : 10,
        smile: "M20 15 Q24 18 28 15",
        translateY: isAnimating ? -2 : 0,
      },
    };
    return poses[activity];
  };

  const pose = getPose();

  return (
    <svg
      width="48"
      height="64"
      viewBox="0 0 48 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="transition-transform"
      style={{ transform: `translateY(${pose.translateY}px)` }}
    >
      {/* Head */}
      <circle
        cx="24"
        cy={pose.head.cy}
        r="10"
        fill={color}
        className="transition-all duration-150"
      />
      {/* Body */}
      <path
        d={pose.body}
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        className="transition-all duration-150"
      />
      {/* Arms */}
      <path
        d={pose.arms}
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        className="transition-all duration-150"
      />
      {/* Legs */}
      <path
        d={pose.legs}
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        className="transition-all duration-150"
      />
      {/* Face - eyes */}
      <circle cx="20" cy={pose.eyeY} r="2" fill="#1f2937" className="transition-all duration-150" />
      <circle cx="28" cy={pose.eyeY} r="2" fill="#1f2937" className="transition-all duration-150" />
      {/* Face - smile */}
      <path
        d={pose.smile}
        stroke="#1f2937"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        className="transition-all duration-150"
      />
      {/* Status indicator */}
      {isActive && (
        <circle cx="40" cy="8" r="4" fill="#22c55e" className="animate-pulse" />
      )}
    </svg>
  );
}

// Get a friendly activity label
function getActivityLabel(activity: ActivityType): string {
  const labels: Record<ActivityType, string> = {
    'jumping-jacks': 'Jumping Jacks',
    'running': 'Running',
    'squats': 'Squats',
    'yoga': 'Yoga',
    'dancing': 'Dancing',
    'boxing': 'Boxing',
    'cycling': 'Cycling',
    'stretching': 'Stretching',
  };
  return labels[activity];
}

export default function UserCard({ user, index }: UserCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [marketplaceOpen, setMarketplaceOpen] = useState(false);

  const userId = user.uid || user.id || 'default';
  const userColor = getUserColor(userId);
  const userActivity = getUserActivity(userId);
  const isActive = user.status === 'active';

  // Animate while hovered
  useEffect(() => {
    if (!isHovered) {
      setIsAnimating(false);
      return;
    }

    const interval = setInterval(() => {
      setIsAnimating(prev => !prev);
    }, 300);

    return () => clearInterval(interval);
  }, [isHovered]);

  const formatDateTime = (isoString: string | undefined): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleCopy(text, field);
      }}
      className="p-1 hover:bg-gray-700/50 rounded transition-colors"
      title="Copy to clipboard"
    >
      {copiedField === field ? (
        <Check className="w-3 h-3 text-green-400" />
      ) : (
        <Copy className="w-3 h-3 text-gray-500" />
      )}
    </button>
  );

  return (
    <div
      className="glass-panel overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Compact Card View */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-colors"
      >
        {/* Human Figure */}
        <div className="flex-shrink-0">
          <HumanFigure color={userColor} isActive={isActive} isAnimating={isAnimating} activity={userActivity} />
        </div>

        {/* User Info */}
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-white truncate">{getDisplayName(user.uid || user.id || 'unknown')}</span>
            {user.status && (
              <span className={`px-2 py-0.5 rounded-full text-xs whitespace-nowrap ${
                user.status === 'active'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-gray-500/20 text-gray-400'
              }`}>
                {user.status}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full text-xs whitespace-nowrap bg-purple-500/20 text-purple-400">
              {getActivityLabel(userActivity)}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400 mt-1 flex-wrap">
            {user.location?.country_code && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {user.location.timezone || user.location.country_code}
              </span>
            )}
            {user.created_at && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDateTime(user.created_at)}
              </span>
            )}
          </div>
        </div>

        {/* Expand Toggle */}
        <div className="flex-shrink-0">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Connect Sources Button */}
      {user.marketplace && (
        <div className="px-4 pb-3">
          <button
            onClick={() => setMarketplaceOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/25 hover:bg-green-500/25 transition-colors"
          >
            <Store className="w-3 h-3" />
            Connect Sources
          </button>
        </div>
      )}

      {/* Marketplace Modal — portaled to body to escape any ancestor stacking contexts */}
      {marketplaceOpen && typeof document !== 'undefined' && createPortal(
        <MarketplaceModal user={user} onClose={() => setMarketplaceOpen(false)} />,
        document.body
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-blue-500/10">
          <div className="grid grid-cols-1 gap-3 mt-4">
            {/* All IDs */}
            {(user.id || user.uid || user.user?.user_id || user.user?.uid) && (
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Identifiers</div>
                <div className="space-y-2">
                  {user.id && (
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">id</span>
                        <CopyButton text={user.id} field="id" />
                      </div>
                      <p className="text-sm text-white font-mono break-all">{user.id}</p>
                    </div>
                  )}
                  {user.uid && (
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">uid</span>
                        <CopyButton text={user.uid} field="uid" />
                      </div>
                      <p className="text-sm text-white font-mono break-all">{user.uid}</p>
                    </div>
                  )}
                  {user.user?.user_id && (
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">user.user_id</span>
                        <CopyButton text={user.user.user_id} field="user_id" />
                      </div>
                      <p className="text-sm text-white font-mono break-all">{user.user.user_id}</p>
                    </div>
                  )}
                  {user.user?.uid && user.user.uid !== user.uid && (
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">user.uid</span>
                        <CopyButton text={user.user.uid} field="user_uid" />
                      </div>
                      <p className="text-sm text-white font-mono break-all">{user.user.uid}</p>
                    </div>
                  )}
                  {user.user?.organization_id && (
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">user.organization_id</span>
                        <CopyButton text={user.user.organization_id} field="org_id" />
                      </div>
                      <p className="text-sm text-white font-mono break-all">{user.user.organization_id}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Location */}
            {user.location && (
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wide mb-2">
                  <Globe className="w-3 h-3" />
                  Location
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Timezone: </span>
                    <span className="text-white">{user.location.timezone}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Country: </span>
                    <span className="text-white">{user.location.country_code}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Marketplace */}
            {user.marketplace && (
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wide mb-2">
                  <Globe className="w-3 h-3" />
                  Marketplace
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Token</span>
                      <CopyButton text={user.marketplace.token} field="marketplace-token" />
                    </div>
                    <p className="text-xs text-white font-mono break-all mt-0.5">{user.marketplace.token}</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">URL</span>
                      <CopyButton text={user.marketplace.url} field="marketplace-url" />
                    </div>
                    <p className="text-xs text-blue-400 font-mono break-all mt-0.5">{user.marketplace.url}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile */}
            {user.mobile && (
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wide mb-2">
                  <Smartphone className="w-3 h-3" />
                  Mobile
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Token</span>
                  <CopyButton text={user.mobile.token} field="mobile-token" />
                </div>
                <p className="text-xs text-white font-mono break-all mt-0.5">{user.mobile.token}</p>
              </div>
            )}

            {/* Timestamps */}
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wide mb-2">
                <Clock className="w-3 h-3" />
                Timestamps
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Created: </span>
                  <span className="text-white">{formatDateTime(user.created_at)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Updated: </span>
                  <span className="text-white">{formatDateTime(user.updated_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
