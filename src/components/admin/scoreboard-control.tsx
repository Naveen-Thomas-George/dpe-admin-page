'use client';

import React, { useState } from 'react';

// Define the structure for a single winner's entry
type WinnerEntry = {
  position: number;
  chestNo: string;
  name: string;
  school: string;
};

// Define the props for the component, allowing an eventName to be passed in
interface ScoreSheetEntryProps {
  defaultEventName?: string;
  onSuccess?: () => void;
}

export function ScoreSheetEntry({ defaultEventName = '', onSuccess }: ScoreSheetEntryProps) {
  const [eventName, setEventName] = useState(defaultEventName);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' }); // For success/error messages

  // Initial state for 3 positions (1st, 2nd, 3rd)
  const [winners, setWinners] = useState<WinnerEntry[]>([
    { position: 1, chestNo: '', name: '', school: '' },
    { position: 2, chestNo: '', name: '', school: '' },
    { position: 3, chestNo: '', name: '', school: '' },
  ]);

  /**
   * Handles changes to any input field for any winner.
   * @param index The position (0, 1, or 2) being updated.
   * @param field The field name (chestNo, name, school) being changed.
   * @param value The new value from the input.
   */
  const handleInputChange = (index: number, field: keyof Omit<WinnerEntry, 'position'>, value: string) => {
    const newWinners = [...winners];
    newWinners[index][field] = value;
    setWinners(newWinners);
  };

  /**
   * Handles the form submission.
   * Sends the event name and winner data to the backend API route.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    // Basic validation
    if (!eventName.trim()) {
      setMessage({ text: 'Please enter an Event Name.', type: 'error' });
      setIsLoading(false);
      return;
    }

    // Filter out any entries that are completely empty
    const validWinners = winners.filter(
      w => w.chestNo.trim() !== '' || w.name.trim() !== '' || w.school.trim() !== ''
    );

    if (validWinners.length === 0) {
       setMessage({ text: 'Please enter details for at least one winner.', type: 'error' });
       setIsLoading(false);
       return;
    }

    try {
      // Send data to the Next.js API route
      const response = await fetch('/api/save-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventName, winners: validWinners }), // Send only valid winners
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save score sheet.');
      }

      setMessage({ text: '✅ Score sheet saved successfully!', type: 'success' });

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Optionally clear the form after success
      // setEventName('');
      // setWinners([
      //   { position: 1, chestNo: '', name: '', school: '' },
      //   { position: 2, chestNo: '', name: '', school: '' },
      //   { position: 3, chestNo: '', name: '', school: '' },
      // ]);

    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setMessage({ text: `❌ ${errorMessage}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to get position-specific styling
  const getPositionStyles = (index: number) => {
    switch (index) {
      case 0: return 'bg-yellow-50 border-yellow-400'; // 1st Place
      case 1: return 'bg-gray-50 border-gray-300';     // 2nd Place
      case 2: return 'bg-orange-50 border-orange-300'; // 3rd Place
      default: return 'bg-white border-gray-200';
    }
  };

  // Helper to get position-specific emoji
  const getPositionEmoji = (index: number) => {
     switch (index) {
      case 0: return '🥇 1st Place';
      case 1: return '🥈 2nd Place';
      case 2: return '🥉 3rd Place';
      default: return `Position ${index + 1}`;
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white shadow-xl rounded-2xl border border-gray-200 font-inter">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
        <span className="text-4xl mr-3">🏆</span> Official Event Score Sheet
      </h2>

      {/* Event Name Input */}
      <div className="mb-8">
        <label htmlFor="eventName" className="block text-sm font-bold text-gray-700 mb-2">
          Event Name / ID
        </label>
        <input
          type="text"
          id="eventName"
          placeholder="e.g., 100m Sprint Boys Final"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-lg"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          required
        />
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {winners.map((winner, index) => (
          <div key={winner.position} className={`p-5 rounded-lg border-l-8 ${getPositionStyles(index)}`}>
             <h3 className="font-bold text-xl mb-4 text-gray-700">
                {getPositionEmoji(index)}
             </h3>

             {/* Grid layout for inputs */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Chest Number */}
                <div>
                    <label htmlFor={`chestNo-${index}`} className="block text-xs font-medium text-gray-500 mb-1">Chest No.</label>
                    <input
                        type="text"
                        id={`chestNo-${index}`}
                        placeholder="123"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                        value={winner.chestNo}
                        onChange={(e) => handleInputChange(index, 'chestNo', e.target.value)}
                    />
                </div>
                {/* Athlete Name */}
                <div>
                    <label htmlFor={`name-${index}`} className="block text-xs font-medium text-gray-500 mb-1">Athlete Name</label>
                    <input
                        type="text"
                        id={`name-${index}`}
                        placeholder="Full Name"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                        value={winner.name}
                        onChange={(e) => handleInputChange(index, 'name', e.target.value)}
                    />
                </div>
                {/* School / Team */}
                <div>
                    <label htmlFor={`school-${index}`} className="block text-xs font-medium text-gray-500 mb-1">School / Team</label>
                    <input
                        type="text"
                        id={`school-${index}`}
                        placeholder="School Name"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                        value={winner.school}
                        onChange={(e) => handleInputChange(index, 'school', e.target.value)}
                    />
                </div>
             </div>
          </div>
        ))}

        {/* Message Display Area */}
        {message.text && (
          <div className={`p-4 rounded-lg text-center font-medium ${message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-4 px-6 rounded-lg text-white font-bold text-lg transition-all transform active:scale-95
            ${isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30'
            }`}
        >
          {isLoading ? 'Saving Records...' : '🔒 Submit Final Score Sheet'}
        </button>
      </form>
    </div>
  );
}
