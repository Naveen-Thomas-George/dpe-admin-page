"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, X, Copy, Check, AlertCircle } from "lucide-react"
import { BrowserQRCodeReader } from "@zxing/browser"

export function ScanTool() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scannedData, setScannedData] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [detectionStatus, setDetectionStatus] = useState<"idle" | "scanning" | "detected">("idle")
  const [error, setError] = useState<string | null>(null)
  const [isBrowserReady, setIsBrowserReady] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)

  const codeReader = useRef<BrowserQRCodeReader | null>(null)

  useEffect(() => {
    setIsBrowserReady(true)
    codeReader.current = new BrowserQRCodeReader()
    return () => stopScanning()
  }, [])

  const startScanning = async () => {
    try {
      setError(null)
      setScannedData(null)
      setDetectionStatus("scanning")
      setIsScanning(true)

      // Start camera
      const constraints = {
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      }

      const videoStream = await navigator.mediaDevices.getUserMedia(constraints)
      if (videoRef.current) {
        videoRef.current.srcObject = videoStream
      }
      setStream(videoStream)

      // Decode once from video stream
      const result = await codeReader.current?.decodeOnceFromVideoDevice(undefined, videoRef.current!)

      if (result) {
        setScannedData(result.getText())
        setDetectionStatus("detected")
        stopScanning()
      } else {
        setError("No QR code detected.")
        setDetectionStatus("idle")
      }
    } catch (err) {
      console.error("QR Scan Error:", err)
      let errorMsg = "Unable to access camera"
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError") {
          errorMsg = "Camera permission denied. Please allow camera access."
        } else if (err.name === "NotFoundError") {
          errorMsg = "No camera found on this device."
        } else if (err.name === "NotReadableError") {
          errorMsg = "Camera is already in use by another application."
        } else if (err.name === "SecurityError") {
          errorMsg = "Camera access requires HTTPS connection on mobile devices."
        }
      }
      setError(errorMsg)
      setDetectionStatus("idle")
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    setIsScanning(false)
    setDetectionStatus("idle")
  }

  const copyToClipboard = () => {
    if (scannedData) {
      navigator.clipboard.writeText(scannedData)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const resetScan = () => {
    setScannedData(null)
    setDetectionStatus("idle")
    setError(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">QR Code Scanner</h2>
        <p className="text-muted-foreground mt-2">
          Scan QR codes using your device camera
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scanner */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Scanner</CardTitle>
            <CardDescription>
              {detectionStatus === "scanning" && "Scanning for QR codes..."}
              {detectionStatus === "detected" && "QR code detected!"}
              {detectionStatus === "idle" && "Start scanning to begin"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex gap-2">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {isScanning && (
                <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-primary rounded-lg opacity-50"></div>
                  </div>
                </div>
              )}
              {!isScanning && !scannedData && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Camera className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {!isScanning ? (
                <Button onClick={startScanning} className="flex-1" disabled={!isBrowserReady}>
                  <Camera className="w-4 h-4 mr-2" />
                  Start Scanning
                </Button>
              ) : (
                <Button onClick={stopScanning} variant="destructive" className="flex-1">
                  <X className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Scanned Data</CardTitle>
            <CardDescription>Latest scan result</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {scannedData ? (
              <>
                <div className="p-4 bg-muted rounded-lg break-all font-mono text-sm max-h-32 overflow-y-auto">
                  {scannedData}
                </div>
                <div className="flex gap-2">
                  <Button onClick={copyToClipboard} variant="outline" className="flex-1 bg-transparent">
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button onClick={resetScan} variant="outline" className="flex-1 bg-transparent">
                    Clear
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">
                {isScanning ? "Waiting for QR code..." : "No data scanned yet"}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
