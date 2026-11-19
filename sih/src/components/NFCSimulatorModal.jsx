import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Radio, CheckCircle, X } from 'lucide-react';

export const NFCSimulatorModal = () => {
  const { isNFCModalOpen, setIsNFCModalOpen, activeRecord, markNFCWritten } = useApp();
  const [isSimulating, setIsSimulating] = useState(true);
  const [isDone, setIsDone] = useState(false);

  if (!isNFCModalOpen) return null;

  const handleStartTap = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setIsDone(true);
      if (activeRecord) {
        markNFCWritten(activeRecord.id);
      }
    }, 1800);
  };

  const handleClose = () => {
    setIsNFCModalOpen(false);
    setIsSimulating(true);
    setIsDone(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-sm w-full p-6 text-center shadow-xl border border-gray-200 relative">
        
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-md"
        >
          <X size={20} />
        </button>

        {!isDone ? (
          <div>
            <h3 className="font-bold text-lg text-gray-900 mb-1">Save to NFC Tag</h3>
            <p className="text-xs text-gray-500 mb-6">Hold your phone close to the scale's digital sticker</p>

            {/* Pulsing NFC Circle */}
            <div className="relative w-28 h-28 mx-auto mb-6 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-[#0F5C5C]/15 animate-soft-pulse"></div>
              <div className="w-20 h-20 rounded-full bg-[#0F5C5C] text-white flex items-center justify-center shadow-lg relative z-10">
                <Radio size={36} className="animate-bounce" />
              </div>
            </div>

            <p className="text-xs font-semibold text-gray-700 mb-6">
              Simulating Phone Tap...
            </p>

            <button
              onClick={handleStartTap}
              className="w-full bg-[#0F5C5C] hover:bg-[#0B4747] text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              Simulate NFC Touch
            </button>
          </div>
        ) : (
          <div className="py-2">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} />
            </div>

            <h3 className="font-bold text-lg text-gray-900 mb-2">Saved to Scale!</h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Done! This scale now shows its check history when tapped by any customer or inspector.
            </p>

            <button
              onClick={handleClose}
              className="w-full bg-gray-900 hover:bg-black text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
