import * as React from "react"
import Papa from "papaparse"
import {
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Sun,
  Moon,
  AlertTriangle,
  RefreshCw,
  Hash,
  ChevronLeft,
  PackageCheck,
  Package,
  MapPin,
  Phone,
  ExternalLink,
  Sparkles
} from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import logo from "@/assets/logo.png"

// Helper to normalize Google Sheets URL to export CSV endpoint
function formatGoogleSheetCsvUrl(url?: string): string {
  if (!url) return ""
  let cleanUrl = url.trim()
  if (cleanUrl.includes("/pubhtml")) {
    cleanUrl = cleanUrl.replace("/pubhtml", "/pub")
  }
  if (cleanUrl.includes("/pub") && !cleanUrl.includes("output=csv")) {
    cleanUrl += (cleanUrl.includes("?") ? "&" : "?") + "output=csv"
  }
  return cleanUrl
}

const DEFAULT_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vR4lQFbpqm66h6oZQaFG6AT5QwTkwfy7yaE-7O1FqFPrtx4inFQ9vbw43sICVVp6M8b6c6jAIKH4adM/pub?gid=1226834802&single=true&output=csv"

const SPREADSHEET_URL = formatGoogleSheetCsvUrl(
  (import.meta.env.VITE_SPREADSHEET_URL as string | undefined) ||
  (import.meta.env.VITE_SPREADSHEET_CSV_URL as string | undefined) ||
  DEFAULT_CSV_URL
)

// Raw row data from Google Sheets CSV
export interface RawOrder {
  [key: string]: string | undefined
}

export type PaymentStatus = "proses" | "selesai" | "invalid"

// Normalized Order Model for consistent access throughout the app
export interface NormalizedOrder {
  raw: RawOrder
  id: string
  idOrder: string
  idTransaksi: string
  sektor: string
  name: string
  prodi: string
  whatsapp: string
  metodePengambilan: string
  alamatKos: string
  order: string
  buktiBayar: string
  timestamp: string
  score: string

  // Status Tahap 1: Konfirmasi Pembayaran
  paymentStatus: PaymentStatus // "proses" | "selesai" | "invalid"
  isKonfirmasiSelesai: boolean
  isKonfirmasiProses: boolean
  isKonfirmasi: boolean // alias for isKonfirmasiSelesai

  // Status Tahap 2 & 3
  isSiapDiambil: boolean
  isSelesai: boolean
  isInvalid: boolean

  statusText: string
}


// Helper to check truthy checkbox value from Google Sheets
function isTruthy(val: unknown): boolean {
  if (typeof val === "boolean") return val
  if (!val) return false
  const str = String(val).trim().toUpperCase()
  return str === "TRUE" || str === "YES" || str === "1" || str === "V" || str === "BENAR"
}

// Normalize raw CSV row into NormalizedOrder
export function normalizeOrder(raw: RawOrder): NormalizedOrder {
  const idOrder = (
    raw["ID Order"] ||
    raw["id order"] ||
    raw["Id Order"] ||
    raw["ID_Order"] ||
    raw["ID Pesanan"] ||
    raw["id pesanan"] ||
    ""
  ).trim()

  const idTransaksi = (
    raw["ID Transaksi"] ||
    raw["Id Transaksi"] ||
    raw["id transaksi"] ||
    raw["ID_Transaksi"] ||
    ""
  ).trim()

  const fallbackId = (raw["ID"] || raw["id"] || "").trim()

  // ID utama diambil dari ID Order (contoh: MO-001), fallback ke ID Transaksi / ID generic
  const id = idOrder || idTransaksi || fallbackId

  const sektor = (
    raw["Sektor kamu"] ||
    raw["Sektor Kamu"] ||
    raw["Sektor"] ||
    raw["sektor"] ||
    ""
  ).trim()

  const name =
    raw["Nama lengkap kamu"] ||
    raw["Nama sesuai KTM"] ||
    raw["Nama Lengkap"] ||
    raw["Nama"] ||
    raw["Nama lengkap"] ||
    ""

  const prodi =
    raw["Prodi kamu"] ||
    raw["Prodi"] ||
    raw["Program Studi"] ||
    raw["Fakultas / Kampus"] ||
    raw["Jurusan"] ||
    ""

  const whatsapp =
    raw["Nomor Whatsapp"] ||
    raw["Nomor WhatsApp"] ||
    raw["No Whatsapp"] ||
    raw["No WhatsApp"] ||
    raw["Nomor HP"] ||
    raw["No HP"] ||
    ""

  const metodePengambilan =
    raw["Metode Pengambilan"] ||
    raw["Metode pengambilan"] ||
    raw["Pengambilan"] ||
    raw["Metode"] ||
    ""

  const alamatKos =
    raw["Alamat Kos"] ||
    raw["Alamat kos"] ||
    raw["Alamat"] ||
    raw["Alamat Pengiriman"] ||
    ""

  const order =
    raw["Order"] ||
    raw["Paket"] ||
    raw["Pesanan"] ||
    raw["Jumlah order"] ||
    ""

  const buktiBayar =
    raw["Upload bukti bayar"] ||
    raw["Upload Bukti Bayar"] ||
    raw["Bukti bayar"] ||
    raw["Bukti Bayar"] ||
    raw["Bukti Transfer"] ||
    ""

  const timestamp =
    raw["Timestamp"] ||
    raw["Waktu"] ||
    raw["Tanggal"] ||
    ""

  const score =
    raw["Score"] ||
    raw["Skor"] ||
    ""

  // 1. Status Konfirmasi Pembayaran (Kolom '1' / 'Konfirmasi Pembayaran')
  const col1 = (
    raw["1"] ||
    raw["Konfirmasi Pembayaran"] ||
    raw["Konfirmasi pembayaran"] ||
    raw["konfirmasi pembayaran"] ||
    raw["Status Pembayaran"] ||
    raw["Status"] ||
    ""
  ).toLowerCase().trim()

  const col2 = (
    raw["2"] ||
    raw["Siap Diambil"] ||
    raw["Siap diambil"] ||
    raw["siap diambil"] ||
    raw["Status 2"] ||
    ""
  ).toLowerCase().trim()

  // Status Invalid / Dibatalkan
  const isInvalid =
    col1.includes("tidak valid") ||
    col1.includes("invalid") ||
    col1.includes("batal") ||
    col1.includes("ditolak") ||
    isTruthy(raw["Invalid"]) ||
    isTruthy(raw["invalid"]) ||
    isTruthy(raw["Batal"])

  // Status Selesai (Tahap 3)
  const isSelesai =
    !isInvalid && (
      col2.includes("selesai") ||
      col2.includes("diterima") ||
      col2.includes("done") ||
      isTruthy(raw["Selesai"]) ||
      isTruthy(raw["selesai"]) ||
      isTruthy(raw["Diterima"])
    )

  // Status Siap Diambil / Diantar (Tahap 2)
  const isSiapDiambil =
    !isInvalid && (
      isSelesai ||
      col2.includes("siap") ||
      col2.includes("ready") ||
      col2.includes("ambil") ||
      isTruthy(raw["Siap Diambil"]) ||
      isTruthy(raw["Siap diambil"]) ||
      isTruthy(raw["siap diambil"]) ||
      isTruthy(raw["Ready"])
    )

  // Status Konfirmasi Pembayaran Selesai (Tahap 1 Done)
  // Bernilai selesai jika:
  // - col1 bernilai "selesai", "valid", "terverifikasi", "dikonfirmasi", "lunas", "sudah bayar", "true", "1"
  // - ATAU pesanan sudah masuk ke tahap siap diambil / tahap selesai
  const isKonfirmasiSelesai =
    !isInvalid && (
      isSelesai ||
      isSiapDiambil ||
      col1 === "selesai" ||
      col1.includes("selesai") ||
      col1 === "valid" ||
      col1.includes("terverifikasi") ||
      col1.includes("dikonfirmasi") ||
      col1.includes("lunas") ||
      col1.includes("sudah bayar") ||
      isTruthy(raw["Konfirmasi Pembayaran"]) ||
      isTruthy(raw["Konfirmasi pembayaran"]) ||
      isTruthy(raw["Valid"])
    )

  // Status Konfirmasi Pembayaran Sedang Diproses (Tahap 1 Active)
  const isKonfirmasiProses = !isInvalid && !isKonfirmasiSelesai

  let paymentStatus: PaymentStatus = "proses"
  if (isInvalid) {
    paymentStatus = "invalid"
  } else if (isKonfirmasiSelesai) {
    paymentStatus = "selesai"
  } else {
    paymentStatus = "proses"
  }

  let statusText = "Verifikasi Pembayaran"
  if (isInvalid) {
    statusText = "Pembayaran Tidak Valid"
  } else if (isSelesai) {
    statusText = "Pesanan Selesai"
  } else if (isSiapDiambil) {
    statusText = "Siap Diambil"
  } else if (isKonfirmasiSelesai) {
    statusText = "Pembayaran Terverifikasi"
  } else {
    statusText = "Verifikasi Pembayaran"
  }

  return {
    raw,
    id: id.trim(),
    idOrder: idOrder.trim(),
    idTransaksi: idTransaksi.trim(),
    sektor: sektor.trim(),
    name: name.trim(),
    prodi: prodi.trim(),
    whatsapp: whatsapp.trim(),
    metodePengambilan: metodePengambilan.trim(),
    alamatKos: alamatKos.trim(),
    order: order.trim(),
    buktiBayar: buktiBayar.trim(),
    timestamp: timestamp.trim(),
    score: score.trim(),
    paymentStatus,
    isKonfirmasiSelesai,
    isKonfirmasiProses,
    isKonfirmasi: isKonfirmasiSelesai,
    isSiapDiambil,
    isSelesai,
    isInvalid,
    statusText
  }
}

export interface Step {
  title: string
  description: string
  status: "done" | "active" | "pending" | "failed"
}

// Brand Logo Component
function BrandLogo() {
  return (
    <div className="flex items-center gap-2">
      <img src={logo} alt="Logo" className="h-10 sm:h-12 w-auto object-contain" />
    </div>
  )
}

export function TrackingPage() {
  const { theme, setTheme } = useTheme()
  const [allOrders, setAllOrders] = React.useState<NormalizedOrder[]>([])
  const [loading, setLoading] = React.useState<boolean>(true)
  const [error, setError] = React.useState<string | null>(null)

  // Search states
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [debouncedQuery, setDebouncedQuery] = React.useState<string>("")
  const [searched, setSearched] = React.useState<boolean>(false)
  const [searchResults, setSearchResults] = React.useState<NormalizedOrder[]>([])
  const [selectedOrder, setSelectedOrder] = React.useState<NormalizedOrder | null>(null)
  const [recentSearches, setRecentSearches] = React.useState<string[]>([])

  // Layout states (Mobile slider)
  const [activeTab, setActiveTab] = React.useState<"list" | "detail">("list")

  // Fetch CSV data from Google Sheets
  const fetchData = React.useCallback(async (isBackground = false) => {
    const silent = typeof isBackground === "boolean" ? isBackground : false
    if (!silent) {
      setLoading(true)
    }
    setError(null)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      const csvUrl = SPREADSHEET_URL || DEFAULT_CSV_URL

      const response = await fetch(csvUrl, {
        signal: controller.signal,
        headers: { "Cache-Control": "max-age=30" }
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error("Gagal mengambil data dari server Google Sheets.")
      }
      const csvText = await response.text()

      Papa.parse<RawOrder>(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsed = results.data || []
          const normalized = parsed
            .map(row => normalizeOrder(row))
            .filter(o => o.id || o.name)

          setAllOrders(normalized)
          if (normalized.length > 0) {
            localStorage.setItem("cached_orders_data", JSON.stringify(parsed))
            localStorage.setItem("cached_orders_timestamp", Date.now().toString())
          }

          setSelectedOrder(current => {
            if (!current) return null
            return normalized.find(o => o.id === current.id || (o.name && o.name === current.name)) || null
          })

          setLoading(false)
        },
        error: (err: Error) => {
          throw err
        }
      })
    } catch (err: unknown) {
      clearTimeout(timeoutId)
      console.error(err)

      // Fallback to cached data if available
      const cachedData = localStorage.getItem("cached_orders_data")
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData) as RawOrder[]
          setAllOrders(parsed.map(row => normalizeOrder(row)))
          setError("Koneksi lambat. Menampilkan data offline terakhir.")
        } catch {
          setAllOrders([])
          setError("Gagal memuat data. Silakan periksa koneksi internet Anda.")
        }
      } else {
        setAllOrders([])
        setError("Gagal memuat data dari server. Silakan periksa koneksi internet Anda.")
      }
      setLoading(false)
    }
  }, [])

  // Load data on mount
  React.useEffect(() => {
    fetchData(false)

    const history = localStorage.getItem("tracking_recent_searches")
    if (history) {
      try {
        setRecentSearches(JSON.parse(history))
      } catch {
        // ignore
      }
    }
  }, [fetchData])

  // Save query to history
  const addToHistory = (query: string) => {
    const trimmed = query.trim()
    if (!trimmed) return

    setRecentSearches(prev => {
      const filtered = prev.filter(q => q.toLowerCase() !== trimmed.toLowerCase())
      const updated = [trimmed, ...filtered].slice(0, 5)
      localStorage.setItem("tracking_recent_searches", JSON.stringify(updated))
      return updated
    })
  }

  // Search logic
  const handleSearch = React.useCallback(
    (queryToSearch?: string, shouldAddToHistory = false) => {
      const activeQuery = queryToSearch !== undefined ? queryToSearch : searchQuery
      const queryClean = activeQuery.trim().toLowerCase()

      if (!queryClean) {
        setSearchResults([])
        setSelectedOrder(null)
        setSearched(false)
        setActiveTab("list")
        return
      }

      setSearched(true)
      if (shouldAddToHistory) {
        addToHistory(activeQuery)
      }

      const results = allOrders.filter(order => {
        const idMatch = order.id.toLowerCase().includes(queryClean)
        const idOrderMatch = order.idOrder.toLowerCase().includes(queryClean)
        const idTransaksiMatch = order.idTransaksi.toLowerCase().includes(queryClean)
        const nameMatch = order.name.toLowerCase().includes(queryClean)
        const prodiMatch = order.prodi.toLowerCase().includes(queryClean)
        const waMatch = order.whatsapp.toLowerCase().includes(queryClean)
        const sektorMatch = order.sektor.toLowerCase().includes(queryClean)

        return idMatch || idOrderMatch || idTransaksiMatch || nameMatch || prodiMatch || waMatch || sektorMatch
      })

      setSearchResults(results)
      if (results.length === 1) {
        setSelectedOrder(results[0])
        setActiveTab("detail")
      } else if (results.length > 1) {
        const exactMatch = results.find(
          r =>
            r.id.toLowerCase() === queryClean ||
            r.idOrder.toLowerCase() === queryClean ||
            r.idTransaksi.toLowerCase() === queryClean ||
            r.name.toLowerCase() === queryClean
        )
        setSelectedOrder(exactMatch || results[0])
        setActiveTab("list")
      } else {
        setSelectedOrder(null)
        setActiveTab("list")
      }
    },
    [allOrders, searchQuery]
  )

  // Debounce search query
  React.useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults([])
      setSelectedOrder(null)
      setSearched(false)
      setDebouncedQuery("")
      setActiveTab("list")
      return
    }

    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 250)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Trigger search on debounce
  React.useEffect(() => {
    if (debouncedQuery.trim() !== "") {
      handleSearch(debouncedQuery, false)
    }
  }, [debouncedQuery, handleSearch])

  // Clear search
  const handleClear = () => {
    setSearchQuery("")
    setSearchResults([])
    setSelectedOrder(null)
    setSearched(false)
    setActiveTab("list")
  }

  // 3-Stage Progress Calculations
  const getSteps = (order: NormalizedOrder): Step[] => {
    const { isInvalid, isKonfirmasiSelesai, isSiapDiambil, isSelesai } = order

    const steps: Step[] = []

    // 1. Konfirmasi Pembayaran
    let step1Status: Step["status"] = "pending"
    if (isInvalid) {
      step1Status = "failed"
    } else if (isKonfirmasiSelesai) {
      step1Status = "done"
    } else {
      // isKonfirmasiProses
      step1Status = "active"
    }

    steps.push({
      title: "Konfirmasi Pembayaran",
      description: isInvalid
        ? "Pembayaran tidak valid atau ditolak. Silakan hubungi admin untuk konfirmasi ulang bukti transfer."
        : step1Status === "done"
          ? "Pembayaran telah selesai diverifikasi & dikonfirmasi oleh admin."
          : "Sedang diproses: Admin sedang memeriksa dan memverifikasi bukti transfer pembayaran Anda.",
      status: step1Status
    })

    // 2. Siap Diambil / Diantar
    let step2Status: Step["status"] = "pending"
    if (isInvalid) {
      step2Status = "failed"
    } else if (isSiapDiambil || isSelesai) {
      step2Status = "done"
    } else if (isKonfirmasiSelesai) {
      step2Status = "active"
    }

    const siapDiambilDesc = order.metodePengambilan?.toLowerCase().includes("kos")
      ? "Pesanan sudah siap. Untuk pengantaran via kos akan dihubungi oleh admin."
      : "Pesanan sudah siap. Silakan ambil pesanan Anda di titik pengambilan UPI."

    steps.push({
      title: "Siap Diambil",
      description: isInvalid
        ? "Proses pesanan dihentikan karena pembayaran tidak valid."
        : step2Status === "done"
          ? siapDiambilDesc
          : step2Status === "active"
            ? "Pembayaran terverifikasi! Pesanan Anda saat ini sedang dikemas & disiapkan."
            : "Pesanan akan disiapkan setelah tahap konfirmasi pembayaran selesai.",
      status: step2Status
    })

    // 3. Selesai
    let step3Status: Step["status"] = "pending"
    if (isInvalid) {
      step3Status = "failed"
    } else if (isSelesai) {
      step3Status = "done"
    } else if (step2Status === "done") {
      step3Status = "active"
    }

    steps.push({
      title: "Selesai",
      description: isInvalid
        ? "Pesanan tidak dapat diselesaikan."
        : isSelesai
          ? "Pesanan telah selesai diserahkan / diterima. Terima kasih atas pesanan Anda!"
          : step3Status === "active"
            ? "Silakan ambil pesanan Anda sesuai metode pengambilan yang dipilih."
            : "Tahap penyelesaian setelah pesanan diterima oleh pemesan.",
      status: step3Status
    })

    return steps
  }

  // Status Badge Helper
  const getStatusConfig = (order: NormalizedOrder) => {
    if (order.isInvalid) {
      return {
        label: "Pembayaran Tidak Valid",
        badge: "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200 dark:border-rose-900/50",
        icon: XCircle
      }
    }
    if (order.isSelesai) {
      return {
        label: "Pesanan Selesai",
        badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50",
        icon: CheckCircle2
      }
    }
    if (order.isSiapDiambil) {
      return {
        label: "Siap Diambil",
        badge: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-900/50",
        icon: PackageCheck
      }
    }
    if (order.isKonfirmasiSelesai) {
      return {
        label: "Pembayaran Terverifikasi",
        badge: "bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400 border-teal-200 dark:border-teal-900/50",
        icon: CheckCircle2
      }
    }
    return {
      label: "Verifikasi Pembayaran",
      badge: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
      icon: Clock
    }
  }

  return (
    <div className="min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans transition-colors duration-200">
      {/* Header bar */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/95 backdrop-blur-xs dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <BrandLogo />

          <div className="flex items-center gap-2 sm:gap-3">

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-[4px] border border-zinc-200 p-2 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50 transition-all cursor-pointer"
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchData(false)}
              disabled={loading}
              className="rounded-[4px] border-zinc-200 dark:border-zinc-800 text-xs cursor-pointer"
            >
              <RefreshCw className={cn("size-3 mr-1.5", loading && "animate-spin")} />
              <span className="hidden sm:inline">Perbarui</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 md:py-12">
        {/* Hero Section */}
        <div className="text-center mb-8 md:mb-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            <Sparkles className="size-3.5" />
            <span>Tracking Pesanan Online</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl md:text-4xl">
            Lacak Status <span className="text-primary">Pesanan Anda</span>
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
            Pantau status verifikasi konfirmasi pembayaran, kesiapan pengambilan, hingga pesanan selesai secara real-time.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8 sm:mb-10">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSearch(searchQuery, true)
            }}
            className="flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[6px] p-1 gap-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all shadow-xs"
          >
            <div className="flex items-center pl-2.5 text-zinc-400 dark:text-zinc-500">
              <Search className="size-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Nama Lengkap Anda..."
              className="w-full bg-transparent border-0 outline-hidden py-2 px-1 text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 focus:ring-0 focus:outline-hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors whitespace-nowrap cursor-pointer"
              >
                Batal
              </button>
            )}
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/95 text-white rounded-[4px] px-4 shadow-none border-0 text-xs font-semibold cursor-pointer"
            >
              Cari
            </Button>
          </form>

          {/* Error Box */}
          {error && (
            <div className="mt-4 p-3 bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50 rounded-[4px] text-xs flex items-center gap-2">
              <AlertTriangle className="size-3.5 shrink-0" />
              <span className="grow">{error}</span>
              <button
                onClick={() => fetchData(false)}
                className="underline hover:text-rose-800 dark:hover:text-rose-300 font-bold whitespace-nowrap cursor-pointer"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {/* Recent Searches */}
          {!searched && recentSearches.length > 0 && (
            <div className="mt-3.5 flex flex-wrap items-center gap-2 justify-center sm:justify-start">
              <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                Pencarian Terakhir:
              </span>
              {recentSearches.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSearchQuery(q)
                    handleSearch(q, false)
                  }}
                  className="text-xs px-2.5 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors inline-flex items-center gap-0.5 cursor-pointer"
                >
                  {q}
                  <ArrowRight className="size-2.5 opacity-60 ml-0.5" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="relative">
          {/* 1. Loading Skeleton */}
          {loading && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-[4px] animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 border border-zinc-200 dark:border-zinc-800 rounded-[6px] p-4 space-y-4">
                  <div className="h-4 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded-[4px] animate-pulse" />
                  <div className="space-y-2.5">
                    <div className="h-8 bg-zinc-100 dark:bg-zinc-900 rounded-[4px] animate-pulse" />
                    <div className="h-8 bg-zinc-100 dark:bg-zinc-900 rounded-[4px] animate-pulse" />
                    <div className="h-8 bg-zinc-100 dark:bg-zinc-900 rounded-[4px] animate-pulse" />
                  </div>
                </div>
                <div className="md:col-span-2 border border-zinc-200 dark:border-zinc-800 rounded-[6px] p-5 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 w-1/3">
                      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-[4px] animate-pulse" />
                      <div className="h-3 bg-zinc-100 dark:bg-zinc-900 rounded-[4px] animate-pulse" />
                    </div>
                    <div className="h-5 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse" />
                  </div>
                  <div className="space-y-5 border-l border-zinc-200 dark:border-zinc-800 pl-4 py-1">
                    {[1, 2, 3].map(n => (
                      <div key={n} className="relative space-y-1">
                        <div className="absolute -left-[21px] top-0.5 h-3 w-3 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                        <div className="h-3 w-1/4 bg-zinc-200 dark:bg-zinc-800 rounded-[4px] animate-pulse" />
                        <div className="h-2.5 w-1/2 bg-zinc-100 dark:bg-zinc-900 rounded-[4px] animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Content Loaded */}
          {!loading && (
            <>
              {/* Empty Initial State: Instruction and guidance */}
              {!searched && (
                <div className="max-w-2xl mx-auto space-y-6">
                  <div className="text-center border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-[8px] p-6 sm:p-8 shadow-xs">
                    <div className="mx-auto size-12 bg-primary/10 text-primary border border-primary/20 rounded-[8px] flex items-center justify-center mb-4">
                      <Search className="size-5" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50">Lacak Status Pesanan</h3>
                    <p className="mt-2 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                      Masukkan <span className="font-semibold text-zinc-800 dark:text-zinc-200">Nama Lengkap</span> Anda pada kolom pencarian di atas untuk melacak pesanan Anda.
                    </p>

                    {/* 3 Step Explanation */}
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                      <div className="p-3.5 rounded-[6px] bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="size-5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-bold flex items-center justify-center">1</span>
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Verifikasi</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                          Admin memverifikasi bukti transfer & kelengkapan data pesanan.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-[6px] bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="size-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-bold flex items-center justify-center">2</span>
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Siap Diambil</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                          Pesanan selesai dipacking dan siap diambil / diantar ke alamat kos.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-[6px] bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="size-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold flex items-center justify-center">3</span>
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Selesai</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                          Pesanan telah diserahterimakan kepada pemesan secara sukses.
                        </p>
                      </div>
                    </div>

                    {/* WhatsApp Help CTA */}
                    <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                      <div>
                        <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Pesanan belum terdata atau ada pertanyaan?</p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Tim admin kami siap membantu pengecekan langsung.</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-8 gap-1.5 rounded-[4px] cursor-pointer whitespace-nowrap"
                        asChild
                      >
                        <a href="https://wa.link/t7ajwp" target="_blank" rel="noreferrer">
                          <Phone className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                          Hubungi Admin
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Searched Results State */}
              {searched && (
                <>
                  {/* Data Not Found */}
                  {searchResults.length === 0 ? (
                    <div className="max-w-xl mx-auto text-center border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-[6px] p-8 shadow-xs">
                      <div className="mx-auto size-12 bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 rounded-[6px] flex items-center justify-center mb-4">
                        <XCircle className="size-6" />
                      </div>
                      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">Pesanan Tidak Ditemukan</h3>
                      <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                        Tidak ada data pesanan yang cocok dengan kata kunci &quot;<span className="font-semibold text-zinc-800 dark:text-zinc-200">{searchQuery}</span>&quot;.
                      </p>

                      <div className="mt-5 p-3.5 rounded-[4px] bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs text-left max-w-sm mx-auto space-y-1.5 text-zinc-500 dark:text-zinc-400">
                        <p className="font-bold text-zinc-700 dark:text-zinc-300">Tips Pencarian:</p>
                        <ul className="list-disc pl-4 space-y-1">
                          <li>Pastikan penulisan nama lengkap atau nama depan sudah benar.</li>
                          <li>Anda juga dapat mencari menggunakan ID Order (contoh: <span className="font-mono">MO-001</span>).</li>
                        </ul>
                      </div>
                      <div className="mt-6 flex justify-center gap-3">
                        <Button variant="outline" className="rounded-[4px] text-xs h-8 cursor-pointer" onClick={handleClear}>
                          Kembali
                        </Button>
                        <Button
                          className="bg-primary hover:bg-primary/95 text-white rounded-[4px] border-0 text-xs h-8 cursor-pointer"
                          asChild
                        >
                          <a href="https://wa.link/tddgvy" target="_blank" rel="noreferrer">
                            Hubungi Admin
                          </a>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Results Found */
                    <>
                      {/* Desktop Layout (Grid 3 cols) */}
                      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-6 items-start">
                        {/* Sidebar: Results List */}
                        <div className="lg:col-span-1 space-y-3">
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                            Hasil Pencarian ({searchResults.length})
                          </h4>
                          <div className="max-h-[520px] overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-[6px] bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-850 shadow-xs">
                            {searchResults.map((order, idx) => {
                              const isSel = selectedOrder?.id === order.id && selectedOrder?.name === order.name
                              const statusInfo = getStatusConfig(order)

                              return (
                                <button
                                  key={idx}
                                  onClick={() => setSelectedOrder(order)}
                                  className={cn(
                                    "w-full text-left p-3 transition-all flex flex-col gap-1 focus:outline-hidden cursor-pointer",
                                    isSel
                                      ? "bg-zinc-50 dark:bg-zinc-800/40 border-l-2 border-primary"
                                      : "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20"
                                  )}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span className="font-mono text-[11px] font-bold text-zinc-900 dark:text-zinc-50 flex items-center">
                                      <Hash className="size-2.5 text-zinc-400 mr-0.5" />
                                      {order.id || "ORDER"}
                                    </span>
                                    <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full border font-semibold", statusInfo.badge)}>
                                      {statusInfo.label}
                                    </span>
                                  </div>
                                  <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                                    {order.name || "-"}
                                  </div>
                                  <div className="text-[10px] text-zinc-400 dark:text-zinc-500 flex justify-between">
                                    <span className="truncate max-w-[140px]">{order.prodi || order.order}</span>
                                    <span>{order.timestamp?.split(" ")[0]}</span>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Detail Panel */}
                        <div className="lg:col-span-2">
                          {selectedOrder ? (
                            <OrderDetailCard
                              order={selectedOrder}
                              steps={getSteps(selectedOrder)}
                              statusInfo={getStatusConfig(selectedOrder)}
                            />
                          ) : (
                            <div className="border border-zinc-200 dark:border-zinc-800 rounded-[6px] bg-zinc-50 dark:bg-zinc-900/10 p-12 text-center text-zinc-400 text-xs">
                              Pilih pesanan dari daftar di sebelah kiri untuk melihat detail.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Mobile Layout (Sliding Panel) */}
                      <div className="lg:hidden overflow-hidden w-full relative">
                        <div
                          className="flex w-[200%] transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
                          style={{
                            transform: activeTab === "detail" && selectedOrder ? "translateX(-50%)" : "translateX(0)"
                          }}
                        >
                          {/* Slide 1: List */}
                          <div className="w-1/2 pr-2">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                Hasil Pencarian ({searchResults.length})
                              </h4>
                              {searchResults.length > 1 && (
                                <span className="text-[9px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-[4px]">
                                  Pilih untuk detail
                                </span>
                              )}
                            </div>
                            <div className="border border-zinc-200 dark:border-zinc-800 rounded-[6px] bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-850 shadow-xs max-h-[450px] overflow-y-auto">
                              {searchResults.map((order, idx) => {
                                const statusInfo = getStatusConfig(order)
                                return (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      setSelectedOrder(order)
                                      setActiveTab("detail")
                                    }}
                                    className="w-full text-left p-3.5 transition-all flex flex-col gap-1 focus:outline-hidden hover:bg-zinc-50 dark:hover:bg-zinc-800/20 cursor-pointer"
                                  >
                                    <div className="flex items-center justify-between w-full">
                                      <span className="font-mono text-[11px] font-bold text-zinc-900 dark:text-zinc-50">
                                        #{order.id || "ORDER"}
                                      </span>
                                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full border font-semibold", statusInfo.badge)}>
                                        {statusInfo.label}
                                      </span>
                                    </div>
                                    <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                                      {order.name || "-"}
                                    </div>
                                    <div className="text-[10px] text-zinc-400 dark:text-zinc-500 flex justify-between">
                                      <span className="truncate max-w-[140px]">{order.prodi || order.order}</span>
                                      <span>{order.timestamp?.split(" ")[0]}</span>
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          {/* Slide 2: Details */}
                          <div className="w-1/2 pl-2">
                            {selectedOrder && (
                              <div className="space-y-3">
                                {searchResults.length > 1 && (
                                  <button
                                    onClick={() => setActiveTab("list")}
                                    className="inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline py-1.5 cursor-pointer"
                                  >
                                    <ChevronLeft className="size-3.5" /> Kembali ke Daftar Hasil
                                  </button>
                                )}
                                <OrderDetailCard
                                  order={selectedOrder}
                                  steps={getSteps(selectedOrder)}
                                  statusInfo={getStatusConfig(selectedOrder)}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-zinc-100 dark:border-zinc-900 bg-white/20 py-8 text-center text-[10px] text-zinc-400 dark:text-zinc-600 font-sans">
        <p>© 2026 Tracking Order App. All rights reserved.</p>
        <p className="mt-0.5">Sistem Pelacakan Mandiri Terintegrasi Google Sheets.</p>
      </footer>
    </div>
  )
}

// Order Details Card Component
interface OrderDetailCardProps {
  order: NormalizedOrder
  steps: Step[]
  statusInfo: {
    label: string
    badge: string
    icon: React.ComponentType<{ className?: string }>
  }
}

function OrderDetailCard({ order, steps, statusInfo }: OrderDetailCardProps) {
  const Icon = statusInfo.icon

  // Clean order string display
  const displayOrder = order.order ? order.order.replace(">>", "→") : "-"

  // Format WA URL if valid
  const cleanWa = order.whatsapp.replace(/[^0-9]/g, "")
  const waUrl = cleanWa
    ? `https://wa.me/${cleanWa.startsWith("0") ? "62" + cleanWa.slice(1) : cleanWa}`
    : null

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-[6px] bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
      {/* Top Banner */}
      <div className="border-b border-zinc-100 dark:border-zinc-800 p-4 sm:p-5 bg-zinc-50/50 dark:bg-zinc-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-[4px] text-zinc-800 dark:text-zinc-200 border border-zinc-200/50 dark:border-zinc-700/50 select-none">
                {order.id || "ID TIDAK TERSEDIA"}
              </span>
              {order.idTransaksi && order.idTransaksi !== order.id && (
                <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/60 px-1.5 py-0.5 rounded-[4px] border border-zinc-200/50 dark:border-zinc-700/40 select-none">
                  Trx: {order.idTransaksi}
                </span>
              )}
              {order.sektor && (
                <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-[4px] border border-zinc-200/50 dark:border-zinc-700/40 select-none">
                  {order.sektor}
                </span>
              )}
              {order.timestamp && (
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-sans">
                  {order.timestamp}
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {order.name || "Nama Pelanggan"}
            </h2>
          </div>

          <div className="self-start sm:self-center">
            <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold tracking-wide", statusInfo.badge)}>
              <Icon className="size-3.5" />
              <span>{statusInfo.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 space-y-5">
        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-zinc-50/50 dark:bg-zinc-900/20 p-3.5 rounded-[6px] border border-zinc-100 dark:border-zinc-850">
          {/* Order / Paket */}
          <div className="space-y-0.5">
            <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Package className="size-3" />
              <span>Pesanan / Paket</span>
            </div>
            <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              {displayOrder}
            </div>
          </div>

          {/* Program Studi / Prodi */}
          <div className="space-y-0.5">
            <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-sans">
              Program Studi / Prodi
            </div>
            <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              {order.prodi || "-"}
            </div>
          </div>

          {/* Metode Pengambilan */}
          <div className="space-y-0.5">
            <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <MapPin className="size-3" />
              <span>Metode Pengambilan</span>
            </div>
            <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              {order.metodePengambilan || "-"}
            </div>
            {order.alamatKos && (
              <div className="text-[10.5px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Alamat Kos: <span className="font-medium text-zinc-700 dark:text-zinc-300">{order.alamatKos}</span>
              </div>
            )}
          </div>

          {/* Nomor WhatsApp */}
          <div className="space-y-1">
            <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Phone className="size-3" />
              <span>Kontak WhatsApp</span>
            </div>
            <div className="text-xs text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
              <span>{order.whatsapp || "-"}</span>
              {waUrl && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-emerald-600 hover:underline font-semibold inline-flex items-center gap-0.5"
                >
                  WhatsApp <ExternalLink className="size-2.5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* 3 Tahap Stepper Timeline */}
        <div className="space-y-3 pt-1">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-sans">
            Tahapan Status Pesanan (3 Tahap)
          </h3>

          <div className="relative pl-5 border-l border-zinc-200 dark:border-zinc-800 ml-2.5 space-y-5 py-1">
            {steps.map((step, idx) => {
              return (
                <div key={idx} className="relative">
                  {/* Step Icon / Circle */}
                  <div className="absolute -left-[27px] top-0.5 flex items-center justify-center">
                    {step.status === "done" && (
                      <div className="size-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-none select-none">
                        <CheckCircle2 className="size-2.5" />
                      </div>
                    )}

                    {step.status === "active" && (
                      <div className="size-4 rounded-full bg-primary text-white flex items-center justify-center animate-pulse select-none">
                        <Loader2 className="size-2.5 animate-spin" />
                      </div>
                    )}

                    {step.status === "pending" && (
                      <div className="size-4 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 flex items-center justify-center border border-zinc-250 dark:border-zinc-700">
                        <span className="text-[9px] font-bold">{idx + 1}</span>
                      </div>
                    )}

                    {step.status === "failed" && (
                      <div className="size-4 rounded-full bg-rose-500 text-white flex items-center justify-center select-none">
                        <XCircle className="size-2.5" />
                      </div>
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="space-y-0.5 pl-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono font-bold text-zinc-400">
                        Tahap {idx + 1}
                      </span>
                      <h4
                        className={cn(
                          "text-xs font-bold transition-colors",
                          step.status === "done" && "text-zinc-950 dark:text-zinc-50",
                          step.status === "active" && "text-primary dark:text-[#FDA4AF]",
                          step.status === "pending" && "text-zinc-400 dark:text-zinc-500",
                          step.status === "failed" && "text-rose-600 dark:text-rose-400"
                        )}
                      >
                        {step.title}
                      </h4>
                    </div>
                    <p
                      className={cn(
                        "text-[10.5px] leading-relaxed transition-colors",
                        step.status === "done" && "text-zinc-500 dark:text-zinc-400",
                        step.status === "active" && "text-zinc-700 dark:text-zinc-300 font-semibold",
                        step.status === "pending" && "text-zinc-400 dark:text-zinc-500",
                        step.status === "failed" && "text-rose-500 dark:text-rose-400/90"
                      )}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Status Notice Alert */}
        {order.isInvalid ? (
          <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-[4px] flex gap-2 text-rose-700 dark:text-rose-400 text-xs">
            <AlertTriangle className="size-3.5 shrink-0 mt-0.5 text-rose-500" />
            <div className="space-y-1 leading-relaxed text-[11px]">
              <span className="font-semibold text-rose-800 dark:text-rose-300 block">Status: Pembayaran Tidak Valid</span>
              <p>
                Bukti pembayaran tidak valid atau terdapat kendala pada transaksi Anda. Silakan hubungi admin kami untuk konfirmasi dan bantuan lebih lanjut.
              </p>
              <a
                href="https://wa.link/tddgvy"
                className="inline-flex items-center gap-1 font-bold underline hover:text-rose-800 dark:hover:text-rose-300 pt-0.5"
                target="_blank"
                rel="noreferrer"
              >
                Hubungi Admin WhatsApp <ArrowRight className="size-3" />
              </a>
            </div>
          </div>
        ) : order.isSelesai ? (
          <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-[4px] flex gap-2 text-emerald-700 dark:text-emerald-400 text-xs">
            <CheckCircle2 className="size-3.5 shrink-0 mt-0.5 text-emerald-500" />
            <div className="space-y-0.5 leading-relaxed text-[11px]">
              <span className="font-semibold text-emerald-800 dark:text-emerald-300 block">Pesanan Selesai</span>
              Pesanan telah diterima / diserahkan dengan sukses. Terima kasih atas partisipasinya!
            </div>
          </div>
        ) : order.isSiapDiambil ? (
          <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-[4px] flex gap-2 text-blue-700 dark:text-blue-400 text-xs">
            <PackageCheck className="size-3.5 shrink-0 mt-0.5 text-blue-600" />
            <div className="space-y-0.5 leading-relaxed text-[11px]">
              <span className="font-semibold text-blue-800 dark:text-blue-300 block">Pesanan Siap Diambil / Diantar</span>
              {order.metodePengambilan?.toLowerCase().includes("kos") ? (
                <span>Pesanan Anda sudah siap! Untuk pengantaran via kos akan dihubungi oleh admin.</span>
              ) : (
                <span>Pesanan Anda sudah siap! Untuk pengantaran / pengambilan di UPI akan diinfokan lebih lanjut.</span>
              )}
            </div>
          </div>
        ) : order.isKonfirmasiSelesai ? (
          <div className="p-3.5 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40 rounded-[4px] flex gap-2 text-teal-700 dark:text-teal-400 text-xs">
            <CheckCircle2 className="size-3.5 shrink-0 mt-0.5 text-teal-600" />
            <div className="space-y-0.5 leading-relaxed text-[11px]">
              <span className="font-semibold text-teal-800 dark:text-teal-300 block">Pembayaran Terverifikasi</span>
              Pembayaran telah diverifikasi oleh admin. Pesanan Anda saat ini sedang dalam proses penyiapan dan pengemasan oleh tim.
            </div>
          </div>
        ) : (
          <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-[4px] flex gap-2 text-amber-700 dark:text-amber-400 text-xs">
            <Clock className="size-3.5 shrink-0 mt-0.5 text-amber-600" />
            <div className="space-y-0.5 leading-relaxed text-[11px]">
              <span className="font-semibold text-amber-800 dark:text-amber-300 block">Verifikasi Pembayaran (Sedang Diproses)</span>
              Admin sedang memeriksa dan memverifikasi bukti transfer pembayaran Anda. Mohon tunggu proses pengecekan berkala.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
