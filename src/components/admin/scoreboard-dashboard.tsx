'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ScoreSheetEntry } from './scoreboard-control';

interface SchoolScore {
  school: string;
  totalPoints: number;
}

interface Winner {
  prize: string;
  name: string;
  event: string;
  school: string;
  chestNo?: string;
  position?: number;
  eventId?: string;
}

interface EventWins {
  [event: string]: { [school: string]: number };
}

export function ScoreboardDashboard() {
  const [overallScore, setOverallScore] = useState<{ [key: string]: { totalPoints: number; wins: { [event: string]: number } } }>({});
  const [topSchools, setTopSchools] = useState<SchoolScore[]>([]);
  const [recentWinners, setRecentWinners] = useState<Winner[]>([]);
  const [eventWins, setEventWins] = useState<EventWins>({});
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [showGraph, setShowGraph] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New state for adding schools and scores
  const [newSchoolName, setNewSchoolName] = useState('');
  const [showAddSchool, setShowAddSchool] = useState(false);
  const [showAddScore, setShowAddScore] = useState(false);
  const [addSchoolLoading, setAddSchoolLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Delete states
  const [showDeleteWinner, setShowDeleteWinner] = useState(false);
  const [showDeleteSchool, setShowDeleteSchool] = useState(false);
  const [deleteWinnerData, setDeleteWinnerData] = useState({
    eventName: '',
    position: '',
    chestNo: '',
    studentName: '',
    schoolName: '',
  });
  const [deleteSchoolData, setDeleteSchoolData] = useState({
    schoolName: '',
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchScores();
  }, []);

  const fetchScores = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/fetch-school-scores');
      if (!response.ok) {
        throw new Error('Failed to fetch scores');
      }
      const data = await response.json();
      setOverallScore(data.overallScore);
      setTopSchools(data.topSchools);
      setRecentWinners(data.recentWinners);
      setEventWins(data.eventWins);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleScoreClick = (school: string) => {
    setSelectedSchool(school);
    setShowGraph(true);
  };

  const closeGraph = () => {
    setShowGraph(false);
    setSelectedSchool(null);
  };

  const getGraphData = () => {
    if (!selectedSchool || !eventWins) return [];
    return Object.entries(eventWins).map(([event, schools]) => ({
      event,
      wins: schools[selectedSchool] || 0,
    }));
  };

  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddSchoolLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch('/api/add-school', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolName: newSchoolName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add school');
      }

      setMessage({ text: '✅ School added successfully!', type: 'success' });
      setNewSchoolName('');
      setShowAddSchool(false);
      fetchScores(); // Refresh the data
    } catch (err) {
      setMessage({ text: `❌ ${err instanceof Error ? err.message : 'An error occurred'}`, type: 'error' });
    } finally {
      setAddSchoolLoading(false);
    }
  };

  const handleDeleteWinner = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch('/api/delete-winner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deleteWinnerData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete winner');
      }

      setMessage({ text: data.message, type: 'success' });
      setShowDeleteWinner(false);
      setDeleteWinnerData({
        eventName: '',
        position: '',
        chestNo: '',
        studentName: '',
        schoolName: '',
      });
      fetchScores(); // Refresh the data
    } catch (err) {
      setMessage({ text: `❌ ${err instanceof Error ? err.message : 'An error occurred'}`, type: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch('/api/delete-school', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deleteSchoolData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete school');
      }

      setMessage({ text: data.message, type: 'success' });
      setShowDeleteSchool(false);
      setDeleteSchoolData({ schoolName: '' });
      fetchScores(); // Refresh the data
    } catch (err) {
      setMessage({ text: `❌ ${err instanceof Error ? err.message : 'An error occurred'}`, type: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-white shadow-xl rounded-2xl border border-gray-200 font-inter">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center">
          <span className="text-4xl mr-3">🏆</span> Score Control Dashboard
        </h2>
        <div className="flex gap-4">
          <button
            onClick={() => setShowAddSchool(!showAddSchool)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {showAddSchool ? 'Cancel' : '+ Add School'}
          </button>
          <button
            onClick={() => setShowAddScore(!showAddScore)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {showAddScore ? 'Cancel' : '+ Add Score'}
          </button>
          <button
            onClick={() => setShowDeleteWinner(!showDeleteWinner)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {showDeleteWinner ? 'Cancel' : '🗑️ Delete Winner'}
          </button>
          <button
            onClick={() => setShowDeleteSchool(!showDeleteSchool)}
            className="bg-red-800 hover:bg-red-900 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {showDeleteSchool ? 'Cancel' : '🏫 Delete School'}
          </button>
        </div>
      </div>

      {/* Add School Form */}
      {showAddSchool && (
        <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Add New School</h3>
          <form onSubmit={handleAddSchool} className="flex gap-4">
            <input
              type="text"
              placeholder="Enter school name"
              value={newSchoolName}
              onChange={(e) => setNewSchoolName(e.target.value)}
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
            <button
              type="submit"
              disabled={addSchoolLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {addSchoolLoading ? 'Adding...' : 'Add School'}
            </button>
          </form>
        </div>
      )}

      {/* Add Score Form */}
      {showAddScore && (
        <div className="mb-8">
          <ScoreSheetEntry onSuccess={() => {
            setShowAddScore(false);
            fetchScores();
          }} />
        </div>
      )}

      {/* Delete Winner Form */}
      {showDeleteWinner && (
        <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-xl font-bold text-red-800 mb-4">⚠️ Delete Winner - Multi-Step Verification</h3>
          <p className="text-red-600 mb-4">Please provide ALL the following details to confirm deletion:</p>
          <form onSubmit={handleDeleteWinner} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
              <input
                type="text"
                placeholder="e.g., 100m Sprint Boys Final"
                value={deleteWinnerData.eventName}
                onChange={(e) => setDeleteWinnerData({...deleteWinnerData, eventName: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position (1, 2, or 3)</label>
              <input
                type="number"
                min="1"
                max="3"
                placeholder="1"
                value={deleteWinnerData.position}
                onChange={(e) => setDeleteWinnerData({...deleteWinnerData, position: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chest Number</label>
              <input
                type="text"
                placeholder="123"
                value={deleteWinnerData.chestNo}
                onChange={(e) => setDeleteWinnerData({...deleteWinnerData, chestNo: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
              <input
                type="text"
                placeholder="Full Name"
                value={deleteWinnerData.studentName}
                onChange={(e) => setDeleteWinnerData({...deleteWinnerData, studentName: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
              <input
                type="text"
                placeholder="School Name"
                value={deleteWinnerData.schoolName}
                onChange={(e) => setDeleteWinnerData({...deleteWinnerData, schoolName: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                required
              />
            </div>
            <div className="md:col-span-2 flex gap-4">
              <button
                type="submit"
                disabled={deleteLoading}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {deleteLoading ? 'Deleting...' : '🗑️ Confirm Delete Winner'}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteWinner(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete School Form */}
      {showDeleteSchool && (
        <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-xl font-bold text-red-800 mb-4">⚠️ Delete School - Verification Required</h3>
          <p className="text-red-600 mb-4">⚠️ WARNING: This will permanently delete the school. The school must have NO associated scores to be deleted.</p>
          <form onSubmit={handleDeleteSchool} className="flex gap-4">
            <input
              type="text"
              placeholder="Enter exact school name to delete"
              value={deleteSchoolData.schoolName}
              onChange={(e) => setDeleteSchoolData({...deleteSchoolData, schoolName: e.target.value})}
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
              required
            />
            <button
              type="submit"
              disabled={deleteLoading}
              className="bg-red-800 hover:bg-red-900 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {deleteLoading ? 'Deleting...' : '🏫 Confirm Delete School'}
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteSchool(false)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Message Display */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg text-center font-medium ${message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Overall School Scores */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-700 mb-4">Overall School Scores</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topSchools.map((school, index) => (
            <div
              key={school.school}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              onClick={() => handleScoreClick(school.school)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-lg font-bold">{school.school}</h4>
                  <p className="text-2xl font-bold">{school.totalPoints} pts</p>
                </div>
                <div className="text-4xl">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Winners Carousel */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-700 mb-4">Recent Winners</h3>
        <div className="overflow-x-auto">
          <div className="flex space-x-4 pb-4">
            {recentWinners.map((winner, index) => (
              <div
                key={index}
                className="bg-gray-100 p-4 rounded-lg min-w-64 shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">{winner.prize}</div>
                  <div className="text-lg font-bold text-gray-800">{winner.name}</div>
                  <div className="text-sm text-gray-600">{winner.event}</div>
                  <div className="text-sm font-semibold text-blue-600">{winner.school}</div>
                  {winner.chestNo && (
                    <div className="text-xs text-gray-500 mt-1">Chest: {winner.chestNo}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Graph Modal */}
      {showGraph && selectedSchool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold">{selectedSchool} - Event Wins</h3>
              <button
                onClick={closeGraph}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getGraphData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="event" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="wins" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
