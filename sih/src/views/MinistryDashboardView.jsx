import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  BarChart3, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Lock, 
  ShieldCheck, 
  FileText,
  Edit3
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const MinistryDashboardView = () => {
  const { 
    records, 
    verifyRecordTampering, 
    setIsTamperModalOpen, 
    setEditingRecord,
    reports 
  } = useApp();

  // Stat Calculations
  const totalChecked = records.length;
  const goodRecords = records.filter(r => r.status === 'GOOD');
  const notOkRecords = records.filter(r => r.status === 'NOT OK');
  const tamperedRecords = records.filter(r => verifyRecordTampering(r).isTampered);

  const goodPercentage = totalChecked > 0 ? Math.round((goodRecords.length / totalChecked) * 100) : 0;

  // Prepare chart data grouped by instrument type
  const chartDataMap = {};
  records.forEach(rec => {
    const type = rec.instrumentType || 'Shop Scale';
    if (!chartDataMap[type]) {
      chartDataMap[type] = { name: type, Good: 0, NotOK: 0 };
    }
    if (rec.status === 'GOOD') {
      chartDataMap[type].Good += 1;
    } else {
      chartDataMap[type].NotOK += 1;
    }
  });

  const chartData = Object.values(chartDataMap);

  const handleEditRecord = (record) => {
    setEditingRecord(record);
    setIsTamperModalOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      
      {/* Dashboard Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-200">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#0F5C5C]">
            Legal Metrology Department
          </span>
          <h1 className="text-3xl font-bold text-gray-900 mt-0.5">
            Ministry Compliance Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700">
          <ShieldCheck size={16} className="text-[#0F5C5C]" />
          <span>Real-time Field Sync</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
            Total Checked
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-gray-900">{totalChecked}</span>
            <FileText size={22} className="text-gray-400" />
          </div>
          <p className="text-[11px] text-gray-500 mt-2">Instruments verified</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
            Good Compliance %
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-emerald-700">{goodPercentage}%</span>
            <CheckCircle2 size={22} className="text-emerald-600" />
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-2">{goodRecords.length} scales within standard</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
            Needs Attention
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-rose-700">{notOkRecords.length}</span>
            <XCircle size={22} className="text-rose-600" />
          </div>
          <p className="text-[11px] text-rose-600 font-semibold mt-2">Scales off by too much</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
            Tamper Alerts
          </span>
          <div className="flex items-baseline justify-between">
            <span className={`text-3xl font-extrabold ${tamperedRecords.length > 0 ? 'text-rose-600' : 'text-gray-900'}`}>
              {tamperedRecords.length}
            </span>
            <AlertTriangle size={22} className={tamperedRecords.length > 0 ? 'text-rose-600' : 'text-gray-400'} />
          </div>
          <p className="text-[11px] text-gray-500 mt-2">Lock mismatch detected</p>
        </div>

      </div>

      {/* Bar Chart Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8 shadow-xs">
        <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 size={18} className="text-[#0F5C5C]" />
          Scale Checks by Instrument Type
        </h2>

        <div className="h-64 w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#6b7280" fontSize={11} />
              <YAxis stroke="#6b7280" fontSize={11} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
              <Bar dataKey="Good" fill="#0F5C5C" radius={[4, 4, 0, 0]} name="GOOD ✓" />
              <Bar dataKey="NotOK" fill="#E11D48" radius={[4, 4, 0, 0]} name="NOT OK ✗" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Consumer Reports Notification Banner if present */}
      {reports.length > 0 && (
        <div className="mb-8 bg-amber-50 border border-amber-200 rounded-lg p-5">
          <h3 className="font-bold text-sm text-amber-900 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} />
            Submitted Consumer Complaints ({reports.length})
          </h3>
          <div className="space-y-2">
            {reports.map((rep) => (
              <div key={rep.id} className="bg-white p-3 rounded-md border border-amber-200 text-xs flex items-center justify-between gap-4">
                <div>
                  <span className="font-bold text-gray-900">{rep.shopName}</span>
                  <p className="text-gray-600 italic">"{rep.comment}"</p>
                </div>
                <span className="text-[10px] text-gray-500 shrink-0">{rep.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Master Records Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-bold text-base text-gray-900">
            Master Verification Records ({records.length})
          </h2>
          <span className="text-xs text-gray-500">Live Hash Locking Enabled</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-700">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Record ID</th>
                <th className="py-3 px-4">Shop Name</th>
                <th className="py-3 px-4">Instrument</th>
                <th className="py-3 px-4">Reading</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Tamper Lock</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {records.map((rec) => {
                const tamperStatus = verifyRecordTampering(rec);
                const isGood = rec.status === 'GOOD';

                return (
                  <tr key={rec.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900">{rec.id}</td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">{rec.shopName}</td>
                    <td className="py-3.5 px-4">{rec.instrumentType}</td>
                    <td className="py-3.5 px-4 font-mono">{rec.reading} {rec.unit}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md ${
                        isGood ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {isGood ? 'GOOD ✓' : 'NOT OK ✗'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {tamperStatus.isTampered ? (
                        <span className="bg-rose-600 text-white font-bold px-2 py-0.5 rounded-md text-[10px] flex items-center gap-1 w-fit">
                          <AlertTriangle size={12} />
                          TAMPERED
                        </span>
                      ) : (
                        <span className="bg-teal-50 text-[#0F5C5C] font-semibold px-2 py-0.5 rounded-md text-[10px] border border-teal-200 flex items-center gap-1 w-fit font-mono">
                          <Lock size={11} />
                          LOCKED ({rec.originalHash?.slice(0, 6)})
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleEditRecord(rec)}
                        className="text-gray-600 hover:text-[#0F5C5C] font-semibold flex items-center gap-1 ml-auto"
                      >
                        <Edit3 size={13} />
                        Simulate Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
