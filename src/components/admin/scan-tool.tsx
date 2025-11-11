import React, { useRef, useState, useEffect, useCallback } from "react"
import { Camera, X, Copy, Check, AlertCircle, Loader2, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library"

// --- TYPE DEFINITIONS ---
interface UserData {
  user: {
    clearId: string;
    fullName?: string;
    schoolShort?: string;
    regNumber?: string;
    christGmail?: string;
    educationLevel?: string;
    classSection?: string;
    deptShort?: string;
    gender?: string;
    chestNo?: string;
    duplicateWarning?: string;
  };
  registeredEvents: Array<{
    id: string;
    name: string;
    category: string;
  }>;
}

// --- MAIN REACT COMPONENT ---

export function ScanTool() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scannedData, setScannedData] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [detectionStatus, setDetectionStatus] = useState<"idle" | "scanning" | "detected">("idle")
  const [error, setError] = useState<string | null>(null)
  const [isBrowserReady, setIsBrowserReady] = useState(false)

  const [userData, setUserData] = useState<UserData | null>(null)
  const [isFetchingUser, setIsFetchingUser] = useState(false)
  const [userFetchError, setUserFetchError] = useState<string | null>(null)

  const [manualClearId, setManualClearId] = useState<string>("");
  const [manualGmail, setManualGmail] = useState<string>("");
  const [chestNumber, setChestNumber] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [isUpdatingChest, setIsUpdatingChest] = useState(false);
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);
  const [chestUpdateMessage, setChestUpdateMessage] = useState<{ text: string; type: string }>({ text: '', type: '' });
  const [attendanceMessage, setAttendanceMessage] = useState<{ text: string; type: string }>({ text: '', type: '' });

  useEffect(() => {
    setIsBrowserReady(true)
  }, [])

  const fetchUserData = useCallback(async (identifier: string) => {
    setIsFetchingUser(true)
    setUserFetchError(null)
    setUserData(null)

    try {
      // API call to the backend route we defined in route.ts
      const response = await fetch('/api/fetchUserByClearId', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });

      if (!response.ok) {
        let errorMessage = `HTTP Error ${response.status}: ${response.statusText}.`;
        try {
          // Attempt to read error message from the body (as sent by route.ts)
          const errorJson = await response.json();
          errorMessage = errorJson.error || errorMessage;
        } catch {
          // Fallback if the response body is not JSON
          errorMessage = `API failed with status ${response.status}.`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setUserData(data as UserData);

    } catch (err) {
      console.error("User Data Fetch Error:", err);
      const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setUserFetchError(errorMsg);
    } finally {
      setIsFetchingUser(false);
    }
  }, []);

  useEffect(() => {
    // Trigger data fetch whenever a new identifier (scanned or manually entered) is available
    if (scannedData) {
      fetchUserData(scannedData);
    }
  }, [scannedData, fetchUserData]);

  const startScanning = async () => {
    setError(null)
    resetData() // Clear previous results
    setDetectionStatus("scanning")
    setIsScanning(true)
    setManualClearId("");
    setManualGmail("");

    try {
      // Initialize ZXing code reader
      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserMultiFormatReader();
      }

      // 1. Request Camera Access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // 2. Start continuous QR code detection
      const codeReader = codeReaderRef.current;
      const videoElement = videoRef.current;

      if (videoElement) {
        try {
          const result = await codeReader.decodeOnceFromVideoDevice(undefined, videoElement);
          if (result) {
            const scannedText = result.getText();
            console.log("QR Code detected:", scannedText);
            setScannedData(scannedText);
            setDetectionStatus("detected");
            setIsScanning(false);

            // Stop camera
            if (stream) stream.getTracks().forEach(track => track.stop());
            codeReader.reset();
          }
        } catch (scanError) {
          if (scanError instanceof NotFoundException) {
            // No QR code found, continue scanning
            console.log("No QR code found, continuing to scan...");
            // Continue scanning by calling recursively after a short delay
            setTimeout(() => {
              if (isScanning && videoElement) {
                startScanning(); // Restart scanning
              }
            }, 100);
          } else {
            throw scanError;
          }
        }
      }

    } catch (err) {
      let errorMsg = "Unable to access camera. Please allow permissions or use manual entry."
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          errorMsg = "Camera permission denied. Please allow camera access in settings."
        }
      }
      console.error("Scanning error:", err);
      setError(errorMsg)
      setDetectionStatus("idle")
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    // Stop the code reader
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }

    // Stop camera stream
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    setIsScanning(false)
    if (detectionStatus === "scanning") {
      setDetectionStatus("idle");
    }
  }

  const handleManualClearIdFetch = () => {
    if (manualClearId.trim()) {
      stopScanning();
      resetData();
      setScannedData(manualClearId.trim());
      setDetectionStatus("detected");
      setManualGmail(""); 
    }
  };
  
  const handleManualGmailFetch = () => {
    if (manualGmail.trim()) {
      stopScanning();
      resetData();
      setScannedData(manualGmail.trim());
      setDetectionStatus("detected");
      setManualClearId(""); 
    }
  };

  const copyToClipboard = async () => {
    if (scannedData) {
      try {
        await navigator.clipboard.writeText(scannedData);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy: ', err);
        // Fallback to old method
        const el = document.createElement('textarea');
        el.value = scannedData;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  }

  const resetData = () => {
    setScannedData(null)
    setUserFetchError(null)
    setUserData(null)
    setDetectionStatus("idle")
    setError(null)
  }
  
  const resetScan = () => {
    stopScanning()
    resetData()
    setManualClearId("");
    setManualGmail("");
    setChestNumber("");
    setSelectedEvent("");
    setChestUpdateMessage({ text: '', type: '' });
    setAttendanceMessage({ text: '', type: '' });
  }

  const handleUpdateChestNumber = async () => {
    if (!scannedData || !chestNumber.trim()) {
      setChestUpdateMessage({ text: 'Please scan a user and enter chest number', type: 'error' });
      return;
    }

    setIsUpdatingChest(true);
    setChestUpdateMessage({ text: '', type: '' });

    try {
      const response = await fetch('/api/update-chest-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clearId: scannedData,
          chestNumber: chestNumber.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update chest number');
      }

      setChestUpdateMessage({ text: '✅ Chest number updated successfully!', type: 'success' });
      // Refresh user data to show updated chest number
      fetchUserData(scannedData);
      setChestNumber("");
    } catch (error) {
      console.error('Chest number update error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update chest number';
      setChestUpdateMessage({ text: `❌ ${errorMessage}`, type: 'error' });
    } finally {
      setIsUpdatingChest(false);
    }
  };

  const handleMarkAttendance = async () => {
    if (!scannedData || !selectedEvent) {
      setAttendanceMessage({ text: 'Please scan a user and select an event', type: 'error' });
      return;
    }

    setIsMarkingAttendance(true);
    setAttendanceMessage({ text: '', type: '' });

    try {
      const response = await fetch('/api/mark-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clearId: scannedData,
          eventId: selectedEvent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark attendance');
      }

      setAttendanceMessage({ text: '✅ Attendance marked successfully!', type: 'success' });
      // Refresh user data to show updated attendance
      fetchUserData(scannedData);
      setSelectedEvent("");
    } catch (error) {
      console.error('Attendance marking error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark attendance';
      setAttendanceMessage({ text: `❌ ${errorMessage}`, type: 'error' });
    } finally {
      setIsMarkingAttendance(false);
    }
  };


  const UserDetailsCard = () => (
    <Card className="shadow-lg border-2">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>User Details</CardTitle>
          <div className="flex gap-2">
            {(scannedData || userData) && (
              <>
                <Button onClick={copyToClipboard} variant="outline" size="sm" className="bg-transparent text-xs h-8">
                  {copied ? (
                    <><Check className="w-4 h-4 mr-1 text-green-500" /> Copied!</>
                  ) : (
                    <><Copy className="w-4 h-4 mr-1" /> Copy ID</>
                  )}
                </Button>
                <Button onClick={resetScan} variant="outline" size="sm" className="bg-transparent hover:bg-red-50 text-xs h-8">
                  Clear Scan
                </Button>
              </>
            )}
          </div>
        </div>
        <CardDescription>
            {scannedData ? `Last Lookup: ${scannedData}` : "Awaiting scan or manual input."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {isFetchingUser && (
          <div className="flex items-center justify-center p-6 bg-blue-50/50 rounded-lg text-blue-600 border border-blue-200">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            <span className="text-base font-medium">Fetching user data...</span>
          </div>
        )}

        {userFetchError && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-800 rounded-lg flex gap-2 items-start">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-semibold">Error: <span className="font-normal">{userFetchError}</span></p>
          </div>
        )}

        {userData ? (
          <>
            <div className="p-5 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xl font-extrabold text-green-800">
                  {userData.user.fullName || 'N/A'}
                </p>
                <div className="flex gap-2">
                  {userData.user.duplicateWarning && (
                    <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-300 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Duplicate ID
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                    Verified
                  </Badge>
                </div>
              </div>
              {userData.user.duplicateWarning && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800 font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {userData.user.duplicateWarning}
                  </p>
                </div>
              )}
              <p className="text-sm text-gray-700 font-mono bg-gray-100 px-2 py-1 rounded">
                CLEAR ID: <span className="font-bold">{userData.user.clearId}</span>
              </p>
              <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-700 mt-3">
                <div className="flex items-center">
                  <span className="font-semibold mr-2">School:</span>
                  <span>{userData.user.schoolShort || 'N/A'}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-semibold mr-2">Reg No:</span>
                  <span>{userData.user.regNumber || 'N/A'}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-semibold mr-2">Class:</span>
                  <span>{userData.user.classSection || 'N/A'}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-semibold mr-2">Gender:</span>
                  <span>{userData.user.gender || 'N/A'}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-semibold mr-2">Chest No:</span>
                  <span>{userData.user.chestNo || 'N/A'}</span>
                </div>
                <div className="col-span-2 flex items-center mt-2">
                  <span className="font-semibold mr-2">Gmail:</span>
                  <span className="font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded">{userData.user.christGmail || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-lg font-semibold text-gray-800">Registered Events</h5>
                <Badge variant="secondary" className="text-xs">
                  {userData.registeredEvents.length} Event{userData.registeredEvents.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {userData.registeredEvents.map((event, index) => (
                  <li key={index} className="flex justify-between items-center text-sm p-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-lg shadow-sm transition-all duration-200 border border-gray-200">
                    <span className="font-semibold text-gray-800 flex-1">{event.name}</span>
                    <Badge variant="outline" className="text-xs bg-white text-blue-600 border-blue-300 ml-2">
                      {event.category.toUpperCase()}
                    </Badge>
                  </li>
                ))}
              </ul>
              {userData.registeredEvents.length === 0 && (
                <div className="text-center py-6">
                  <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 italic">No events found for this user.</p>
                </div>
              )}
            </div>

            {/* Chest Number Update Section */}
            <div className="pt-4 border-t border-gray-200">
              <h5 className="text-lg font-semibold text-gray-800 mb-3">Update Chest Number</h5>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter chest number (3-4 digits)"
                  value={chestNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                    if (value.length <= 4) {
                      setChestNumber(value);
                    }
                  }}
                  className="flex-1"
                  maxLength={4}
                />
                <Button
                  onClick={handleUpdateChestNumber}
                  disabled={isUpdatingChest || !chestNumber.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isUpdatingChest ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
                </Button>
              </div>
              {chestUpdateMessage.text && (
                <div className={`mt-2 p-2 rounded text-sm ${chestUpdateMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {chestUpdateMessage.text}
                </div>
              )}
            </div>

            {/* Mark Attendance Section */}
            <div className="pt-4 border-t border-gray-200">
              <h5 className="text-lg font-semibold text-gray-800 mb-3">Mark Attendance</h5>
              <div className="space-y-3">
                <select
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Event</option>
                  {userData.registeredEvents.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name} ({event.category})
                    </option>
                  ))}
                </select>
                <Button
                  onClick={handleMarkAttendance}
                  disabled={isMarkingAttendance || !selectedEvent}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isMarkingAttendance ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Mark Present
                </Button>
              </div>
              {attendanceMessage.text && (
                <div className={`mt-2 p-2 rounded text-sm ${attendanceMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {attendanceMessage.text}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-gray-400 text-sm text-center py-12 border-2 border-dashed border-gray-300 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="flex flex-col items-center">
              {isScanning ? (
                <>
                  <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-3" />
                  <p className="font-semibold text-gray-600">Scanning for QR codes...</p>
                  <p className="text-xs text-gray-500 mt-1">Position QR code within the camera view</p>
                </>
              ) : (
                <>
                  <Camera className="w-10 h-10 mb-3 text-gray-400" />
                  <p className="font-semibold text-gray-600 mb-1">Ready to Scan</p>
                  <p className="text-xs text-gray-500">Scan QR code, enter CLEAR ID, or use Gmail lookup</p>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100 font-sans">
      <div className="w-full max-w-6xl space-y-8 bg-white rounded-xl shadow-2xl p-6 lg:p-10">
        <h1 className="text-4xl font-extrabold text-center text-gray-900 mb-2">Event Check-In System</h1>
        <p className="text-center text-gray-500 mb-4">Quickly verify registrations using QR/ID or student email.</p>
        <div className="flex justify-center mb-6">
          <Badge variant="secondary" className="text-sm px-3 py-1">
            <Camera className="w-4 h-4 mr-2" />
            Scan & Verify
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* 1. User Details / Results Panel (Left Column) */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <UserDetailsCard />
          </div>

          {/* 2. Scanner and Manual Input Panel (Right Column) */}
          <Card className="lg:col-span-1 order-1 lg:order-2">
            <CardHeader>
              <CardTitle>Scanner & Lookup</CardTitle>
              <CardDescription>
                {detectionStatus === "scanning" && "Scanning for QR codes... Point camera at QR code to detect."}
                {detectionStatus === "detected" && `Identifier used: ${scannedData}. Data lookup complete.`}
                {detectionStatus === "idle" && "Use the camera or manual fallbacks below."}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Camera View / Placeholder */}
              <div className="relative bg-black rounded-xl overflow-hidden aspect-video border-4 border-gray-200 shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transition-opacity duration-300 ${isScanning ? 'opacity-100' : 'opacity-0'}`}
                />
                {(isScanning) && (
                  <div className="absolute inset-0 border-8 border-yellow-400 rounded-xl pointer-events-none opacity-80 animate-pulse">
                    <div className="absolute inset-0 flex items-center justify-center text-white text-xl font-bold bg-black/50">
                      SCANNING...
                    </div>
                  </div>
                )}
                {(!isScanning && !scannedData) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90">
                    <Camera className="w-16 h-16 text-gray-500 mb-2" />
                    <p className="text-gray-400">Camera Standby</p>
                  </div>
                )}
              </div>
              
              {/* Scanning Controls */}
              {error && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-800 rounded-lg flex gap-2 items-start">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                {!isScanning ? (
                  <Button 
                    onClick={startScanning} 
                    className="flex-1 bg-green-600 hover:bg-green-700 shadow-md" 
                    disabled={!isBrowserReady || isFetchingUser}
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Start Scanning
                  </Button>
                ) : (
                  <Button onClick={stopScanning} variant="destructive" className="flex-1 shadow-md">
                    <X className="w-5 h-5 mr-2" />
                    Stop Camera
                  </Button>
                )}
              </div>

              {/* Manual Input Section - CLEAR ID */}
              <div className="pt-6 border-t border-gray-200 space-y-3">
                  <h4 className="text-lg font-bold text-gray-700">1. Lookup by Clear ID</h4>
                  <div className="flex gap-2">
                      <Input
                          type="text"
                          placeholder="e.g., GE-SOS-UG-14669"
                          value={manualClearId}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualClearId(e.target.value.toUpperCase())}
                          className="flex-1 p-3 border-gray-300"
                          disabled={isScanning || isFetchingUser}
                      />
                      <Button 
                          onClick={handleManualClearIdFetch} 
                          disabled={!manualClearId.trim() || isScanning || isFetchingUser} 
                          className="shrink-0 bg-blue-600 hover:bg-blue-700"
                      >
                          <Check className="w-4 h-4 mr-1" /> ID Fetch
                      </Button>
                  </div>
              </div>

              {/* Manual Input Section - GMAIL FALLBACK */}
              <div className="pt-6 border-t border-gray-200 space-y-3">
                  <h4 className="text-lg font-bold text-gray-700">2. Fallback: Search by Christ Gmail</h4>
                  <div className="flex gap-2">
                      <Input
                          type="email"
                          placeholder="e.g., priya.sharma@christuniversity.in"
                          value={manualGmail}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualGmail(e.target.value)}
                          className="flex-1 p-3 border-gray-300"
                          disabled={isScanning || isFetchingUser}
                      />
                      <Button
                          onClick={handleManualGmailFetch}
                          disabled={!manualGmail.trim() || isScanning || isFetchingUser || !manualGmail.includes('@')}
                          className="shrink-0 bg-purple-600 hover:bg-purple-700"
                      >
                          <Mail className="w-4 h-4 mr-1" /> Gmail Fetch
                      </Button>
                  </div>
                  <p className="text-xs text-gray-500 italic">
                      Note: Gmail search scans the entire table (expensive operation). Consider adding a GSI for better performance in production.
                  </p>
              </div>

              {/* Additional Fallbacks Section - For future expansion */}
              <div className="pt-6 border-t border-gray-200 space-y-3">
                  <h4 className="text-lg font-bold text-gray-700">3. Additional Fallbacks (Coming Soon)</h4>
                  <div className="text-sm text-gray-600 space-y-2">
                      <p>• <strong>Registration Number:</strong> Search by student reg number</p>
                      <p>• <strong>Full Name:</strong> Fuzzy search by student name</p>
                      <p>• <strong>Phone Number:</strong> Search by contact number</p>
                  </div>
                  <p className="text-xs text-gray-500 italic">
                      To add more fallback methods, extend the API route to handle different identifier types and update the UI accordingly.
                  </p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}