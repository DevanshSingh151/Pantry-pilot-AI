import { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, ClockAlert, AlertTriangle, XCircle, ArrowRight, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
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
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Good morning</h1>
          <p className="mt-2 text-slate-500">Here's what's happening with your pantry today.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/recipes')} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium shadow-sm flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-emerald-500" />
            Get Recipe
          </button>
          <button onClick={() => navigate('/add')} className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium shadow-sm shadow-emerald-200">
            + Add Item
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-2xl animate-pulse"></div>)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Items" value={stats.total_items} icon={Package} link="/pantry" color="text-slate-700" bg="bg-slate-100" />
            <StatCard title="Expiring Soon" value={stats.expiring_soon} icon={ClockAlert} link="/expiring" color="text-amber-600" bg="bg-amber-100" />
            <StatCard title="Low Stock" value={stats.low_stock} icon={AlertTriangle} link="/shopping" color="text-orange-600" bg="bg-orange-100" />
            <StatCard title="Expired" value={stats.expired} icon={XCircle} link="/pantry" color="text-red-600" bg="bg-red-100" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-900">Pantry Overview</h2>
              </div>
              <div className="p-6">
                <div className="flex h-4 rounded-full overflow-hidden bg-slate-100 mb-6">
                  {stats.total_items > 0 ? (
                    <>
                      <div style={{ width: `${(stats.fresh / stats.total_items) * 100}%` }} className="bg-emerald-500"></div>
                      <div style={{ width: `${(stats.expiring_soon / stats.total_items) * 100}%` }} className="bg-amber-500"></div>
                      <div style={{ width: `${(stats.expired / stats.total_items) * 100}%` }} className="bg-red-500"></div>
                    </>
                  ) : (
                    <div className="w-full bg-slate-200"></div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      <span className="font-medium text-slate-700">Fresh</span>
                    </div>
                    <p className="text-slate-500 ml-5">{stats.fresh} items</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <span className="font-medium text-slate-700">Expiring Soon</span>
                    </div>
                    <p className="text-slate-500 ml-5">{stats.expiring_soon} items</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="font-medium text-slate-700">Expired</span>
                    </div>
                    <p className="text-slate-500 ml-5">{stats.expired} items</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 shadow-sm p-6 relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-200/50 rounded-full blur-2xl"></div>
              <h2 className="text-lg font-semibold text-indigo-900 flex items-center mb-4 relative z-10">
                <Sparkles className="w-5 h-5 mr-2 text-indigo-500" />
                AI Insights
              </h2>
              <div className="space-y-4 relative z-10">
                {stats.insights?.length > 0 ? (
                  stats.insights.map((insight: any, idx: number) => (
                    <div key={idx} className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-sm text-indigo-900 border border-indigo-100/50">
                      {insight}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-indigo-700/70">No insights available yet.</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, link, color, bg }: any) {
  return (
    <Link to={link} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-slate-500">{title}</h3>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${bg}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
      <div className="mt-4 flex items-center text-sm font-medium text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
        View details <ArrowRight className="w-4 h-4 ml-1" />
      </div>
    </Link>
  );
}
