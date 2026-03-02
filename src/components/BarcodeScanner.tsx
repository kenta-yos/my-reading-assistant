'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

type Props = {
  onScan: (isbn: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onScan, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const onScanRef = useRef(onScan)
  onScanRef.current = onScan
  const [cameraError, setCameraError] = useState('')
  const [initializing, setInitializing] = useState(true)
  const [manualIsbn, setManualIsbn] = useState('')
  const [scanning, setScanning] = useState(false)
  const scannedRef = useRef(false)

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  const handleClose = useCallback(() => {
    stopCamera()
    onClose()
  }, [stopCamera, onClose])

  const submitIsbn = useCallback(
    (raw: string) => {
      const cleaned = raw.replace(/[^0-9]/g, '')
      if (/^97[89]\d{10}$/.test(cleaned) || /^\d{10}$/.test(cleaned)) {
        stopCamera()
        onScan(cleaned)
        return true
      }
      return false
    },
    [stopCamera, onScan],
  )

  const handleManualSubmit = useCallback(() => {
    submitIsbn(manualIsbn)
  }, [manualIsbn, submitIsbn])

  useEffect(() => {
    let mounted = true
    let intervalId: ReturnType<typeof setInterval>

    async function startScanner() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream

        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play()
        if (mounted) setInitializing(false)

        // BarcodeDetector: ネイティブ or ポリフィル
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let DetectorClass: any = (window as any).BarcodeDetector
        if (!DetectorClass) {
          try {
            const mod = await import('barcode-detector/pure')
            DetectorClass = mod.BarcodeDetector
          } catch {
            return
          }
        }

        if (mounted) setScanning(true)
        const detector = new DetectorClass({ formats: ['ean_13'] })

        intervalId = setInterval(async () => {
          if (!mounted || scannedRef.current || video.readyState < 2) return
          try {
            const barcodes = await detector.detect(video)
            for (const barcode of barcodes) {
              const cleaned = (barcode.rawValue ?? '').replace(/[^0-9]/g, '')
              if (/^97[89]\d{10}$/.test(cleaned)) {
                scannedRef.current = true
                clearInterval(intervalId)
                stream.getTracks().forEach((t) => t.stop())
                streamRef.current = null
                onScanRef.current(cleaned)
                return
              }
            }
          } catch {
            // detect can fail on some frames
          }
        }, 200)
      } catch (err) {
        if (mounted) {
          setInitializing(false)
          if (
            err instanceof Error &&
            (err.name === 'NotAllowedError' ||
              err.message.includes('Permission'))
          ) {
            setCameraError('カメラへのアクセスが許可されていません')
          } else {
            setCameraError('カメラを起動できませんでした')
          }
        }
      }
    }

    startScanner()

    return () => {
      mounted = false
      scannedRef.current = true
      clearInterval(intervalId)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
  }, [])

  const isbnValid = /^(97[89]\d{10}|\d{10})$/.test(
    manualIsbn.replace(/[^0-9]/g, ''),
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-xl dark:bg-stone-800">
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3 dark:border-stone-700">
          <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
            ISBN で書籍を検索
          </h3>
          <button
            onClick={handleClose}
            className="text-stone-400 transition-colors hover:text-stone-600 dark:hover:text-stone-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* カメラプレビュー */}
        {!cameraError && (
          <div className="relative aspect-[4/3] bg-black">
            {initializing && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-stone-100 dark:bg-stone-900">
                <div className="text-center">
                  <svg
                    className="mx-auto mb-2 h-6 w-6 animate-spin text-indigo-500"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    カメラを起動中...
                  </p>
                </div>
              </div>
            )}
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              playsInline
              muted
            />
            {!initializing && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-20 w-64 rounded-lg border-2 border-white/60" />
              </div>
            )}
            {!initializing && scanning && (
              <div className="absolute bottom-2 left-0 right-0 text-center">
                <span className="rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white">
                  自動検出中...
                </span>
              </div>
            )}
          </div>
        )}

        {cameraError && (
          <div className="bg-red-50 px-4 py-3 dark:bg-red-950/30">
            <p className="text-sm text-red-600 dark:text-red-400">
              {cameraError}
            </p>
          </div>
        )}

        {/* ISBN 手入力 */}
        <div className="border-t border-stone-200 px-4 py-3 dark:border-stone-700">
          <p className="mb-2 text-xs text-stone-500 dark:text-stone-400">
            {scanning
              ? 'バーコードにカメラを向けるか、ISBN番号を入力'
              : 'バーコード下のISBN番号を入力してください'}
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualIsbn}
              onChange={(e) => setManualIsbn(e.target.value)}
              placeholder="978..."
              inputMode="numeric"
              className="flex-1 rounded-xl border border-stone-300 p-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100 dark:focus:border-indigo-500 dark:focus:ring-indigo-800"
              style={{ fontSize: '16px' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleManualSubmit()
              }}
            />
            <button
              type="button"
              onClick={handleManualSubmit}
              disabled={!isbnValid}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-40 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              検索
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
