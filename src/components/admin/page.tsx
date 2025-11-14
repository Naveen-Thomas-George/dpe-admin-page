'use client';

import React, { useState, useEffect } from 'react';
import { Search, Users, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface User {
  clearId: string;
  fullName: string;
  schoolShort: string;
  regNumber: string;
  christGmail: string;
  educationLevel: string;
  classSection: string;
  deptShort: string;
  gender: string;
  chestNo?: string;
  attendance: boolean;
  duplicates: number;
}

interface Event {
  id: string;
  name: string;
  category: string;
}

export default function VerificationPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [searchType, setSearchType] = useState<string>('regNumber');
  const [searchValue, setSearchValue] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // Load events on component mount
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/get-events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!selectedEvent) return;

    setSearching(true);
    try {
      const response = await fetch('/api/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'search',
          eventId: selectedEvent,
          searchCriteria: searchValue.trim() ? {
            type: searchType,
            value: searchValue.trim(),
          } : null, // If no search value, pass null to get all users for the event
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        console.error('Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleMarkAttendance = async (clearId: string, attendance: boolean) => {
    try {
      const response = await fetch('/api/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'markAttendance',
          clearId,
          eventId: selectedEvent,
          attendance,
        }),
      });

      if (response.ok) {
        // Update local state
        setUsers(users.map(user =>
          user.clearId === clearId ? { ...user, attendance } : user
        ));
      }
    } catch (error) {
      console.error('Attendance update error:', error);
    }
  };

  const handleAssignChestNumber = async (clearId: string, chestNumber: string) => {
    try {
      const response = await fetch('/api/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assignChestNumber',
          clearId,
          chestNumber,
        }),
      });

      if (response.ok) {
        // Update local state
        setUsers(users.map(user =>
          user.clearId === clearId ? { ...user, chestNo: chestNumber } : user
        ));
      }
    } catch (error) {
      console.error('Chest number update error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Verification Portal</h1>
          <p className="text-gray-600">Manage attendance and chest numbers for event participants</p>
        </div>

        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Participants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Event</label>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose event" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map(event => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name} ({event.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search By</label>
                <Select value={searchType} onValueChange={setSearchType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regNumber">Registration Number</SelectItem>
                    <SelectItem value="gmail">Christ Gmail</SelectItem>
                    <SelectItem value="name">Full Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Value</label>
                <Input
                  type="text"
                  placeholder={
                    searchType === 'regNumber' ? 'Enter reg number' :
                    searchType === 'gmail' ? 'Enter gmail' : 'Enter name'
                  }
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleSearch}
                  disabled={!selectedEvent || searching}
                  className="w-full"
                >
                  {searching ? 'Searching...' : searchValue.trim() ? 'Search' : 'Load All Participants'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {users.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Search Results ({users.length} participant{users.length !== 1 ? 's' : ''})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Reg Number</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Attendance</TableHead>
                      <TableHead>Chest Number</TableHead>
                      <TableHead>Duplicates</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.clearId}>
                        <TableCell className="font-medium">{user.fullName}</TableCell>
                        <TableCell>{user.regNumber}</TableCell>
                        <TableCell>{user.schoolShort}</TableCell>
                        <TableCell>{user.classSection}</TableCell>
                        <TableCell>{user.gender}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={user.attendance}
                              onCheckedChange={(checked) =>
                                handleMarkAttendance(user.clearId, checked as boolean)
                              }
                            />
                            {user.attendance ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            placeholder="Chest #"
                            value={user.chestNo || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^\d{0,4}$/.test(value)) {
                                handleAssignChestNumber(user.clearId, value);
                              }
                            }}
                            className="w-20"
                            maxLength={4}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{user.duplicates}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {users.length === 0 && !searching && selectedEvent && searchValue && (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No participants found</h3>
              <p className="text-gray-500">Try adjusting your search criteria</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
