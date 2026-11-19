import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Plus, 
  Camera, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  Radio, 
  AlertTriangle, 
  Edit3, 
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Scale
} from 'lucide-react';
import { INSTRUMENT_TYPES, evaluateReading, getInstrumentConfig } from '../utils/tolerances';

export const InspectorView = () => {
  const { 
    records, 
    activeSubScreen, 
    navigateTo, 
    saveCheckRecord, 
    setIsTamperModalOpen, 
    setEditingRecord,
    setIsNFCModalOpen,
    setActiveRecordId,
    activeRecord,
    verifyRecordTampering
  } = useApp();

  // Local state for scan/input screen (2b)
  const [selectedType, setSelectedType] = useState('shop_scale');
  const [shopName, setShopName] = useState('');
  const [readingInput, setReadingInput] = useState('');
  const [scannedReading, setScannedReading] = useState(null);
  
  // In-progress calculation result for 2c
  const [evalResult, setEvalResult] = useState(null);
  const [isSavedCurrentCheck, setIsSavedCurrentCheck] = useState(false);

  // Helper to switch sub-screens
  const setSubScreen = (screenName) => {
    navigateTo('inspector', screenName);
  };

  // Handle "Simulate Scan" button click
  const handleSimulateScan = () => {
    const config = getInstrumentConfig(selectedType);
    const randomIndex = Math.floor(Math.random() * config.sampleValues.length);
    const randomVal = config.sampleValues[randomIndex];
    setScannedReading(randomVal);
    setReadingInput(randomVal.toString());
  };

  // Handle "Check This Scale" form submit
  const handleCalculateCheck = (e) => {
    e.preventDefault();
    const finalVal = Number(readingInput || scannedReading || 1000);
    const evaluation = evaluateReading(selectedType, finalVal);
    
    setEvalResult({
      ...evaluation,
      shopName: shopName.trim() || 'Local Market Store',
      instrumentType: getInstrumentConfig(selectedType).name
    });
    setIsSavedCurrentCheck(false);
    setSubScreen('result');
  };

  // Handle "Save This Check"
  const handleSaveCheck = () => {
    if (!evalResult) return;
    const newRecord = saveCheckRecord(evalResult);
    setIsSavedCurrentCheck(true);
  };

  // Open Tamper Edit Modal for a specific record
  const handleOpenTamperModal = (record) => {
    setEditingRecord(record);
    setIsTamperModalOpen(true);
  };

  // ==========================================
  // SUB-SCREEN 2a: INSPECTOR HOME
  // ==========================================
  if (activeSubScreen === 'home') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-200">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#0F5C5C]">
              Inspector Workspace
            </span>
            <h1 className="text-3xl font-bold text-gray-900 mt-0.5">
              MetroVerify — Inspector
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSubScreen('tamper')}
              className="px-4 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <AlertTriangle size={15} className="text-amber-600" />
              Tamper Test Demo
            </button>
            <button
              onClick={() => {
                setScannedReading(null);
                setReadingInput('');
                setShopName('');
                setSubScreen('scan');
              }}
              className="px-5 py-2.5 rounded-lg bg-[#0F5C5C] hover:bg-[#0B4747] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus size={16} />
              Start New Check
            </button>
          </div>
        </div>

        {/* Quick Instructions Banner */}
        <div className="bg-teal-50 border border-teal-100 rounded-lg p-4 mb-8 flex items-start gap-3">
          <ShieldCheck size={20} className="text-[#0F5C5C] shrink-0 mt-0.5" />
          <p className="text-xs text-gray-700 leading-relaxed">
            Every check calculates exact deviation amounts against legal boundaries. Tap <strong>Start New Check</strong> to verify a scale, or open <strong>Tamper Test Demo</strong> to test live hash tamper detection.
          </p>
        </div>

        {/* Recent Checks List */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Recent Scale Checks ({records.length})
          </h2>

          <div className="space-y-3">
            {records.map((rec) => {
              const tamperStatus = verifyRecordTampering(rec);
              const isGood = rec.status === 'GOOD';

              return (
                <div
                  key={rec.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isGood ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {isGood ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-gray-900">{rec.shopName}</h3>
                        <span className="text-[10px] bg-gray-100 font-semibold px-2 py-0.5 rounded-md text-gray-600">
                          {rec.instrumentType}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Checked on {rec.date} • Measured: {rec.reading} {rec.unit} • {rec.signedDiffText}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {tamperStatus.isTampered ? (
                      <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200 flex items-center gap-1">
                        <AlertTriangle size={13} />
                        Tampered
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
                        <Lock size={12} />
                        Locked ({rec.originalHash?.slice(0, 8)})
                      </span>
                    )}

                    <button
                      onClick={() => {
                        setActiveRecordId(rec.id);
                        setSubScreen('tamper');
                      }}
                      className="text-xs text-gray-600 hover:text-[#0F5C5C] font-semibold flex items-center gap-1 underline underline-offset-2"
                    >
                      Inspect
                      <ChevronRight size={14} />
                    </button>
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
  // SUB-SCREEN 2b: SCAN SCREEN
  // ==========================================
  if (activeSubScreen === 'scan') {
    const config = getInstrumentConfig(selectedType);

    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        
        <button
          onClick={() => setSubScreen('home')}
          className="text-xs font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1 mb-6"
        >
          <ArrowLeft size={16} />
          Back to Inspector Home
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Check Scale Reading</h1>
        <p className="text-xs text-gray-600 mb-6">
          Point camera at the digital display or enter the reading manually.
        </p>

        <form onSubmit={handleCalculateCheck} className="space-y-6">
          
          {/* Shop Name Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Shop / Vendor Name
            </label>
            <input
              type="text"
              required
              placeholder="E.g., Star Supermarket or Sharma Jewellery"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0F5C5C]"
            />
          </div>

          {/* Instrument Type Selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Instrument Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setScannedReading(null);
                setReadingInput('');
              }}
              className="w-full text-sm px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0F5C5C] bg-white"
            >
              {INSTRUMENT_TYPES.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name} (Ref: {type.reference} {type.unit}, Allowed: ±{type.allowedDiff} {type.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Camera Viewfinder Placeholder */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Camera Viewfinder
            </label>
            <div className="bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center flex flex-col items-center justify-center relative overflow-hidden">
              <Camera size={36} className="text-gray-400 mb-2" />
              <p className="text-xs font-semibold text-gray-600 mb-4">
                Point camera at scale display
              </p>

              {scannedReading !== null && (
                <div className="bg-white/90 border border-gray-200 px-6 py-3 rounded-lg shadow-sm mb-2 animate-fade-in">
                  <span className="text-xs text-gray-500 font-medium block">Scanned Output</span>
                  <span className="text-3xl font-extrabold text-[#0F5C5C]">
                    {scannedReading} <span className="text-sm font-normal text-gray-600">{config.unit}</span>
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={handleSimulateScan}
                className="bg-[#0F5C5C] hover:bg-[#0B4747] text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Camera size={14} />
                Simulate Camera Scan
              </button>
            </div>
          </div>

          {/* Manual Input Alternative */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Or Type The Number Manually ({config.unit})
            </label>
            <input
              type="number"
              step="any"
              required
              placeholder={`Target reference is ${config.reference} ${config.unit}`}
              value={readingInput}
              onChange={(e) => {
                setReadingInput(e.target.value);
                setScannedReading(null);
              }}
              className="w-full text-base font-semibold px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0F5C5C]"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#0F5C5C] hover:bg-[#0B4747] text-white py-3 rounded-lg text-sm font-bold transition-all shadow-xs"
          >
            Check This Scale
          </button>

        </form>

      </div>
    );
  }

  // ==========================================
  // SUB-SCREEN 2c: RESULT SCREEN
  // ==========================================
  if (activeSubScreen === 'result') {
    if (!evalResult) {
      return (
        <div className="max-w-md mx-auto px-4 py-12 text-center">
          <p className="text-sm text-gray-500 mb-4">No check calculation in progress.</p>
          <button
            onClick={() => setSubScreen('scan')}
            className="bg-[#0F5C5C] text-white px-4 py-2 rounded-lg text-xs font-semibold"
          >
            Go to Scan Screen
          </button>
        </div>
      );
    }

    const isGood = evalResult.status === 'GOOD';

    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        
        <button
          onClick={() => setSubScreen('scan')}
          className="text-xs font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1 mb-6"
        >
          <ArrowLeft size={16} />
          Check Another Scale
        </button>

        <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 shadow-xs text-center">
          
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
            Verification Result
          </span>

          <h1 className="text-xl font-bold text-gray-900 mb-6">
            {evalResult.shopName}
          </h1>

          {/* Big Colored Badge */}
          <div className="mb-4">
            {isGood ? (
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-emerald-600 text-white font-extrabold text-2xl tracking-wide shadow-sm">
                <CheckCircle2 size={28} />
                GOOD ✓
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
              <span>{evalResult.deviationStatusText}</span>
            </div>
          </div>

          {/* Plain Sentence Result Summary */}
          <p className="text-sm font-semibold text-gray-900 max-w-md mx-auto mb-6 leading-relaxed">
            {evalResult.summaryText}
          </p>

          {/* Measured Data Grid */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 grid grid-cols-2 gap-3 text-left border border-gray-200 text-xs">
            <div>
              <span className="text-gray-500 block font-medium">Instrument</span>
              <span className="font-bold text-gray-900">{evalResult.instrumentName}</span>
            </div>
            <div>
              <span className="text-gray-500 block font-medium">Measured Reading</span>
              <span className="font-bold text-gray-900">{evalResult.reading} {evalResult.unit}</span>
            </div>
            <div>
              <span className="text-gray-500 block font-medium">Difference Amount</span>
              <span className="font-bold text-gray-900">{evalResult.signedDiffText}</span>
            </div>
            <div>
              <span className="text-gray-500 block font-medium">Allowed Safe Limit</span>
              <span className="font-bold text-gray-900">{evalResult.allowedRangeText}</span>
            </div>
          </div>

          {/* Lock Action Buttons */}
          {!isSavedCurrentCheck ? (
            <button
              onClick={handleSaveCheck}
              className="w-full bg-[#0F5C5C] hover:bg-[#0B4747] text-white py-3 rounded-lg text-sm font-bold transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <Lock size={16} />
              Save This Check
            </button>
          ) : (
            <div className="space-y-3 animate-fade-in">
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-xs text-[#0F5C5C] font-semibold flex items-center justify-center gap-2">
                <Lock size={16} />
                🔒 This result is locked and can't be faked
                <span className="bg-white px-2 py-0.5 rounded-md font-mono text-[11px] border border-teal-200 text-gray-800">
                  {activeRecord?.originalHash?.slice(0, 8)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setIsNFCModalOpen(true)}
                  className="w-full bg-gray-900 hover:bg-black text-white py-2.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Radio size={15} />
                  Save to NFC Tag
                </button>
                <button
                  onClick={() => setSubScreen('tamper')}
                  className="w-full bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 py-2.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <AlertTriangle size={15} />
                  Open Tamper Test
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    );
  }

  // ==========================================
  // SUB-SCREEN 2d: TAMPER TEST (KEY DEMO FEATURE)
  // ==========================================
  if (activeSubScreen === 'tamper') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        <button
          onClick={() => setSubScreen('home')}
          className="text-xs font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1 mb-6"
        >
          <ArrowLeft size={16} />
          Back to Inspector Home
        </button>

        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Tamper Detection Test</h1>
          <span className="text-xs font-bold bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full">
            Core Proof of Concept
          </span>
        </div>

        <p className="text-xs text-gray-600 mb-8 leading-relaxed max-w-2xl">
          Click <strong>"Try to Edit"</strong> on any record below to alter its saved value or status. When saved, the live hash function recalculates against the stored lock fingerprint. If tampered, a real prominent red alert banner will be triggered immediately.
        </p>

        {/* Saved Records List with Live Tamper Calculation */}
        <div className="space-y-4">
          {records.map((rec) => {
            const tamperStatus = verifyRecordTampering(rec);
            const isGood = rec.status === 'GOOD';

            return (
              <div
                key={rec.id}
                className={`bg-white rounded-lg border p-5 transition-all shadow-xs ${
                  tamperStatus.isTampered
                    ? 'border-rose-300 ring-2 ring-rose-100'
                    : 'border-gray-200'
                }`}
              >
                {/* PROMINENT RED TAMPER BANNER */}
                {tamperStatus.isTampered && (
                  <div className="bg-rose-600 text-white rounded-md p-3 mb-4 text-xs font-bold flex items-center justify-between gap-2 shadow-xs">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={18} className="shrink-0 animate-bounce" />
                      <span>
                        ⚠️ This record has been changed and no longer matches its lock. Tampering detected.
                      </span>
                    </div>
                    <span className="text-[10px] bg-white/20 font-mono px-2 py-0.5 rounded-md">
                      Hash Mismatch
                    </span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-base text-gray-900">{rec.shopName}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                        {rec.id}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 mb-1">
                      {rec.instrumentType} • Measured: <strong>{rec.reading} {rec.unit}</strong> ({rec.signedDiffText}) • Status:{' '}
                      <span className={isGood ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                        {rec.status}
                      </span>
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-gray-500 font-mono">
                      <span>Original Lock: <strong className="text-gray-700">{rec.originalHash?.slice(0, 8)}</strong></span>
                      <span>Live Hash: <strong className={tamperStatus.isTampered ? 'text-rose-600' : 'text-emerald-700'}>{tamperStatus.currentHash?.slice(0, 8)}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => handleOpenTamperModal(rec)}
                      className="px-3.5 py-2 rounded-lg bg-gray-900 hover:bg-black text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <Edit3 size={14} />
                      Try to Edit
                    </button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>

      </div>
    );
  }

  return null;
};
