import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ErrorBoundary from './components/common/ErrorBoundary';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex flex-col font-sans transition-colors duration-300">
        <Navbar />
        <main className="flex-1 flex flex-col">
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>
    </ErrorBoundary>
  );
};

export default App;
