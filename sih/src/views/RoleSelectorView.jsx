import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Store, Eye, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';

export const RoleSelectorView = () => {
  const { navigateTo } = useApp();

  const roles = [
    {
      id: 'inspector',
      title: 'Inspector',
      subtitle: 'Perform official scale checks, lock results, and test tamper detection.',
      icon: ShieldCheck,
      badge: 'Official Flow',
      actionText: 'Open Inspector Hub'
    },
    {
      id: 'shopkeeper',
      title: 'Shopkeeper',
      subtitle: 'Self-check your shop scale, view past history, and find help offices.',
      icon: Store,
      badge: 'My Shop',
      actionText: 'Open My Shop'
    },
    {
      id: 'consumer',
      title: 'Consumer',
      subtitle: 'Scan any scale NFC/QR code to confirm it is fair and safe to buy from.',
      icon: Eye,
      badge: 'Public Verification',
      actionText: 'Check a Scale'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:py-16">
      
      {/* Intro Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-[#0F5C5C] text-xs font-semibold mb-4 border border-teal-100">
          <Lock size={13} />
          Digital Verification System
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 mb-4">
          MetroVerify
        </h1>
        <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
          Instant, tamper-proof checks for weighing scales and meters. Select your role to start the live interactive prototype.
        </p>
      </div>

      {/* 3 Large Tappable Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roles.map((role) => {
          const Icon = role.icon;
          return (
            <div
              key={role.id}
              onClick={() => navigateTo(role.id, 'home')}
              className="group bg-white rounded-lg border border-gray-200 p-6 shadow-xs hover:shadow-md hover:border-[#0F5C5C] transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-teal-50 text-[#0F5C5C] flex items-center justify-center group-hover:bg-[#0F5C5C] group-hover:text-white transition-colors">
                    <Icon size={24} />
                  </div>
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded-md">
                    {role.badge}
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-[#0F5C5C] transition-colors">
                  {role.title}
                </h2>
                
                <p className="text-xs text-gray-600 leading-relaxed mb-6">
                  {role.subtitle}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-[#0F5C5C] group-hover:translate-x-0.5 transition-transform">
                <span>{role.actionText}</span>
                <ArrowRight size={16} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Bullet Summary */}
      <div className="mt-16 bg-gray-50 rounded-lg p-6 border border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-[#0F5C5C]" />
          <span>Calculates scale accuracy automatically</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-[#0F5C5C]" />
          <span>Instant tamper-detection via hash locking</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-[#0F5C5C]" />
          <span>Shared real-time data across all users</span>
        </div>
      </div>

    </div>
  );
};
