'use client';

import React, { useState } from 'react';

// Define the structure for a single winner's entry
type WinnerEntry = {
  position: number;
  chestNo: string;
  name: string;
  school: string;
  points?: number; // Optional manual points
};

// Define the structure for a team entry
type TeamEntry = {
  teamName: string;
  school: string;
  points: number;
};

// Define the props for the component, allowing an eventName to be passed in
interface ScoreSheetEntryProps {
  defaultEventName?: string;
  onSuccess?: () => void;
}

const SCHOOLS = [
  { name: "School of Business and Management", short: "SBM" },
  { name: "School of Commerce, Finance and Accountancy", short: "SCFA" },
  { name: "School of Psychological Sciences", short: "SOPS" },
  { name: "School of Sciences", short: "SOS" },
  { name: "School of Social Sciences", short: "SOSS" },
];

const TEAM_EVENTS = [
  { name: "Football", id: "SIDT01" },
  { name: "Basketball", id: "SIDT02" },
  { name: "Volleyball", id: "SIDT03" },
  { name: "Kabaddi", id: "SIDT04" },
  { name: "Badminton", id: "SIDT05" },
  { name: "Table Tennis", id: "SIDT06" },
  { name: "Chess", id: "SIDT07" },
  { name: "Beach Volleyball", id: "SIDT08" },
  { name: "Throwball", id: "SIDT09" },
  { name: "Mix relay", id: "SIDT10" },
];

export function ScoreSheetEntry({ defaultEventName = '', onSuccess }: ScoreSheetEntryProps) {
  const [eventType, setEventType] = useState<'individual' | 'team'>('individual');
  const [eventName, setEventName] = useState(defaultEventName);
  const [selectedTeamEvent, setSelectedTeamEvent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' }); // For success/error messages

  // Initial state for 3 positions (1st, 2nd, 3rd) for individual events
  const [winners, setWinners] = useState<WinnerEntry[]>([
    { position: 1, chestNo: '', name: '', school: '' },
    { position: 2, chestNo: '', name: '', school: '' },
    { position: 3, chestNo: '', name: '', school: '' },
  ]);

  // State for team event
  const [teamEntry, setTeamEntry] = useState<TeamEntry>({
    teamName: '',
    school: '',
    points: 0,
  });

  /**
   * Handles changes to any input field for any winner.
   * @param index The position (0, 1, or 2) being updated.
   * @param field The field name (chestNo, name, school, points) being changed.
   * @param value The new value from the input.
   */
  const handleInputChange = (index: number, field: keyof Omit<WinnerEntry, 'position'>, value: string | number) => {
    const newWinners = [...winners];
    if (field === 'points') {
      newWinners[index][field] = value as number;
    } else {
      newWinners[index][field] = value as string;
    }
    setWinners(newWinners);
  };

  /**
   * Handles changes to team entry fields.
   */
  const handleTeamInputChange = (field: keyof TeamEntry, value: string | number) => {
    setTeamEntry(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  /**
   * Handles the form submission.
   * Sends the event name and winner/team data to the backend API route.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    // Basic validation
    if (eventType === 'individual' && !eventName.trim()) {
      setMessage({ text: 'Please enter an Event Name.', type: 'error' });
      setIsLoading(false);
      return;
    }

    if (eventType === 'team' && !selectedTeamEvent) {
      setMessage({ text: 'Please select a Team Event.', type: 'error' });
      setIsLoading(false);
      return;
    }

    if (eventType === 'individual') {
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
          body: JSON.stringify({
            eventType: 'individual',
            eventName,
            winners: validWinners
          }),
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

      } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        setMessage({ text: `❌ ${errorMessage}`, type: 'error' });
      } finally {
        setIsLoading(false);
      }
    } else {
      // Team event validation
      if (!teamEntry.teamName.trim() || !teamEntry.school || teamEntry.points <= 0) {
        setMessage({ text: 'Please fill all team details and ensure points > 0.', type: 'error' });
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/save-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'team',
            eventName: selectedTeamEvent,
            teamEntry,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save team score.');
        }

        setMessage({ text: '✅ Team score saved successfully!', type: 'success' });

        if (onSuccess) {
          onSuccess();
        }

      } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        setMessage({ text: `❌ ${errorMessage}`, type: 'error' });
      } finally {
        setIsLoading(false);
      }
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

      {/* Event Type Selection */}
      <div className="mb-8">
        <label htmlFor="eventType" className="block text-sm font-bold text-gray-700 mb-2">
          Event Type
        </label>
        <select
          id="eventType"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-lg"
          value={eventType}
          onChange={(e) => setEventType(e.target.value as 'individual' | 'team')}
        >
          <option value="individual">Individual Event</option>
          <option value="team">Team Event</option>
        </select>
      </div>

      {/* Event Name Input for Individual */}
      {eventType === 'individual' && (
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
      )}

      {/* Team Event Selection */}
      {eventType === 'team' && (
        <div className="mb-8">
          <label htmlFor="teamEvent" className="block text-sm font-bold text-gray-700 mb-2">
            Select Team Event
          </label>
          <select
            id="teamEvent"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-lg"
            value={selectedTeamEvent}
            onChange={(e) => setSelectedTeamEvent(e.target.value)}
            required
          >
            <option value="">Select an event</option>
            {TEAM_EVENTS.map((event) => (
              <option key={event.id} value={event.name}>
                {event.name} ({event.id})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {eventType === 'individual' && winners.map((winner, index) => (
          <div key={winner.position} className={`p-5 rounded-lg border-l-8 ${getPositionStyles(index)}`}>
             <h3 className="font-bold text-xl mb-4 text-gray-700">
                {getPositionEmoji(index)}
             </h3>

             {/* Grid layout for inputs */}
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    <select
                        id={`school-${index}`}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                        value={winner.school}
                        onChange={(e) => handleInputChange(index, 'school', e.target.value)}
                    >
                        <option value="">Select School</option>
                        {SCHOOLS.map((school) => (
                          <option key={school.short} value={school.name}>
                            {school.name} ({school.short})
                          </option>
                        ))}
                    </select>
                </div>
                {/* Manual Points (Optional) */}
                <div>
                    <label htmlFor={`points-${index}`} className="block text-xs font-medium text-gray-500 mb-1">Points (Optional)</label>
                    <input
                        type="number"
                        id={`points-${index}`}
                        placeholder="Auto: 5/3/1"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                        value={winner.points || ''}
                        onChange={(e) => handleInputChange(index, 'points', parseInt(e.target.value) || 0)}
                        min="0"
                    />
                </div>
             </div>
          </div>
        ))}

        {eventType === 'team' && (
          <div className="p-5 rounded-lg border-l-8 bg-blue-50 border-blue-400">
            <h3 className="font-bold text-xl mb-4 text-gray-700">
              🏆 Team Entry
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Team Name */}
              <div>
                <label htmlFor="teamName" className="block text-xs font-medium text-gray-500 mb-1">Team Name</label>
                <input
                  type="text"
                  id="teamName"
                  placeholder="Team Name"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                  value={teamEntry.teamName}
                  onChange={(e) => handleTeamInputChange('teamName', e.target.value)}
                  required
                />
              </div>
              {/* School */}
              <div>
                <label htmlFor="teamSchool" className="block text-xs font-medium text-gray-500 mb-1">School</label>
                <select
                  id="teamSchool"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                  value={teamEntry.school}
                  onChange={(e) => handleTeamInputChange('school', e.target.value)}
                  required
                >
                  <option value="">Select School</option>
                  {SCHOOLS.map((school) => (
                    <option key={school.short} value={school.name}>
                      {school.name} ({school.short})
                    </option>
                  ))}
                </select>
              </div>
              {/* Points */}
              <div>
                <label htmlFor="teamPoints" className="block text-xs font-medium text-gray-500 mb-1">Points</label>
                <input
                  type="number"
                  id="teamPoints"
                  placeholder="Points"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                  value={teamEntry.points || ''}
                  onChange={(e) => handleTeamInputChange('points', parseInt(e.target.value) || 0)}
                  min="1"
                  required
                />
              </div>
            </div>
          </div>
        )}

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
