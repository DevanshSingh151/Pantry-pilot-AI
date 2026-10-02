import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Pantry from './pages/Pantry';
import AddItem from './pages/AddItem';
import Recipes from './pages/Recipes';
import Analytics from './pages/Analytics';
import ShoppingList from './pages/ShoppingList';
import ExpiringSoon from './pages/ExpiringSoon';
import { LayoutDashboard, Refrigerator, Plus, ChefHat, BarChart3, ShoppingCart, ClockAlert, Sparkles, Settings } from 'lucide-react';
import clsx from 'clsx';

function Sidebar() {
  const location = useLocation();
  
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'My Pantry', path: '/pantry', icon: Refrigerator },
    { name: 'Add Item', path: '/add', icon: Plus },
    { name: 'Expiring Soon', path: '/expiring', icon: ClockAlert },
    { name: 'Recipes', path: '/recipes', icon: ChefHat },
    { name: 'Shopping List', path: '/shopping', icon: ShoppingCart },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen fixed top-0 left-0">
      <div className="p-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
            <Refrigerator className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">PantryPilot</h1>
            <p className="text-xs text-gray-500 font-medium">Smart Pantry Management</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                "flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isActive 
                  ? "bg-emerald-50 text-emerald-700" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className={clsx("w-5 h-5 mr-3", isActive ? "text-emerald-600" : "text-gray-400")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors mb-1">
          <Sparkles className="w-5 h-5 mr-3 text-gray-400" />
          AI Insights
        </button>
        <button className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
          <Settings className="w-5 h-5 mr-3 text-gray-400" />
          Settings
        </button>
      </div>
    </aside>
  );
}

import BillAnalysis from './pages/BillAnalysis';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pantry" element={<Pantry />} />
            <Route path="/add" element={<AddItem />} />
            <Route path="/bill-analysis" element={<BillAnalysis />} />
            <Route path="/expiring" element={<ExpiringSoon />} />
            <Route path="/recipes" element={<Recipes />} />
            <Route path="/shopping" element={<ShoppingList />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
