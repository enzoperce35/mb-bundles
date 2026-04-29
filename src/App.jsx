import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

/* ============================================================
   1. LAZY LOADING
   This splits your app into smaller pieces. 
   Users only download the "BundleList" when they go to that page.
   They NEVER download "BundleBuilder" (saving bandwidth).
   ============================================================ */
const PaxSelector = lazy(() => import('./pages/PaxSelector'));
const BundleList = lazy(() => import('./pages/BundleList'));
const BundleBuilder = lazy(() => import('./pages/BundleBuilder'));
const EditBundle = lazy(() => import('./pages/BundleEditor'));

/* ============================================================
   2. PRE-FETCH TRIGGER
   This function starts downloading the BundleList code 
   while the user is still looking at the Pax selection.
   ============================================================ */
export const preloadBundlePage = () => {
  const component = import('./pages/BundleList');
  // You can also pre-fetch the API here if you want to be extra fast
};

function App() {
  return (
    <Router>
      {/* Suspense handles the small "gap" while a page is being downloaded.
          We use a black background to keep it seamless with your theme.
      */}
      <Suspense fallback={<div className="min-h-screen bg-stone-900" />}>
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<PaxSelector />} />
          
          {/* Customer Facing Bundle List */}
          <Route path="/bundles" element={<BundleList />} />

          {/* Admin Routes (Hidden from standard bundle) */}
          <Route path="/admin/builder" element={<BundleBuilder />} />
          <Route path="/admin/editor/:id" element={<EditBundle />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
