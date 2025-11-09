'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SchoolScore {
  school: string;
  totalPoints: number;
}

interface Winner {
  prize: string;
  name: string;
  event: string;
  school: string;
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

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-white shadow-xl rounded-2xl border border-gray-200 font-inter">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
        <span className="text-4xl mr-3">🏆</span> Score Control Dashboard
      </h2>

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
