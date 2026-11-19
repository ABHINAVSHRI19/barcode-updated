import React, { createContext, useContext, useState } from 'react';
import { generateRecordHash, verifyRecordTampering } from '../utils/crypto';

const AppContext = createContext();

const initialSeedData = [
  {
    id: 'MV-1001',
    shopName: 'Fresh Mart Grocery',
    instrumentType: 'Shop Scale',
    reading: 998,
    unit: 'grams',
    reference: 1000,
    allowedDiff: 5,
    signedDiffText: '-2.0 grams',
    allowedRangeText: '±5.0 grams',
    deviationStatusText: 'Deviation: -2.0 grams (Within safe range of ±5.0 grams)',
    status: 'GOOD',
    inspector: 'Inspector R. Sharma',
    date: '2026-09-02',
    summaryText: 'This scale is accurate and safe for customers to use.',
    shopkeeperGuidance: 'Your scale is working accurately. No calibration needed right now.',
    nfcWritten: true,
  },
  {
    id: 'MV-1002',
    shopName: 'Royal Jewellers',
    instrumentType: 'Gold Scale',
    reading: 999.8,
    unit: 'grams',
    reference: 1000,
    allowedDiff: 0.5,
    signedDiffText: '-0.2 grams',
    allowedRangeText: '±0.5 grams',
    deviationStatusText: 'Deviation: -0.2 grams (Within safe range of ±0.5 grams)',
    status: 'GOOD',
    inspector: 'Inspector R. Sharma',
    date: '2026-09-03',
    summaryText: 'This scale is accurate and safe for customers to use.',
    shopkeeperGuidance: 'Your scale is working accurately. No calibration needed right now.',
    nfcWritten: true,
  },
  {
    id: 'MV-1003',
    shopName: 'City Fuel Station',
    instrumentType: 'Petrol Pump Meter',
    reading: 9.89,
    unit: 'liters',
    reference: 10.00,
    allowedDiff: 0.05,
    signedDiffText: '-0.11 liters',
    allowedRangeText: '±0.05 liters',
    deviationStatusText: 'Deviation: -0.11 liters (Exceeds safe limit of ±0.05 liters)',
    status: 'NOT OK',
    inspector: 'Inspector A. Verma',
    date: '2026-09-01',
    summaryText: 'This scale is off by 0.11 liters and exceeds the safe limit.',
    shopkeeperGuidance: 'Unaware of your scale condition? Your scale needs re-calibration. Tap Find Nearest Office to get directions to your nearest Legal Metrology center.',
    nfcWritten: false,
  },
  {
    id: 'MV-1004',
    shopName: 'Green Farm Produce',
    instrumentType: 'Shop Scale',
    reading: 1002,
    unit: 'grams',
    reference: 1000,
    allowedDiff: 5,
    signedDiffText: '+2.0 grams',
    allowedRangeText: '±5.0 grams',
    deviationStatusText: 'Deviation: +2.0 grams (Within safe range of ±5.0 grams)',
    status: 'GOOD',
    inspector: 'Inspector R. Sharma',
    date: '2026-08-28',
    summaryText: 'This scale is accurate and safe for customers to use.',
    shopkeeperGuidance: 'Your scale is working accurately. No calibration needed right now.',
    nfcWritten: true,
  },
  {
    id: 'MV-1005',
    shopName: 'Metro Sweets & Bakery',
    instrumentType: 'Shop Scale',
    reading: 991,
    unit: 'grams',
    reference: 1000,
    allowedDiff: 5,
    signedDiffText: '-9.0 grams',
    allowedRangeText: '±5.0 grams',
    deviationStatusText: 'Deviation: -9.0 grams (Exceeds safe limit of ±5.0 grams)',
    status: 'NOT OK',
    inspector: 'Inspector A. Verma',
    date: '2026-08-30',
    summaryText: 'This scale is off by 9.0 grams and exceeds the safe limit.',
    shopkeeperGuidance: 'Unaware of your scale condition? Your scale needs re-calibration. Tap Find Nearest Office to get directions to your nearest Legal Metrology center.',
    nfcWritten: true,
  }
].map(record => ({
  ...record,
  originalHash: generateRecordHash(record)
}));

export const AppProvider = ({ children }) => {
  const [records, setRecords] = useState(initialSeedData);
  const [activeRole, setActiveRole] = useState('landing');
  const [activeSubScreen, setActiveSubScreen] = useState('home'); 
  const [activeRecordId, setActiveRecordId] = useState('MV-1001');
  const [currentScanResult, setCurrentScanResult] = useState(null);
  
  // Modals & UI State
  const [isTamperModalOpen, setIsTamperModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isNFCModalOpen, setIsNFCModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [reports, setReports] = useState([]);

  // Trigger floating toast notification
  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Helper to change role & view
  const navigateTo = (role, subScreen = 'home', recordId = null) => {
    setActiveRole(role);
    setActiveSubScreen(subScreen);
    if (recordId) {
      setActiveRecordId(recordId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Save a newly scanned check record
  const saveCheckRecord = (recordData) => {
    const newId = `MV-${1000 + records.length + 1}`;
    const dateStr = new Date().toISOString().split('T')[0];
    
    const baseRecord = {
      id: newId,
      shopName: recordData.shopName || 'Market Square Shop',
      instrumentType: recordData.instrumentType || 'Shop Scale',
      reading: recordData.reading,
      unit: recordData.unit,
      reference: recordData.reference,
      allowedDiff: recordData.allowedDiff,
      signedDiffText: recordData.signedDiffText,
      allowedRangeText: recordData.allowedRangeText,
      deviationStatusText: recordData.deviationStatusText,
      status: recordData.status,
      inspector: 'Inspector R. Sharma',
      date: dateStr,
      summaryText: recordData.summaryText,
      shopkeeperGuidance: recordData.shopkeeperGuidance,
      nfcWritten: false,
    };

    // Calculate initial hash fingerprint
    const originalHash = generateRecordHash(baseRecord);
    const fullRecord = { ...baseRecord, originalHash };

    setRecords(prev => [fullRecord, ...prev]);
    setActiveRecordId(newId);
    return fullRecord;
  };

  // Edit a record (used for Tamper Testing 2d)
  const updateRecordForTamperTest = (recordId, newReading, newStatus) => {
    setRecords(prev =>
      prev.map(item => {
        if (item.id === recordId) {
          const diffVal = Number(newReading) - item.reference;
          const formattedDiff = `${diffVal >= 0 ? '+' : ''}${diffVal.toFixed(item.unit === 'liters' ? 2 : 1)} ${item.unit}`;
          return {
            ...item,
            reading: Number(newReading),
            status: newStatus,
            signedDiffText: formattedDiff,
            deviationStatusText: newStatus === 'GOOD' 
              ? `Deviation: ${formattedDiff} (Within safe range of ${item.allowedRangeText})`
              : `Deviation: ${formattedDiff} (Exceeds safe limit of ${item.allowedRangeText})`,
            summaryText: newStatus === 'GOOD' 
              ? 'This scale is accurate and safe for customers to use.' 
              : `This scale is off by ${Math.abs(diffVal).toFixed(1)} ${item.unit} and exceeds the safe limit.`,
            shopkeeperGuidance: newStatus === 'GOOD'
              ? 'Your scale is working accurately. No calibration needed right now.'
              : 'Unaware of your scale condition? Your scale needs re-calibration. Tap Find Nearest Office to get directions to your nearest Legal Metrology center.'
          };
        }
        return item;
      })
    );
    showToast('Record updated in database');
  };

  // Restore record original hash
  const resetRecordHashLock = (recordId) => {
    setRecords(prev =>
      prev.map(item => {
        if (item.id === recordId) {
          const freshHash = generateRecordHash(item);
          return { ...item, originalHash: freshHash };
        }
        return item;
      })
    );
    showToast('Record fingerprint re-locked');
  };

  // Mark NFC tag written
  const markNFCWritten = (recordId) => {
    setRecords(prev =>
      prev.map(item =>
        item.id === recordId ? { ...item, nfcWritten: true } : item
      )
    );
    showToast('Saved to NFC Tag successfully');
  };

  // Add consumer report
  const submitConsumerReport = (recordId, shopName, commentText) => {
    const newReport = {
      id: `REP-${Date.now().toString().slice(-4)}`,
      recordId,
      shopName,
      comment: commentText,
      date: new Date().toLocaleDateString()
    };
    setReports(prev => [newReport, ...prev]);
    showToast('Report sent to Legal Metrology officer');
  };

  const activeRecord = records.find(r => r.id === activeRecordId) || records[0];

  return (
    <AppContext.Provider
      value={{
        records,
        activeRole,
        activeSubScreen,
        activeRecordId,
        activeRecord,
        currentScanResult,
        isTamperModalOpen,
        editingRecord,
        isNFCModalOpen,
        isReportModalOpen,
        toastMessage,
        reports,
        navigateTo,
        setCurrentScanResult,
        saveCheckRecord,
        updateRecordForTamperTest,
        resetRecordHashLock,
        markNFCWritten,
        submitConsumerReport,
        setIsTamperModalOpen,
        setEditingRecord,
        setIsNFCModalOpen,
        setIsReportModalOpen,
        showToast,
        verifyRecordTampering
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
