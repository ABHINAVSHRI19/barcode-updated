import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Store, 
  CheckCircle2, 
  XCircle, 
  Star, 
  MapPin, 
  ArrowLeft, 
  Navigation, 
  ShieldCheck,
  RefreshCw,
  HelpCircle,
  Scale
} from 'lucide-react';
import { INSTRUMENT_TYPES, evaluateReading, getInstrumentConfig } from '../utils/tolerances';

export const ShopkeeperView = () => {
  const { records, activeSubScreen, navigateTo } = useApp();

  // Sub-screen navigation state
  const setSubScreen = (screenName) => {
    navigateTo('shopkeeper', screenName);
  };

  // Local state for self-check
  const [selectedType, setSelectedType] = useState('shop_scale');
  const [readingVal, setReadingVal] = useState('998');
  const [selfCheckResult, setSelfCheckResult] = useState(null);

  // Shopkeeper scale history (e.g., Fresh Mart Grocery records)
  const myShopRecords = records.filter(r => r.shopName.toLowerCase().includes('fresh mart') || r.shopName.toLowerCase().includes('grocery'));
  const displayRecords = myShopRecords.length > 0 ? myShopRecords : records.slice(0, 3);
  
  // Calculate if last 3 checks were all "GOOD" for Trusted Shop badge
  const last3Checks = displayRecords.slice(0, 3);
  const isTrustedShop = last3Checks.length > 0 && last3Checks.every(c => c.status === 'GOOD');

  // Handle self-check calculation
  const handleRunSelfCheck = (e) => {
    e.preventDefault();
    const numericVal = Number(readingVal || 1000);
    const evaluation = evaluateReading(selectedType, numericVal);
    setSelfCheckResult(evaluation);
    setSubScreen('result');
  };

  // ==========================================
  // SUB-SCREEN 3a: SHOPKEEPER HOME
  // ==========================================
  if (activeSubScreen === 'home') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#0F5C5C]">
                Shopkeeper Hub
              </span>
              {isTrustedShop && (
                <span className="bg-amber-100 text-amber-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Star size={12} className="fill-amber-500 text-amber-500" />
                  Trusted Shop ⭐
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mt-0.5">
              MetroVerify — My Shop
            </h1>
          </div>

          <button
            onClick={() => setSubScreen('check')}
            className="px-5 py-3 rounded-lg bg-[#0F5C5C] hover:bg-[#0B4747] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <RefreshCw size={16} />
            Check My Scale
          </button>
        </div>

        {/* Feature Banner: Guidance for Unaware Shopkeepers */}
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <HelpCircle size={22} className="text-[#0F5C5C] shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm text-gray-900">Unaware of your machine's accuracy status?</h3>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                Over time, weighing scales drift off calibration. Track your exact deviation range below or tap <strong>Check My Scale</strong> to test your machine in 10 seconds.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSubScreen('office')}
            className="px-4 py-2 bg-[#0F5C5C] hover:bg-[#0B4747] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
          >
            <MapPin size={14} />
            Find Nearest Office
          </button>
        </div>

        {/* Scale Check History with Deviation Details */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            My Scale Accuracy History
          </h2>

          <div className="space-y-3">
            {displayRecords.map((rec) => {
              const isGood = rec.status === 'GOOD';
              return (
                <div
                  key={rec.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isGood ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {isGood ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-900">{rec.instrumentType}</h3>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Reading: <strong>{rec.reading} {rec.unit}</strong> • Deviation: <span className="font-semibold text-gray-900">{rec.signedDiffText}</span> (Limit: {rec.allowedRangeText})
                      </p>
                      <p className="text-[11px] text-gray-500">Checked on {rec.date} by {rec.inspector}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className={`text-xs font-bold px-3 py-1 rounded-md ${
                      isGood ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {rec.status === 'GOOD' ? 'GOOD ✓' : 'NOT OK ✗'}
                    </span>
                    {!isGood && (
                      <button
                        onClick={() => setSubScreen('office')}
                        className="text-xs font-bold text-rose-700 hover:text-rose-900 underline flex items-center gap-1"
                      >
                        Fix at Office
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Office Map Quick Link Card */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-sm text-gray-900">Need Scale Stamping or Calibration?</h3>
            <p className="text-xs text-gray-600 mt-1">Locate your nearest Legal Metrology department office for verification or re-stamping.</p>
          </div>
          <button
            onClick={() => setSubScreen('office')}
            className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
          >
            <MapPin size={14} />
            Find Nearest Office
          </button>
        </div>

      </div>
    );
  }

  // ==========================================
  // SUB-SCREEN 3a (Check input modal/form)
  // ==========================================
  if (activeSubScreen === 'check') {
    const config = getInstrumentConfig(selectedType);

    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        
        <button
          onClick={() => setSubScreen('home')}
          className="text-xs font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1 mb-6"
        >
          <ArrowLeft size={16} />
          Back to My Shop
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Check My Scale Accuracy</h1>
        <p className="text-xs text-gray-600 mb-6">
          Unsure if your scale is displaying the right weight? Test it here against standard weight limits.
        </p>

        <form onSubmit={handleRunSelfCheck} className="space-y-5 bg-white p-6 rounded-lg border border-gray-200 shadow-xs">
          
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Select Scale Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0F5C5C]"
            >
              {INSTRUMENT_TYPES.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name} (Standard Reference: {type.reference} {type.unit}, Allowed: ±{type.allowedDiff} {type.unit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Test Weight Reading ({config.unit})
            </label>
            <input
              type="number"
              step="any"
              required
              value={readingVal}
              onChange={(e) => setReadingVal(e.target.value)}
              className="w-full text-base font-semibold px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0F5C5C]"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Place a 1kg standard test weight (or 10L test container) on your scale and type what it displays.
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-[#0F5C5C] hover:bg-[#0B4747] text-white py-3 rounded-lg text-sm font-bold transition-all shadow-xs"
          >
            Check Scale Now
          </button>

        </form>

      </div>
    );
  }

  // ==========================================
  // SUB-SCREEN 3b: SELF-CHECK RESULT
  // ==========================================
  if (activeSubScreen === 'result') {
    if (!selfCheckResult) {
      return (
        <div className="max-w-md mx-auto px-4 py-12 text-center">
          <p className="text-sm text-gray-500 mb-4">No scale check running.</p>
          <button onClick={() => setSubScreen('home')} className="bg-[#0F5C5C] text-white px-4 py-2 rounded-lg text-xs font-semibold">
            Return to My Shop
          </button>
        </div>
      );
    }

    const isGood = selfCheckResult.status === 'GOOD';

    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        
        <button
          onClick={() => setSubScreen('home')}
          className="text-xs font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1 mb-6"
        >
          <ArrowLeft size={16} />
          Back to My Shop
        </button>

        <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 text-center shadow-xs">
          
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
            Self-Check Result
          </span>

          {/* Badge */}
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
              <span>{selfCheckResult.deviationStatusText}</span>
            </div>
          </div>

          <p className="text-sm font-semibold text-gray-900 max-w-md mx-auto mb-6 leading-relaxed">
            {selfCheckResult.summaryText}
          </p>

          {/* Unaware Shopkeeper Guidance Card */}
          <div className={`rounded-lg p-5 mb-6 text-left border ${
            isGood ? 'bg-teal-50 border-teal-200' : 'bg-rose-50 border-rose-200'
          }`}>
            <h3 className={`font-bold text-sm mb-1 ${isGood ? 'text-teal-900' : 'text-rose-900'}`}>
              {isGood ? 'Keep Up the Good Accuracy!' : 'Action Needed: Scale Exceeds Safe Range'}
            </h3>
            <p className={`text-xs leading-relaxed mb-4 ${isGood ? 'text-teal-800' : 'text-rose-800'}`}>
              {selfCheckResult.shopkeeperGuidance}
            </p>

            {!isGood && (
              <button
                onClick={() => setSubScreen('office')}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <MapPin size={15} />
                Find Nearest Office & Get Directions
              </button>
            )}
          </div>

          <button
            onClick={() => setSubScreen('home')}
            className="w-full bg-gray-900 hover:bg-black text-white py-2.5 rounded-lg text-xs font-semibold transition-colors"
          >
            Done
          </button>

        </div>

      </div>
    );
  }

  // ==========================================
  // SUB-SCREEN 3c: NEAREST OFFICE SCREEN
  // ==========================================
  if (activeSubScreen === 'office') {
    const mockOffices = [
      {
        name: 'Central Legal Metrology Office',
        address: 'District Headquarters, Civil Lines',
        distance: '2.3 km',
        timing: 'Mon-Fri: 9:30 AM - 5:30 PM'
      },
      {
        name: 'Zonal Inspectorate Office (North)',
        address: 'Market Yard Complex, Sector 4',
        distance: '4.8 km',
        timing: 'Mon-Fri: 10:00 AM - 5:00 PM'
      }
    ];

    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        
        <button
          onClick={() => setSubScreen('home')}
          className="text-xs font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1 mb-6"
        >
          <ArrowLeft size={16} />
          Back to My Shop
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Nearest Legal Metrology Offices</h1>
        <p className="text-xs text-gray-600 mb-6">
          Visit any official center for annual scale stamping, inspection, or re-calibration.
        </p>

        {/* Mock Map Placeholder */}
        <div className="bg-gray-100 rounded-lg border border-gray-300 h-48 mb-6 flex flex-col items-center justify-center relative overflow-hidden text-center p-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#0F5C5C] text-white flex items-center justify-center shadow-md">
              <MapPin size={18} />
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-700 text-white flex items-center justify-center shadow-md">
              <MapPin size={18} />
            </div>
          </div>
          <span className="text-xs font-bold text-gray-700">Simulated Map View</span>
          <span className="text-[11px] text-gray-500">2 Legal Metrology Inspector Offices nearby</span>
        </div>

        {/* Office Cards List */}
        <div className="space-y-4">
          {mockOffices.map((office, idx) => (
            <div key={idx} className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-gray-900">{office.name}</h3>
                  <span className="text-xs font-bold text-[#0F5C5C] bg-teal-50 px-2 py-0.5 rounded-md">
                    {office.distance}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">{office.address}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{office.timing}</p>
              </div>

              <a
                href={`https://www.google.com/maps/search/${encodeURIComponent(office.name)}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-[#0F5C5C] hover:bg-[#0B4747] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-center"
              >
                <Navigation size={14} />
                Get Directions
              </a>
            </div>
          ))}
        </div>

      </div>
    );
  }

  return null;
};
