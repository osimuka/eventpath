import React, { useState } from 'react';
import { api } from '../lib/apiClient';

export default function Workflows() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [newWorkflow, setNewWorkflow] = useState({ name: '', events: '' });

  const handleCreateWorkflow = async () => {
    try {
      const response = await api.workflows.create({
        name: newWorkflow.name,
        events: newWorkflow.events.split(',').map((e) => e.trim()),
      });
      setWorkflows([...workflows, response.data]);
      setNewWorkflow({ name: '', events: '' });
    } catch (error) {
      console.error('Error creating workflow:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8">Workflows</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Create New Workflow</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={newWorkflow.name}
                onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Workflow name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Events (comma-separated)
              </label>
              <input
                type="text"
                value={newWorkflow.events}
                onChange={(e) => setNewWorkflow({ ...newWorkflow, events: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="event1, event2, event3"
              />
            </div>
            <button
              onClick={handleCreateWorkflow}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Create Workflow
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Workflows</h2>
          {workflows.length === 0 ? (
            <p className="text-gray-500">No workflows yet</p>
          ) : (
            <div className="space-y-2">
              {workflows.map((workflow) => (
                <div key={workflow.id} className="p-4 border border-gray-200 rounded">
                  <h3 className="font-semibold">{workflow.name}</h3>
                  <p className="text-sm text-gray-500">{workflow.events.join(' > ')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
