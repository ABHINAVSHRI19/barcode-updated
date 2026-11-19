import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Send } from 'lucide-react';

export const ReportModal = () => {
  const { isReportModalOpen, setIsReportModalOpen, activeRecord, submitConsumerReport } = useApp();
  const [commentText, setCommentText] = useState('');

  if (!isReportModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    submitConsumerReport(
      activeRecord ? activeRecord.id : 'MV-GENERAL',
      activeRecord ? activeRecord.shopName : 'Unknown Shop',
      commentText
    );

    setCommentText('');
    setIsReportModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl border border-gray-200">
        
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <h3 className="font-bold text-lg text-gray-900">Report a Problem</h3>
          <button 
            onClick={() => setIsReportModalOpen(false)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Shop Name
            </label>
            <input 
              type="text" 
              disabled 
              value={activeRecord ? activeRecord.shopName : 'Shop'}
              className="w-full text-sm px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-700 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              What feels wrong with this scale?
            </label>
            <textarea
              rows={3}
              required
              placeholder="E.g., The reading jumped by 50g when placing 1kg vegetables, or the screen looked tampered."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0F5C5C] resize-none"
            />
          </div>

          <p className="text-xs text-gray-500">
            Your report goes directly to the district Legal Metrology officer for quick check.
          </p>

          <button
            type="submit"
            className="w-full bg-[#0F5C5C] hover:bg-[#0B4747] text-white py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Send size={16} />
            Send Report
          </button>
        </form>

      </div>
    </div>
  );
};
