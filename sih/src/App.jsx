import React from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { TamperEditModal } from './components/TamperEditModal';
import { NFCSimulatorModal } from './components/NFCSimulatorModal';
import { ReportModal } from './components/ReportModal';
import { RoleSelectorView } from './views/RoleSelectorView';
import { InspectorView } from './views/InspectorView';
import { ShopkeeperView } from './views/ShopkeeperView';
import { ConsumerView } from './views/ConsumerView';
import { MinistryDashboardView } from './views/MinistryDashboardView';

const MainContent = () => {
  const { activeRole, toastMessage } = useApp();

  const renderActiveView = () => {
    switch (activeRole) {
      case 'inspector':
        return <InspectorView />;
      case 'shopkeeper':
        return <ShopkeeperView />;
      case 'consumer':
        return <ConsumerView />;
      case 'admin':
        return <MinistryDashboardView />;
      case 'landing':
      default:
        return <RoleSelectorView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white text-[#111111] antialiased">
      <div>
        <Header />
        <main className="transition-opacity duration-200">
          {renderActiveView()}
        </main>
      </div>

      <Footer />

      {/* Shared Modals */}
      <TamperEditModal />
      <NFCSimulatorModal />
      <ReportModal />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-xs font-semibold px-4 py-3 rounded-lg shadow-xl border border-gray-700 animate-slide-up flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default MainContent;
