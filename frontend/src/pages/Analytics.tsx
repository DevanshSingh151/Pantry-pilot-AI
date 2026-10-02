import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, PieChart, TrendingUp, AlertTriangle } from 'lucide-react';

export default function Analytics() {
  const [stats, setStats] = useState({
    total_items: 0,
    total_quantity: 0,
    expired: 0,
    expiring_soon: 0,
    fresh: 0,
    low_stock: 0,
    insights: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/analytics')
      .then(res => {
        setStats(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Pantry Analytics</h2>
        <p className="mt-1 text-slate-500">Dive deeper into your inventory health.</p>
      </div>

      {loading ? (
        <div className="h-96 bg-slate-200 rounded-2xl animate-pulse"></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center mb-6">
              <PieChart className="w-5 h-5 mr-2 text-indigo-500" />
              Inventory Status Distribution
            </h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-slate-700">Fresh items</span>
                  <span className="text-slate-500">{stats.fresh}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${stats.total_items > 0 ? (stats.fresh / stats.total_items) * 100 : 0}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-slate-700">Expiring Soon (≤ 7 days)</span>
                  <span className="text-slate-500">{stats.expiring_soon}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${stats.total_items > 0 ? (stats.expiring_soon / stats.total_items) * 100 : 0}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-slate-700">Expired</span>
                  <span className="text-slate-500">{stats.expired}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: `${stats.total_items > 0 ? (stats.expired / stats.total_items) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
              <h3 className="text-orange-900 font-semibold flex items-center mb-2">
                <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                Low Stock Alert
              </h3>
              <p className="text-orange-800/80 text-sm">
                You have <strong>{stats.low_stock}</strong> items that are running below your minimum preferred stock level. Consider adding them to your shopping list.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <TrendingUp className="w-6 h-6 text-emerald-500 mb-3" />
                <h4 className="text-sm font-medium text-slate-500">Total Volume</h4>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total_quantity.toFixed(1)} <span className="text-sm font-normal text-slate-500">units</span></p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <BarChart3 className="w-6 h-6 text-indigo-500 mb-3" />
                <h4 className="text-sm font-medium text-slate-500">Waste Risk</h4>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {stats.total_items > 0 ? (((stats.expired + stats.expiring_soon) / stats.total_items) * 100).toFixed(0) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
