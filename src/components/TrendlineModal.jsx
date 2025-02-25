import React, { useState } from 'react';
import { X } from 'lucide-react';

function TrendlineModal({ trendline, onClose, onUpdate, onDelete, darkMode }) {
  const [color, setColor] = useState(trendline.color || '#FF0000');
  const [thickness, setThickness] = useState(trendline.thickness || 2);
  const [style, setStyle] = useState(trendline.style || 'solid');

  const [alertName, setAlertName] = useState('');
  const [message, setMessage] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({
      ...trendline,
      color,
      thickness,
      style,
      alertName,
      message,
      expiryDate,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-[#1E222D] rounded-xl shadow-xl border border-[#2A2E39] p-6 w-full max-w-md ${darkMode ? 'text-white' : 'text-gray-900'}`} style={{ opacity: 1, transform: 'none' }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Edit Trendline</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Alert Name</label>
              <input
                type="text"
                value={alertName}
                onChange={(e) => setAlertName(e.target.value)}
                className="w-full p-2 rounded border dark:border-gray-600 bg-[#2A2E39] text-white"
                placeholder="Enter alert name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Message</label>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-2 rounded border dark:border-gray-600 bg-[#2A2E39] text-white"
                placeholder="Enter message"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Expiry Date</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full p-2 rounded border dark:border-gray-600 bg-[#2A2E39] text-white"
              />
            </div>

            <div className="flex space-x-2 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
              >
                SAVE
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
              >
                CANCEL
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TrendlineModal;
