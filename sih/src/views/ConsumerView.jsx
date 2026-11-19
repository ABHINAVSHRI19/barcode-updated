import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, 
  Radio, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowLeft,
  MessageSquare,
  Lock,
  ChevronRight,
  Scale
} from 'lucide-react';

export const ConsumerView = () => {
  const { 
    records, 
    activeSubScreen, 
    navigateTo, 
    activeRecord, 
    setActiveRecordId, 
    setIsReportModalOpen,
    verifyRecordTampering
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');

  const setSubScreen = (screenName) => {
    navigateTo('consumer', screenName);
  };

  // Filter records based on user search query
  const filteredRecords = records.filter(r => 
    r.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle NFC tap simulation button click
  const handleSimulateNFCTap = () => {
    // Pick a random record from saved records
    const randomIndex = Math.floor(Math.random() * records.length);
    const selected = records[randomIndex];
    setActiveRecordId(selected.id);
    setSubScreen('status');
  };

  // ==========================================
  // SUB-SCREEN 4a: CONSUMER HOME & SEARCH
  // ==========================================
  if (activeSubScreen === 'home') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#0F5C5C] block mb-1">
            Consumer Safety
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Is This Scale Trustworthy?
          </h1>
          <p className="text-xs text-gray-600">
            Check official verification records and exact weight deviation for any shop in 2 seconds.
          </p>
        </div>

        {/* NFC Tap / QR Scan Quick Action Card */}
        <div className="bg-gradient-to-b from-teal-50/60 to-white rounded-lg border border-teal-100 p-6 mb-8 text-center shadow-xs">
          <div className="w-14 h-14 rounded-full bg-[#0F5C5C] text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <Radio size={28} className="animate-pulse" />
          </div>
          <h2 className="font-bold text-base text-gray-900 mb-1">Near a Shop Scale?</h2>
          <p className="text-xs text-gray-600 mb-4 max-w-md mx-auto">
            Tap your phone against the scale's digital sticker or scan its QR code to instantly verify its official lock.
          </p>
          <button
            onClick={handleSimulateNFCTap}
            className="bg-[#0F5C5C] hover:bg-[#0B4747] text-white px-6 py-2.5 rounded-lg text-xs font-bold transition-all shadow-xs inline-flex items-center gap-2"
          >
            <Radio size={16} />
            Simulate NFC Tap / QR Scan
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Search Shops or Scale Code
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Enter shop name or code (e.g. Fresh Mart, Royal Jewellers)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0F5C5C] bg-white"
            />
            <Search className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
          </div>
        </div>

        {/* Shop Search Results List */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-3">
            Verified Shops ({filteredRecords.length})
          </h3>

          <div className="space-y-3">
            {filteredRecords.map((rec) => {
              const isGood = rec.status === 'GOOD';
              const tamperStatus = verifyRecordTampering(rec);

              return (
                <div
                  key={rec.id}
                  onClick={() => {
                    setActiveRecordId(rec.id);
                    setSubScreen('status');
                  }}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:border-[#0F5C5C] transition-all cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isGood ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {isGood ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">{rec.shopName}</h4>
                      <p className="text-xs text-gray-500">
                        {rec.instrumentType} • Deviation: {rec.signedDiffText || '0.0g'} • Checked {rec.date}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {tamperStatus.isTampered ? (
                      <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        ⚠️ Tampered
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        ✓ Verified
                      </span>
                    )}
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    );
  }

  // ==========================================
  // SUB-SCREEN 4b: VERIFICATION STATUS SCREEN
  // ==========================================
  if (activeSubScreen === 'status') {
    const record = activeRecord || records[0];
    const isGood = record.status === 'GOOD';
    const tamperStatus = verifyRecordTampering(record);

    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        
        <button
          onClick={() => setSubScreen('home')}
          className="text-xs font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1 mb-6"
        >
          <ArrowLeft size={16} />
          Search Another Shop
        </button>

        <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 text-center shadow-xs">
          
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
            Consumer Verification
          </span>

          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {record.shopName}
          </h1>

          {/* Big Green Tick or Red Cross Badge */}
          <div className="mb-4">
            {isGood ? (
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-emerald-600 text-white font-extrabold text-2xl tracking-wide shadow-sm">
                <CheckCircle2 size={28} />
                VERIFIED GOOD ✓
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-rose-600 text-white font-extrabold text-2xl tracking-wide shadow-sm">
                <XCircle size={28} />
                NOT OK ✗
              </div>
            )}
          </div>

          {/* Exact Deviation Range Highlight Box */}
          <div className={`p-3 rounded-lg border text-xs font-bold mb-5 ${
            isGood ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            <div className="flex items-center justify-center gap-1.5">
              <Scale size={16} />
              <span>{record.deviationStatusText || `Deviation: ${record.signedDiffText} (Limit: ${record.allowedRangeText})`}</span>
            </div>
          </div>

          {/* Plain Inspector & Date Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-xs text-left border border-gray-200 space-y-2">
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-500 font-medium">Instrument Type</span>
              <span className="font-bold text-gray-900">{record.instrumentType}</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-500 font-medium">Measured Reading</span>
              <span className="font-bold text-gray-900">{record.reading} {record.unit}</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-500 font-medium">Difference Amount</span>
              <span className="font-bold text-gray-900">{record.signedDiffText}</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-500 font-medium">Last Checked</span>
              <span className="font-bold text-gray-900">{record.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Checked By</span>
              <span className="font-bold text-gray-900">{record.inspector}</span>
            </div>
          </div>

          {/* Live Hash Tamper Status Line */}
          <div className="mb-8">
            {!tamperStatus.isTampered ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs font-semibold text-emerald-800 flex items-center justify-center gap-2">
                <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                <span>✓ This information hasn't been changed</span>
                <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-emerald-200 text-gray-700">
                  Lock #{tamperStatus.originalHash?.slice(0, 8)}
                </span>
              </div>
            ) : (
              <div className="bg-rose-600 text-white rounded-lg p-4 text-xs font-bold flex flex-col items-center justify-center gap-1 shadow-xs animate-shake">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={20} />
                  <span className="text-sm">⚠️ Something looks wrong with this record</span>
                </div>
                <p className="text-[11px] text-rose-100 font-normal">
                  The information on this scale does not match its lock signature. Tampering detected!
                </p>
              </div>
            )}
          </div>

          {/* Report Button */}
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="w-full bg-gray-900 hover:bg-black text-white py-3 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
          >
            <MessageSquare size={16} />
            Something feels wrong? Report it
          </button>

        </div>

      </div>
    );
  }

  return null;
};
