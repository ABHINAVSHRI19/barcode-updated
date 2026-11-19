import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const TamperEditModal = () => {
  const { 
    isTamperModalOpen, 
    setIsTamperModalOpen, 
    editingRecord, 
    updateRecordForTamperTest,
    resetRecordHashLock
  } = useApp();

  const [reading, setReading] = useState('');
  const [status, setStatus] = useState('GOOD');

  useEffect(() => {
    if (editingRecord) {
      setReading(editingRecord.reading || '');
      setStatus(editingRecord.status || 'GOOD');
    }
  }, [editingRecord]);

  if (!isTamperModalOpen || !editingRecord) return null;

  const handleSaveEdit = (e) => {
    e.preventDefault();
    updateRecordForTamperTest(editingRecord.id, reading, status);
    setIsTamperModalOpen(false);
  };

  const handleResetLock = () => {
    resetRecordHashLock(editingRecord.id);
    setIsTamperModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl border border-gray-200">
        
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-amber-600" size={20} />
            <h3 className="font-bold text-lg text-gray-900">Simulate Data Edit</h3>
          </div>
          <button 
            onClick={() => setIsTamperModalOpen(false)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-xs text-gray-600 my-4 leading-relaxed bg-amber-50 p-3 rounded-lg border border-amber-200">
          <strong>Demo Feature:</strong> Change the scale reading or result status below without re-locking it. Upon saving, the live hash calculation will no longer match the original lock fingerprint, triggering an instant <strong>Tampering Detected</strong> alert!
        </p>

        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Shop Name
            </label>
            <input 
              type="text" 
              disabled 
              value={editingRecord.shopName}
              className="w-full text-sm px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Measured Reading ({editingRecord.unit})
            </label>
            <input 
              type="number"
              step="any"
              value={reading}
              onChange={(e) => setReading(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0F5C5C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Status Result
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus('GOOD')}
                className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                  status === 'GOOD'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                GOOD ✓
              </button>
              <button
                type="button"
                onClick={() => setStatus('NOT OK')}
                className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                  status === 'NOT OK'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                NOT OK ✗
              </button>
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-2">
            <button
              type="submit"
              className="w-full bg-[#0F5C5C] hover:bg-[#0B4747] text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              Save Edited Record (Test Tamper Logic)
            </button>
            <button
              type="button"
              onClick={handleResetLock}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 size={14} />
              Re-lock with Fresh Fingerprint
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
