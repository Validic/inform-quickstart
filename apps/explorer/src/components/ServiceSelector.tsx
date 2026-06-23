'use client';

import {
  Database,
  RefreshCw,
  Sparkles,
  User,
  Users,
  LucideIcon,
} from 'lucide-react';
import { ServiceType, SERVICES, SERVICE_CATEGORIES, ServiceConfig } from '@/types';

const iconMap: Record<string, LucideIcon> = {
  Database,
  RefreshCw,
  Sparkles,
  User,
  Users,
};

interface ServiceSelectorProps {
  selectedService: ServiceType;
  onSelect: (service: ServiceType) => void;
}

export default function ServiceSelector({
  selectedService,
  onSelect,
}: ServiceSelectorProps) {
  return (
    <div className="space-y-4 mb-6">
      {SERVICE_CATEGORIES.map((category) => {
        const categoryServices = SERVICES.filter((s) =>
          category.services.includes(s.id)
        );

        return (
          <div key={category.id}>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              {category.name}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {categoryServices.map((service: ServiceConfig) => {
                const Icon = iconMap[service.icon];
                const isSelected = selectedService === service.id;

                return (
                  <button
                    key={service.id}
                    onClick={() => onSelect(service.id)}
                    className={`
                      p-3 rounded-lg text-left transition-all duration-200
                      ${
                        isSelected
                          ? 'bg-gradient-to-br from-blue-500/30 to-blue-600/20 border-blue-400/50 glow-primary'
                          : 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-700/50 hover:border-gray-600/50'
                      }
                      border
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="p-1.5 rounded-md flex-shrink-0"
                        style={{
                          backgroundColor: `${service.color}20`,
                        }}
                      >
                        <Icon
                          className="w-3.5 h-3.5"
                          style={{ color: service.color }}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-white leading-tight">
                          {service.name}
                        </h3>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
