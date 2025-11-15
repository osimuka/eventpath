import React from 'react';

interface EventTableProps {
  events: Array<{
    id: string;
    eventName: string;
    userId?: string;
    timestamp: string;
    properties?: Record<string, unknown>;
  }>;
}

export const EventTable: React.FC<EventTableProps> = ({ events }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-gray-300 px-4 py-2">Event</th>
            <th className="border border-gray-300 px-4 py-2">User ID</th>
            <th className="border border-gray-300 px-4 py-2">Timestamp</th>
            <th className="border border-gray-300 px-4 py-2">Properties</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td className="border border-gray-300 px-4 py-2">{event.eventName}</td>
              <td className="border border-gray-300 px-4 py-2">{event.userId || '-'}</td>
              <td className="border border-gray-300 px-4 py-2">{event.timestamp}</td>
              <td className="border border-gray-300 px-4 py-2">
                {JSON.stringify(event.properties || {})}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
