export default function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Analytics & Reports</h1>
        <p className="text-sm text-slate-500 font-medium">Deep dive into historical food waste data.</p>
      </div>
      
      <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Advanced Analytics Generating</h2>
        <p className="text-slate-500 font-medium max-w-md mx-auto mb-6">
          The machine learning model is currently processing historical data to generate predictive insights. Check back soon.
        </p>
        <button className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-colors">
          Download Raw Data (CSV)
        </button>
      </div>
    </div>
  );
}
