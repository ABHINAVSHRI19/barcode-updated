import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, User, Store, Eye, BarChart3, Home } from 'lucide-react';

export const Header = () => {
  const { activeRole, activeSubScreen, navigateTo } = useApp();

  const rolePills = [
    { id: 'landing', label: 'Home', icon: Home },
    { id: 'inspector', label: 'Inspector', icon: ShieldCheck },
    { id: 'shopkeeper', label: 'Shopkeeper', icon: Store },
    { id: 'consumer', label: 'Consumer', icon: Eye },
    { id: 'admin', label: 'Ministry Admin', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div 
          onClick={() => navigateTo('landing', 'home')}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 rounded-lg bg-[#0F5C5C] text-white flex items-center justify-center font-bold text-lg">
            M
          </div>
          <div>
            <h1 className="font-bold text-xl leading-tight tracking-tight text-[#111111] group-hover:text-[#0F5C5C] transition-colors">
              MetroVerify
            </h1>
            <p className="text-[10px] text-gray-500 font-medium tracking-wider uppercase">
              SIH26036 • Legal Metrology
            </p>
          </div>
        </div>

        {/* Role Switcher Pills (Header Demo Navigation) */}
        <nav className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-lg">
          {rolePills.map(role => {
            const Icon = role.icon;
            const isActive = activeRole === role.id;
            return (
              <button
                key={role.id}
                onClick={() => navigateTo(role.id, 'home')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  isActive
                    ? 'bg-[#0F5C5C] text-white shadow-xs'
                    : 'text-gray-600 hover:text-[#111111] hover:bg-gray-200/60'
                }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{role.label}</span>
              </button>
            );
          })}
        </nav>

      </div>
    </header>
  );
};
