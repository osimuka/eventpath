import React, { useState, useEffect } from 'react';
import { api } from '../lib/apiClient';

export default function Insights() {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState('');

  const loadInsights = async () => {
    if (!selectedWorkflow) return;
    setLoading(true);
    try {
      const response = await api.analytics.getInsights(selectedWorkflow);
      setInsights(response.data);
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8">AI Insights</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={selectedWorkflow}
              onChange={(e) => setSelectedWorkflow(e.target.value)}
              placeholder="Enter workflow ID"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            />
            <button
              onClick={loadInsights}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Get Insights'}
            </button>
          </div>
        </div>

        {insights && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Insights</h2>
            <div className="space-y-4">
              {insights.insights?.map((insight: string, i: number) => (
                <div key={i} className="p-4 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-gray-800">{insight}</p>
                </div>
              ))}
            </div>

            {insights.recommendations && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
                <ul className="space-y-2">
                  {insights.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
