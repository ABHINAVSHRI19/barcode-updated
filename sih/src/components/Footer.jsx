import React from 'react';
import { useApp } from '../context/AppContext';

export const Footer = () => {
  const { navigateTo } = useApp();

  return (
    <footer className="bg-white border-t border-gray-200 py-6 mt-16 text-sm text-gray-500">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">MetroVerify</span>
          <span>•</span>
          <span>Digital Verification System for SIH26036</span>
        </div>

        <div className="flex items-center gap-6 text-xs">
          <button 
            onClick={() => navigateTo('landing')}
            className="hover:text-[#0F5C5C] transition-colors"
          >
            Role Selector
          </button>
          <button 
            onClick={() => navigateTo('admin')}
            className="hover:text-[#0F5C5C] font-semibold text-[#0F5C5C] underline underline-offset-4"
          >
            Ministry Admin View
          </button>
        </div>

      </div>
    </footer>
  );
};
