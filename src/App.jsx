import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PaxSelector from './components/PaxSelector';
import BundleBuilder from './pages/BundleBuilder';
import BundleList from './pages/BundleList';

function App() {
  return (
    <Router>
      <Routes>
        {/* The link for your customers */}
        <Route path="/" element={<PaxSelector />} />
        
        {/* Your secret link to build bundles */}
        <Route path="/admin/builder" element={<BundleBuilder />} />

        <Route path="/bundles" element={<BundleList />} />
      </Routes>
    </Router>
  );
}

export default App;
