'use client';

import { useState } from 'react';
import { Metric } from '@/types';
import CGMChart from './CGMChart';

// Metric configuration with icons, colors, and display info
const METRIC_CONFIG: Record<string, {
  category: 'activity' | 'heart' | 'sleep' | 'body' | 'nutrition' | 'respiratory' | 'blood' | 'stress' | 'workout';
  color: string;
  icon: 'steps' | 'heart' | 'flame' | 'moon' | 'scale' | 'droplet' | 'lung' | 'thermometer' | 'bolt' | 'brain' | 'water' | 'food' | 'speed' | 'timer' | 'target';
  unit?: string;
  goodDirection?: 'up' | 'down' | 'stable';
}> = {
  // Activity
  steps: { category: 'activity', color: '#22c55e', icon: 'steps', goodDirection: 'up' },
  distance: { category: 'activity', color: '#10b981', icon: 'steps', goodDirection: 'up' },
  floors_climbed: { category: 'activity', color: '#14b8a6', icon: 'steps', goodDirection: 'up' },
  wheelchair_pushes: { category: 'activity', color: '#06b6d4', icon: 'steps', goodDirection: 'up' },
  wheelchair_distance: { category: 'activity', color: '#0891b2', icon: 'steps', goodDirection: 'up' },
  elevation: { category: 'activity', color: '#059669', icon: 'steps', goodDirection: 'up' },

  // Duration/Activity Time
  active_duration: { category: 'activity', color: '#22c55e', icon: 'timer', goodDirection: 'up' },
  fairly_active_duration: { category: 'activity', color: '#84cc16', icon: 'timer', goodDirection: 'up' },
  lightly_active_duration: { category: 'activity', color: '#a3e635', icon: 'timer' },
  very_active_duration: { category: 'activity', color: '#16a34a', icon: 'timer', goodDirection: 'up' },

  // Energy
  energy_burned: { category: 'activity', color: '#f97316', icon: 'flame', goodDirection: 'up' },
  active_energy_burned: { category: 'activity', color: '#fb923c', icon: 'flame', goodDirection: 'up' },
  basal_energy_burned: { category: 'activity', color: '#fdba74', icon: 'flame' },
  basal_metabolic_rate: { category: 'body', color: '#f59e0b', icon: 'flame' },

  // Heart
  avg_heart_rate: { category: 'heart', color: '#ef4444', icon: 'heart' },
  min_heart_rate: { category: 'heart', color: '#fca5a5', icon: 'heart' },
  max_heart_rate: { category: 'heart', color: '#dc2626', icon: 'heart' },
  resting_heart_rate: { category: 'heart', color: '#f87171', icon: 'heart', goodDirection: 'down' },
  pulse: { category: 'heart', color: '#ef4444', icon: 'heart' },
  heart_rate_variability: { category: 'heart', color: '#ec4899', icon: 'heart', goodDirection: 'up' },
  heart_rate_zone_rest: { category: 'heart', color: '#86efac', icon: 'heart' },
  heart_rate_zone_very_low: { category: 'heart', color: '#a7f3d0', icon: 'heart' },
  heart_rate_zone_low: { category: 'heart', color: '#fde047', icon: 'heart' },
  heart_rate_zone_medium: { category: 'heart', color: '#fb923c', icon: 'heart' },
  heart_rate_zone_high: { category: 'heart', color: '#f87171', icon: 'heart' },
  heart_rate_zone_very_high: { category: 'heart', color: '#ef4444', icon: 'heart' },

  // Sleep
  sleep_duration: { category: 'sleep', color: '#8b5cf6', icon: 'moon', goodDirection: 'up' },
  deep_sleep: { category: 'sleep', color: '#6366f1', icon: 'moon', goodDirection: 'up' },
  light_sleep: { category: 'sleep', color: '#a78bfa', icon: 'moon' },
  rem_sleep: { category: 'sleep', color: '#7c3aed', icon: 'moon', goodDirection: 'up' },
  awake_duration: { category: 'sleep', color: '#c4b5fd', icon: 'moon', goodDirection: 'down' },
  awake_count: { category: 'sleep', color: '#ddd6fe', icon: 'moon', goodDirection: 'down' },
  in_bed_duration: { category: 'sleep', color: '#a855f7', icon: 'moon' },
  time_to_fall_asleep: { category: 'sleep', color: '#d8b4fe', icon: 'moon', goodDirection: 'down' },
  sleep_score: { category: 'sleep', color: '#9333ea', icon: 'moon', goodDirection: 'up' },
  nap_duration: { category: 'sleep', color: '#c084fc', icon: 'moon' },
  restless_count: { category: 'sleep', color: '#e9d5ff', icon: 'moon', goodDirection: 'down' },

  // Body Composition
  body_weight: { category: 'body', color: '#3b82f6', icon: 'scale' },
  bmi: { category: 'body', color: '#60a5fa', icon: 'scale' },
  body_fat: { category: 'body', color: '#93c5fd', icon: 'scale', goodDirection: 'down' },
  body_fat_mass: { category: 'body', color: '#93c5fd', icon: 'scale', goodDirection: 'down' },
  body_muscle: { category: 'body', color: '#2563eb', icon: 'scale', goodDirection: 'up' },
  body_muscle_mass: { category: 'body', color: '#1d4ed8', icon: 'scale', goodDirection: 'up' },
  body_water: { category: 'body', color: '#06b6d4', icon: 'water' },
  body_water_mass: { category: 'body', color: '#0891b2', icon: 'water' },
  body_lean_mass: { category: 'body', color: '#0284c7', icon: 'scale', goodDirection: 'up' },
  body_bone: { category: 'body', color: '#e2e8f0', icon: 'scale' },
  body_bone_mass: { category: 'body', color: '#cbd5e1', icon: 'scale' },
  visceral_fat: { category: 'body', color: '#fbbf24', icon: 'scale', goodDirection: 'down' },
  body_height: { category: 'body', color: '#64748b', icon: 'scale' },

  // Body Measurements
  body_temperature: { category: 'body', color: '#f59e0b', icon: 'thermometer' },
  body_temperature_deviation: { category: 'body', color: '#fbbf24', icon: 'thermometer' },
  body_arms: { category: 'body', color: '#94a3b8', icon: 'scale' },
  body_chest: { category: 'body', color: '#94a3b8', icon: 'scale' },
  body_hips: { category: 'body', color: '#94a3b8', icon: 'scale' },
  body_waist: { category: 'body', color: '#94a3b8', icon: 'scale' },
  body_thighs: { category: 'body', color: '#94a3b8', icon: 'scale' },

  // Blood Pressure & Blood
  systolic: { category: 'blood', color: '#ef4444', icon: 'droplet' },
  diastolic: { category: 'blood', color: '#f97316', icon: 'droplet' },
  blood_glucose: { category: 'blood', color: '#8b5cf6', icon: 'droplet' },
  avg_blood_glucose: { category: 'blood', color: '#a78bfa', icon: 'droplet' },
  blood_ketone: { category: 'blood', color: '#c084fc', icon: 'droplet' },
  glucose_ketone_index: { category: 'blood', color: '#d8b4fe', icon: 'droplet' },
  gmi: { category: 'blood', color: '#7c3aed', icon: 'droplet' },
  inr: { category: 'blood', color: '#dc2626', icon: 'droplet' },
  pt: { category: 'blood', color: '#b91c1c', icon: 'droplet' },
  insulin: { category: 'blood', color: '#6366f1', icon: 'droplet' },

  // Blood Oxygen
  spo2: { category: 'blood', color: '#06b6d4', icon: 'lung', goodDirection: 'up' },
  avg_spo2: { category: 'blood', color: '#0891b2', icon: 'lung', goodDirection: 'up' },
  min_spo2: { category: 'blood', color: '#155e75', icon: 'lung', goodDirection: 'up' },
  max_spo2: { category: 'blood', color: '#22d3ee', icon: 'lung' },

  // CGM specific
  time_in_target: { category: 'blood', color: '#22c55e', icon: 'target', goodDirection: 'up' },
  time_above_target: { category: 'blood', color: '#f97316', icon: 'target', goodDirection: 'down' },
  time_below_target: { category: 'blood', color: '#eab308', icon: 'target', goodDirection: 'down' },
  time_above_threshold: { category: 'blood', color: '#ef4444', icon: 'target', goodDirection: 'down' },
  time_below_threshold: { category: 'blood', color: '#f59e0b', icon: 'target', goodDirection: 'down' },
  hyperglycemic_count: { category: 'blood', color: '#dc2626', icon: 'target', goodDirection: 'down' },
  hypoglycemic_count: { category: 'blood', color: '#ca8a04', icon: 'target', goodDirection: 'down' },
  coefficient_of_variation: { category: 'blood', color: '#9333ea', icon: 'target' },

  // Respiratory
  respiratory_rate: { category: 'respiratory', color: '#0ea5e9', icon: 'lung' },
  fev1: { category: 'respiratory', color: '#38bdf8', icon: 'lung' },
  fvc: { category: 'respiratory', color: '#7dd3fc', icon: 'lung' },
  pef: { category: 'respiratory', color: '#0284c7', icon: 'lung' },
  fef_25_75: { category: 'respiratory', color: '#0369a1', icon: 'lung' },
  fet: { category: 'respiratory', color: '#075985', icon: 'lung' },
  fev6: { category: 'respiratory', color: '#0c4a6e', icon: 'lung' },
  fev1_per_fvc: { category: 'respiratory', color: '#38bdf8', icon: 'lung' },
  fev1_per_fev6: { category: 'respiratory', color: '#7dd3fc', icon: 'lung' },

  // Nutrition
  energy_consumed: { category: 'nutrition', color: '#eab308', icon: 'food' },
  carbohydrate: { category: 'nutrition', color: '#a855f7', icon: 'food' },
  protein: { category: 'nutrition', color: '#ec4899', icon: 'food' },
  fat: { category: 'nutrition', color: '#f59e0b', icon: 'food' },
  saturated_fat: { category: 'nutrition', color: '#d97706', icon: 'food' },
  unsaturated_fat: { category: 'nutrition', color: '#84cc16', icon: 'food' },
  dietary_fiber: { category: 'nutrition', color: '#22c55e', icon: 'food' },
  sugars: { category: 'nutrition', color: '#f472b6', icon: 'food' },
  sodium: { category: 'nutrition', color: '#94a3b8', icon: 'food' },
  cholesterol: { category: 'nutrition', color: '#fbbf24', icon: 'food' },
  calcium: { category: 'nutrition', color: '#e2e8f0', icon: 'food' },
  water: { category: 'nutrition', color: '#06b6d4', icon: 'water' },

  // Stress
  high_stress_duration: { category: 'stress', color: '#ef4444', icon: 'brain', goodDirection: 'down' },
  medium_stress_duration: { category: 'stress', color: '#f97316', icon: 'brain' },
  low_stress_duration: { category: 'stress', color: '#84cc16', icon: 'brain', goodDirection: 'up' },
  rest_stress_duration: { category: 'stress', color: '#22c55e', icon: 'brain', goodDirection: 'up' },
  mindful_duration: { category: 'stress', color: '#8b5cf6', icon: 'brain', goodDirection: 'up' },

  // Workout Performance
  avg_speed: { category: 'workout', color: '#3b82f6', icon: 'speed' },
  max_speed: { category: 'workout', color: '#1d4ed8', icon: 'speed' },
  avg_pace: { category: 'workout', color: '#60a5fa', icon: 'speed' },
  max_pace: { category: 'workout', color: '#2563eb', icon: 'speed' },
  avg_power: { category: 'workout', color: '#f59e0b', icon: 'bolt' },
  avg_cadence: { category: 'workout', color: '#10b981', icon: 'speed' },
  max_cadence: { category: 'workout', color: '#059669', icon: 'speed' },
  workout_duration: { category: 'workout', color: '#8b5cf6', icon: 'timer' },
  laps: { category: 'workout', color: '#06b6d4', icon: 'target' },
  vo2_max: { category: 'workout', color: '#ec4899', icon: 'lung', goodDirection: 'up' },

  // Misc
  stand_hours_count: { category: 'activity', color: '#22c55e', icon: 'steps', goodDirection: 'up' },
  idle_hours_count: { category: 'activity', color: '#94a3b8', icon: 'timer', goodDirection: 'down' },
  capture_rate: { category: 'body', color: '#64748b', icon: 'target' },
  scan_count: { category: 'body', color: '#475569', icon: 'target' },
  days_worn_count: { category: 'body', color: '#64748b', icon: 'timer' },
};

// Get config for a metric type
function getMetricConfig(type: string) {
  return METRIC_CONFIG[type] || { category: 'activity', color: '#6b7280', icon: 'target' as const };
}

// SVG Icons as components with animations
function StepsIcon({ color, isHovered }: { color: string; isHovered: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path
        d="M4 18L8 14L12 16L16 12L20 8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-70'}`}
        style={{
          strokeDasharray: isHovered ? '0' : '2 2',
        }}
      />
      <circle
        cx="8"
        cy="14"
        r="2"
        fill={color}
        className={`transition-transform duration-300 ${isHovered ? 'scale-125' : 'scale-100'}`}
        style={{ transformOrigin: '8px 14px' }}
      />
      <circle
        cx="16"
        cy="12"
        r="2"
        fill={color}
        className={`transition-transform duration-300 delay-75 ${isHovered ? 'scale-125' : 'scale-100'}`}
        style={{ transformOrigin: '16px 12px' }}
      />
    </svg>
  );
}

function HeartIcon({ color, isHovered }: { color: string; isHovered: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`w-5 h-5 ${isHovered ? 'animate-pulse' : ''}`} fill="none">
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill={color}
        className={`transition-transform duration-200 ${isHovered ? 'scale-110' : 'scale-100'}`}
        style={{ transformOrigin: 'center' }}
      />
    </svg>
  );
}

function FlameIcon({ color, isHovered }: { color: string; isHovered: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path
        d="M12 2C12 2 7 7 7 12C7 15.31 9.69 18 13 18C13 18 11 15 11 13C11 11 13 9 13 9C13 9 15 11 15 13C15 14 14.5 15 14 16C14 16 17 14.5 17 11C17 6 12 2 12 2Z"
        fill={color}
        className={`transition-all duration-300 ${isHovered ? 'scale-110' : 'scale-100'}`}
        style={{
          transformOrigin: 'center bottom',
          filter: isHovered ? `drop-shadow(0 0 4px ${color})` : 'none'
        }}
      />
      {isHovered && (
        <>
          <circle cx="9" cy="16" r="1" fill={color} className="animate-ping opacity-75" />
          <circle cx="15" cy="14" r="1" fill={color} className="animate-ping opacity-75" style={{ animationDelay: '0.2s' }} />
        </>
      )}
    </svg>
  );
}

function MoonIcon({ color, isHovered }: { color: string; isHovered: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        fill={color}
        className={`transition-all duration-500 ${isHovered ? 'scale-105' : 'scale-100'}`}
        style={{ transformOrigin: 'center' }}
      />
      {isHovered && (
        <>
          <circle cx="18" cy="6" r="1" fill="#fef3c7" className="animate-pulse" />
          <circle cx="20" cy="10" r="0.5" fill="#fef3c7" className="animate-pulse" style={{ animationDelay: '0.3s' }} />
          <circle cx="16" cy="4" r="0.5" fill="#fef3c7" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
        </>
      )}
    </svg>
  );
}

function ScaleIcon({ color, isHovered }: { color: string; isHovered: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="2"
        stroke={color}
        strokeWidth="2"
        fill="none"
        className={`transition-all duration-300 ${isHovered ? 'stroke-[2.5]' : ''}`}
      />
      <circle
        cx="12"
        cy="12"
        r="4"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      <line
        x1="12"
        y1="8"
        x2="12"
        y2="12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        className={`transition-transform duration-300 ${isHovered ? 'rotate-45' : 'rotate-0'}`}
        style={{ transformOrigin: '12px 12px' }}
      />
    </svg>
  );
}

function DropletIcon({ color, isHovered }: { color: string; isHovered: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path
        d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
        fill={color}
        className={`transition-all duration-300 ${isHovered ? 'scale-110' : 'scale-100'}`}
        style={{
          transformOrigin: 'center',
          filter: isHovered ? `drop-shadow(0 2px 4px ${color}40)` : 'none'
        }}
      />
      {isHovered && (
        <ellipse cx="9" cy="13" rx="1.5" ry="2" fill="white" opacity="0.4" />
      )}
    </svg>
  );
}

function LungIcon({ color, isHovered }: { color: string; isHovered: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path
        d="M6 12C4 12 2 14 2 17C2 20 4 22 7 22C9 22 10 21 10 19V12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        className={`transition-all duration-500 ${isHovered ? 'scale-x-110' : 'scale-x-100'}`}
        style={{ transformOrigin: '10px center' }}
      />
      <path
        d="M18 12C20 12 22 14 22 17C22 20 20 22 17 22C15 22 14 21 14 19V12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        className={`transition-all duration-500 ${isHovered ? 'scale-x-110' : 'scale-x-100'}`}
        style={{ transformOrigin: '14px center' }}
      />
      <path
        d="M12 2V12M10 12H14"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ThermometerIcon({ color, isHovered }: { color: string; isHovered: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path
        d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      <circle
        cx="11.5"
        cy="17.5"
        r="2"
        fill={color}
        className={`transition-all duration-300 ${isHovered ? 'scale-125' : 'scale-100'}`}
        style={{ transformOrigin: '11.5px 17.5px' }}
      />
      <line
        x1="11.5"
        y1="15"
        x2="11.5"
        y2={isHovered ? "6" : "10"}
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        className="transition-all duration-500"
      />
    </svg>
  );
}

function BoltIcon({ color, isHovered }: { color: string; isHovered: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path
        d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
        fill={color}
        className={`transition-all duration-200 ${isHovered ? 'scale-110' : 'scale-100'}`}
        style={{
          transformOrigin: 'center',
          filter: isHovered ? `drop-shadow(0 0 6px ${color})` : 'none'
        }}
      />
    </svg>
  );
}

function BrainIcon({ color, isHovered }: { color: string; isHovered: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path
        d="M12 2C9 2 7 4 7 6C5 6 3 8 3 10C3 12 4 13 5 14C4 15 4 17 5 18C6 19 7 19 8 19C8 21 10 22 12 22C14 22 16 21 16 19C17 19 18 19 19 18C20 17 20 15 19 14C20 13 21 12 21 10C21 8 19 6 17 6C17 4 15 2 12 2Z"
        stroke={color}
        strokeWidth="2"
        fill="none"
        className={`transition-all duration-300 ${isHovered ? 'scale-105' : 'scale-100'}`}
        style={{ transformOrigin: 'center' }}
      />
      <path
        d="M12 6V18M9 9H15M9 15H15"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity={isHovered ? 1 : 0.5}
        className="transition-opacity duration-300"
      />
    </svg>
  );
}

function WaterIcon({ color, isHovered }: { color: string; isHovered: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path
        d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
        fill={color}
        opacity="0.3"
      />
      <path
        d={`M12 ${isHovered ? '8' : '12'}.69l5.66 5.66a8 8 0 1 1-11.31 0z`}
        fill={color}
        className="transition-all duration-500"
      />
      {isHovered && (
        <>
          <circle cx="8" cy="18" r="1" fill="white" opacity="0.5" className="animate-bounce" style={{ animationDuration: '0.6s' }} />
          <circle cx="14" cy="16" r="1.5" fill="white" opacity="0.4" className="animate-bounce" style={{ animationDuration: '0.8s', animationDelay: '0.2s' }} />
        </>
      )}
    </svg>
  );
}

function FoodIcon({ color, isHovered }: { color: string; isHovered: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M12 3V12L17 17"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        className={`transition-transform duration-300 ${isHovered ? 'rotate-12' : 'rotate-0'}`}
        style={{ transformOrigin: '12px 12px' }}
      />
      <circle
        cx="12"
        cy="12"
        r="2"
        fill={color}
        className={`transition-transform duration-200 ${isHovered ? 'scale-150' : 'scale-100'}`}
        style={{ transformOrigin: 'center' }}
      />
    </svg>
  );
}

function SpeedIcon({ color, isHovered }: { color: string; isHovered: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path
        d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M12 12L16 6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        className={`transition-transform duration-300 ${isHovered ? 'rotate-45' : 'rotate-0'}`}
        style={{ transformOrigin: '12px 12px' }}
      />
      <circle cx="12" cy="12" r="2" fill={color} />
    </svg>
  );
}

function TimerIcon({ color, isHovered }: { color: string; isHovered: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <circle
        cx="12"
        cy="13"
        r="8"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      <path d="M12 9V13L15 15" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M9 2H15" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M12 2V4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {isHovered && (
        <circle
          cx="12"
          cy="13"
          r="6"
          stroke={color}
          strokeWidth="1"
          fill="none"
          opacity="0.3"
          className="animate-ping"
        />
      )}
    </svg>
  );
}

function TargetIcon({ color, isHovered }: { color: string; isHovered: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none" />
      <circle cx="12" cy="12" r="6" stroke={color} strokeWidth="2" fill="none" />
      <circle
        cx="12"
        cy="12"
        r={isHovered ? "3" : "2"}
        fill={color}
        className="transition-all duration-300"
      />
      {isHovered && (
        <circle
          cx="12"
          cy="12"
          r="8"
          stroke={color}
          strokeWidth="1"
          fill="none"
          opacity="0.5"
          className="animate-pulse"
        />
      )}
    </svg>
  );
}

// Icon selector
function MetricIcon({ type, color, isHovered }: { type: string; color: string; isHovered: boolean }) {
  const config = getMetricConfig(type);
  const iconProps = { color, isHovered };

  switch (config.icon) {
    case 'steps': return <StepsIcon {...iconProps} />;
    case 'heart': return <HeartIcon {...iconProps} />;
    case 'flame': return <FlameIcon {...iconProps} />;
    case 'moon': return <MoonIcon {...iconProps} />;
    case 'scale': return <ScaleIcon {...iconProps} />;
    case 'droplet': return <DropletIcon {...iconProps} />;
    case 'lung': return <LungIcon {...iconProps} />;
    case 'thermometer': return <ThermometerIcon {...iconProps} />;
    case 'bolt': return <BoltIcon {...iconProps} />;
    case 'brain': return <BrainIcon {...iconProps} />;
    case 'water': return <WaterIcon {...iconProps} />;
    case 'food': return <FoodIcon {...iconProps} />;
    case 'speed': return <SpeedIcon {...iconProps} />;
    case 'timer': return <TimerIcon {...iconProps} />;
    case 'target': return <TargetIcon {...iconProps} />;
    default: return <TargetIcon {...iconProps} />;
  }
}

interface MetricCardProps {
  metric: Metric;
}

export default function MetricCard({ metric }: MetricCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);
  const config = getMetricConfig(metric.type);
  const color = config.color;

  const handleCopyJson = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(JSON.stringify(metric, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle CGM reading_log data - calculate stats from the array
  const getValueFromMetric = (): { displayValue: number; readingCount?: number; min?: number; max?: number } => {
    if (metric.value !== undefined) {
      return { displayValue: metric.value };
    }
    if (metric.reading_log && metric.reading_log.length > 0) {
      const values = metric.reading_log.map(r => r.value);
      const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
      const min = Math.min(...values);
      const max = Math.max(...values);
      return { displayValue: avg, readingCount: values.length, min, max };
    }
    return { displayValue: 0 };
  };

  const valueData = getValueFromMetric();

  // Check if this is CGM data with reading_log
  const isCGMData = metric.reading_log && metric.reading_log.length > 0;

  // Render CGM chart for CGM data with reading_log
  if (isCGMData && metric.reading_log) {
    return (
      <CGMChart
        readings={metric.reading_log}
        unit={metric.unit}
      />
    );
  }

  const formatValue = (value: number, unit: string): string => {
    if (unit === 'count') {
      return value.toLocaleString();
    }
    if (unit === 'm' && value >= 1000) {
      return `${(value / 1000).toFixed(2)}`;
    }
    if (unit === 's' && value >= 60) {
      const hours = Math.floor(value / 3600);
      const mins = Math.floor((value % 3600) / 60);
      const secs = Math.round(value % 60);
      if (hours > 0) {
        return `${hours}h ${mins}m`;
      }
      return `${mins}m ${secs}s`;
    }
    if (typeof value === 'number') {
      if (value % 1 !== 0) {
        return value.toFixed(1);
      }
      return value.toLocaleString();
    }
    return String(value);
  };

  const getDisplayUnit = (unit: string, value: number): string => {
    if (unit === 'count') return '';
    if (unit === 'm' && value >= 1000) return 'km';
    if (unit === 's' && value >= 60) return '';
    return unit;
  };

  const formatType = (type: string): string => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl p-4 cursor-pointer
        bg-gradient-to-br from-gray-800/80 to-gray-900/80
        border border-gray-700/50
        transition-all duration-300 ease-out
        ${isHovered ? 'scale-[1.02] shadow-lg border-opacity-100' : 'scale-100'}
      `}
      style={{
        borderColor: isHovered ? `${color}40` : undefined,
        boxShadow: isHovered ? `0 8px 32px ${color}20` : undefined,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setShowJson(!showJson)}
    >
      {/* Animated background gradient on hover */}
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${color}10 0%, transparent 60%)`,
          opacity: isHovered ? 1 : 0,
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {showJson ? (
          /* JSON View */
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 font-medium">{formatType(metric.type)} JSON</span>
              <button
                onClick={handleCopyJson}
                className="p-1 rounded hover:bg-gray-700/50 transition-colors text-gray-400 hover:text-white"
                title="Copy JSON"
              >
                {copied ? (
                  <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
            <pre className="bg-gray-900/70 rounded-lg p-2 text-[10px] text-gray-300 overflow-x-auto max-h-48 overflow-y-auto">
              {JSON.stringify(metric, null, 2)}
            </pre>
            <p className="text-[10px] text-gray-500 mt-2 text-center">Click to close</p>
          </div>
        ) : (
          /* Visual View */
          <>
            <div className="flex items-start justify-between gap-3">
              {/* Icon */}
              <div
                className={`
                  p-2.5 rounded-xl transition-all duration-300
                  ${isHovered ? 'scale-110' : 'scale-100'}
                `}
                style={{
                  backgroundColor: `${color}20`,
                  boxShadow: isHovered ? `0 0 20px ${color}30` : 'none',
                }}
              >
                <MetricIcon type={metric.type} color={color} isHovered={isHovered} />
              </div>

              {/* Origin badge */}
              {metric.origin && (
                <span
                  className={`
                    text-xs px-2 py-1 rounded-full font-medium
                    transition-all duration-300
                    ${isHovered ? 'scale-105' : 'scale-100'}
                  `}
                  style={{
                    backgroundColor: `${color}20`,
                    color: color,
                  }}
                >
                  {metric.origin}
                </span>
              )}
            </div>

            {/* Metric name */}
            <p className="text-xs text-gray-400 mt-3 font-medium tracking-wide">
              {formatType(metric.type)}
            </p>

            {/* Value */}
            <div className="flex items-baseline gap-1.5 mt-1">
              <span
                className={`
                  text-2xl font-bold transition-all duration-300
                  ${isHovered ? 'scale-105' : 'scale-100'}
                `}
                style={{
                  color: isHovered ? color : 'white',
                  textShadow: isHovered ? `0 0 20px ${color}40` : 'none',
                  transformOrigin: 'left bottom',
                }}
              >
                {formatValue(valueData.displayValue, metric.unit)}
              </span>
              <span className="text-sm text-gray-500 font-medium">
                {getDisplayUnit(metric.unit, valueData.displayValue)}
              </span>
            </div>

            {/* CGM reading_log stats - show range and count */}
            {valueData.readingCount && (
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <span>{valueData.readingCount} readings</span>
                <span>•</span>
                <span>Range: {valueData.min}-{valueData.max}</span>
              </div>
            )}

            {/* Subtle animated line at bottom */}
            <div className="mt-3 h-1 rounded-full overflow-hidden bg-gray-700/50">
              <div
                className={`
                  h-full rounded-full transition-all duration-500
                  ${isHovered ? 'w-full' : 'w-0'}
                `}
                style={{ backgroundColor: color }}
              />
            </div>

            {/* Hint to click */}
            <p className="text-[10px] text-gray-600 mt-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
              Click for JSON
            </p>
          </>
        )}
      </div>
    </div>
  );
}
