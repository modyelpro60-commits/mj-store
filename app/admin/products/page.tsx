"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertCircle,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  Layers,
  LoaderCircle,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Upload,
  X,
} from "lucide-react";
import { useAuth } from "../../../components/auth/AuthProvider";
import { useLanguage } from "../../../lib/i18n/LanguageProvider";

/* ─────────────────────────── Types ─────────────────────────── */
type ProductStatus = "available" | "out_of_stock" | "coming_soon";
type PanelMode = "welcome" | "editor";

interface ProductRecord {
  id: number;
  name: string;
  price: number;
  original_price?: number | null;
  description: string;
  image: string;
  status?: ProductStatus;
  updated_at?: string;
}
interface SaveProductResponse  { success: boolean; error?: string }
interface UploadImageResponse  { success: boolean; url?: string; error?: string }

/* ─────────────────────────── Status ────────────────────────── */
const STATUS_OPTIONS: ProductStatus[] = ["available", "out_of_stock", "coming_soon"];
const S = {
  available:    { label: "متوفر",        dot: "bg-emerald-400", text: "text-emerald-300", ring: "border-emerald-500/35 bg-emerald-500/10" },
  out_of_stock: { label: "نفذت الكمية", dot: "bg-red-400",     text: "text-red-300",    ring: "border-red-500/35 bg-red-500/10"         },
  coming_soon:  { label: "قريباً",       dot: "bg-amber-400",   text: "text-amber-300",  ring: "border-amber-500/35 bg-amber-500/10"     },
} satisfies Record<ProductStatus, { label: string; dot: string; text: string; ring: string }>;

/* ─────────────────────────── Tiny helpers ───────────────────── */
const inp = "w-full rounded-xl border border-white/[0.08] bg-zinc-900/70 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 transition focus:border-purple-500/50 focus:bg-purple-500/[0.06] focus:ring-1 focus:ring-purple-500/20";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-3">{children}</p>
  );
}

function Divider() {
  return <div className="border-t border-white/[0.05] my-5" />;
}

/* ─────────────────────────── Product row ───────────────────── */
function ProductRow({
  product, isSelected, onSelect, onDuplicate, onDelete,
}: {
  product: ProductRecord; isSelected: boolean;
  onSelect: () => void; onDuplicate: () => void; onDelete: () => void;
}) {
  const status: ProductStatus = (product.status as ProductStatus) ?? "available";
  const m = S[status];

  return (
    <div
      onClick={onSelect}
      className={[
        "group relative flex items-center gap-3 px-3 py-2.5 cursor-pointer select-none transition-all duration-100",
        "border-b border-white/[0.03] last:border-0",
        isSelected
          ? "bg-purple-600/[0.16] border-l-2 border-l-purple-500 shadow-[inset_2px_0_0_0_rgb(168,85,247)]"
          : "hover:bg-white/[0.025] border-l-2 border-l-transparent",
      ].join(" ")}
    >
      {/* Thumb */}
      <div className={[
        "h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl border transition-all duration-100",
        isSelected ? "border-purple-500/40 ring-1 ring-purple-500/20" : "border-white/[0.07]",
        "bg-zinc-900",
      ].join(" ")}>
        {product.image
          ? <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
          : <div className="h-full w-full grid place-items-center"><Package className="h-4 w-4 text-zinc-600" /></div>}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={["truncate text-[13px] font-semibold leading-none transition-colors", isSelected ? "text-white" : "text-zinc-200"].join(" ")}>
          {product.name || "Untitled"}
        </p>
        <div className="mt-1 flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${m.dot}`} />
          <span className={`text-[10px] font-bold ${m.text}`}>{m.label}</span>
          <span className="text-zinc-700 text-[10px]">·</span>
          <span className="text-[10px] font-bold text-purple-400/80 tabular-nums">
            {Number(product.price).toLocaleString()} EGP
          </span>
        </div>
      </div>

      {/* Hover actions */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 z-10">
        <button type="button" title="Duplicate" onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          className="grid h-6 w-6 place-items-center rounded-md border border-white/10 bg-zinc-800/90 text-zinc-400 hover:text-white transition">
          <Copy className="h-3 w-3" />
        </button>
        <button type="button" title="Delete" onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="grid h-6 w-6 place-items-center rounded-md border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────── Welcome panel ─────────────────── */
function WelcomePanel({ products, onNew, onSelect }: {
  products: ProductRecord[];
  onNew: () => void; onSelect: (p: ProductRecord) => void;
}) {
  const totalValue = products.reduce((s, p) => s + Number(p.price ?? 0), 0);
  const recent = products.slice(0, 5);

  return (
    <div className="p-5 space-y-5" dir="rtl">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { icon: Package,    label: "المنتجات",       value: String(products.length) },
          { icon: TrendingUp, label: "القيمة الإجمالية", value: `${totalValue.toLocaleString()} EGP` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-2xl border border-white/[0.06] bg-zinc-900/50 px-3 py-3 text-center">
            <Icon className="h-3.5 w-3.5 text-purple-400 mx-auto mb-1.5" />
            <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider">{label}</p>
            <p className="mt-0.5 text-sm font-black text-white tabular-nums truncate">{value}</p>
          </div>
        ))}
      </div>

      {/* Create CTA */}
      <button onClick={onNew}
        className="w-full rounded-2xl border border-dashed border-purple-500/25 bg-purple-500/[0.05] p-5 flex flex-col items-center gap-3 transition-all duration-200 hover:border-purple-400/45 hover:bg-purple-500/[0.09] group"
      >
        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-purple-500/20 bg-purple-500/10 text-purple-300 group-hover:bg-purple-500/20 transition-colors">
          <Plus className="h-5 w-5" />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-white">إضافة منتج جديد</p>
          <p className="text-xs text-zinc-500 mt-0.5">أضف منتجاً لكتالوج المتجر</p>
        </div>
      </button>

      {/* Recent */}
      {recent.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-2.5">آخر المنتجات</p>
          <div className="rounded-2xl border border-white/[0.05] bg-zinc-900/30 overflow-hidden divide-y divide-white/[0.04]">
            {recent.map((p) => (
              <button key={p.id} onClick={() => onSelect(p)}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-white/[0.04] transition text-right group"
              >
                <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-lg border border-white/[0.06] bg-zinc-800">
                  {p.image
                    ? <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                    : <div className="h-full w-full grid place-items-center"><Package className="h-3 w-3 text-zinc-600" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs font-semibold text-zinc-300 group-hover:text-white transition-colors">{p.name}</p>
                  <p className="text-[10px] text-zinc-600">{Number(p.price).toLocaleString()} EGP</p>
                </div>
                <Pencil className="h-3 w-3 text-zinc-700 group-hover:text-purple-400 transition-colors flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Studio Editor ────────────────── */
function StudioEditor({
  editingId, name, setName, price, setPrice, originalPrice, setOriginalPrice,
  description, setDescription, editorStatus, setEditorStatus,
  preview, imageUploading, onImagePick, saving, onSave, onDelete, onClose, onDuplicate,
  productId,
}: {
  editingId: number | null;
  name: string; setName(v: string): void;
  price: string; setPrice(v: string): void;
  originalPrice: string; setOriginalPrice(v: string): void;
  description: string; setDescription(v: string): void;
  editorStatus: ProductStatus; setEditorStatus(v: ProductStatus): void;
  preview: string; imageUploading: boolean;
  onImagePick(f: File): void;
  saving: boolean;
  onSave(): void; onDelete(): void; onClose(): void; onDuplicate(): void;
  productId: number | null;
}) {
  // Discount badge preview
  const priceNum = Number(price) || 0;
  const origNum  = Number(originalPrice) || 0;
  const discountPct = origNum > priceNum && priceNum > 0
    ? Math.round((1 - priceNum / origNum) * 100)
    : 0;

  return (
    <div className="flex flex-col h-full" dir="rtl">

      {/* ── Sticky top bar ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-20 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-white truncate max-w-[160px]">
            {name || (editingId ? "تعديل المنتج" : "منتج جديد")}
          </span>
          {editingId && (
            <span className="text-[10px] font-bold rounded-md bg-white/[0.05] border border-white/[0.07] px-1.5 py-0.5 text-zinc-600">
              #{editingId}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {productId && (
            <>
              <a href={`/product/${productId}`} target="_blank" rel="noopener noreferrer"
                title="عرض صفحة المنتج"
                className="grid h-7 w-7 place-items-center rounded-lg border border-white/[0.08] bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-700/60 transition">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <button type="button" title="نسخ" onClick={onDuplicate}
                className="grid h-7 w-7 place-items-center rounded-lg border border-white/[0.08] bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-700/60 transition">
                <Copy className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          <button onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.05] transition ml-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Hero image ── */}
        <div className="relative">
          {preview ? (
            <div className="relative group cursor-pointer" onClick={() => document.getElementById("img-input")?.click()}>
              <img src={preview} alt={name || "Product"} className="w-full object-cover" style={{ maxHeight: 240, minHeight: 160 }} />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/55 backdrop-blur-[2px]">
                {imageUploading
                  ? <LoaderCircle className="h-5 w-5 animate-spin text-white" />
                  : <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-black/60 px-4 py-2 text-xs font-bold text-white">
                      <Upload className="h-3.5 w-3.5" /> استبدال الصورة
                    </div>}
              </div>
              {/* Status badge overlay */}
              <div className="absolute bottom-3 right-3">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${S[editorStatus].ring} ${S[editorStatus].text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${S[editorStatus].dot}`} />
                  {S[editorStatus].label}
                </span>
              </div>
              {/* Discount badge overlay */}
              {discountPct > 0 && (
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center rounded-full border border-red-500/40 bg-red-500/20 px-2.5 py-1 text-[11px] font-black text-red-300">
                    {discountPct}% OFF
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div onClick={() => document.getElementById("img-input")?.click()}
              className="group cursor-pointer flex flex-col items-center justify-center gap-3 bg-zinc-900/60 border-b border-white/[0.05] transition hover:bg-zinc-800/40"
              style={{ minHeight: 160 }}>
              {imageUploading
                ? <LoaderCircle className="h-6 w-6 animate-spin text-purple-400" />
                : <>
                    <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/[0.07] bg-zinc-800/60 text-zinc-600 group-hover:text-purple-400 group-hover:border-purple-500/25 transition-colors">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-semibold text-zinc-500 group-hover:text-zinc-300 transition-colors">انقر لرفع صورة</p>
                  </>}
            </div>
          )}
          <input id="img-input" type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onImagePick(f); }} />
        </div>

        {/* ── Form sections ── */}
        <div className="px-5 py-5 space-y-0">

          {/* GENERAL */}
          <div>
            <SectionLabel>بيانات المنتج</SectionLabel>
            <div className="space-y-2.5">

              {/* Name */}
              <input value={name} onChange={(e) => setName(e.target.value)}
                placeholder="اسم المنتج"
                className={`${inp} text-base font-semibold`} />

              {/* Pricing row */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Current price */}
                <div className="relative">
                  <input value={price} onChange={(e) => setPrice(e.target.value)}
                    placeholder="السعر الحالي" type="number" min="0"
                    className={inp} />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-600">EGP</span>
                </div>
                {/* Original price (optional — for discount) */}
                <div className="relative">
                  <input value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="السعر القديم (اختياري)" type="number" min="0"
                    className={inp} />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-600">EGP</span>
                </div>
              </div>

              {/* Discount preview */}
              {discountPct > 0 && (
                <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Check className="h-3 w-3" />
                  سيظهر خصم {discountPct}% تلقائياً على صفحة المنتج
                </p>
              )}
            </div>
          </div>

          <Divider />

          {/* STATUS */}
          <div>
            <SectionLabel>حالة المنتج</SectionLabel>
            <div className="grid grid-cols-3 gap-2">
              {STATUS_OPTIONS.map((s) => {
                const m = S[s];
                const active = editorStatus === s;
                return (
                  <button key={s} type="button" onClick={() => setEditorStatus(s)}
                    className={[
                      "flex flex-col items-center gap-2 rounded-xl border py-3 text-center transition-all duration-150",
                      active
                        ? `${m.ring} ${m.text} shadow-sm scale-[1.02]`
                        : "border-white/[0.07] bg-zinc-900/40 text-zinc-500 hover:border-white/10 hover:bg-zinc-800/30",
                    ].join(" ")}
                  >
                    <span className={`h-2 w-2 rounded-full ${active ? m.dot : "bg-zinc-700"} transition-colors`} />
                    <span className="text-[11px] font-bold leading-none">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Divider />

          {/* DESCRIPTION */}
          <div>
            <SectionLabel>وصف المنتج</SectionLabel>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="اكتب وصفاً للمنتج…"
              rows={5} className={`${inp} resize-none`} />
          </div>

        </div>
      </div>

      {/* ── Sticky footer ── */}
      <div className="flex-shrink-0 px-4 py-3.5 border-t border-white/[0.06] bg-zinc-950/80 backdrop-blur-xl sticky bottom-0 space-y-2">
        <button type="button" onClick={onSave} disabled={saving}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.20)] transition hover:shadow-[0_0_36px_rgba(168,85,247,0.35)] disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
        >
          {saving
            ? <><LoaderCircle className="h-4 w-4 animate-spin" /> جاري الحفظ…</>
            : <><Check className="h-4 w-4" /> {editingId ? "تحديث المنتج" : "إنشاء المنتج"}</>}
        </button>
        {editingId && (
          <button type="button" onClick={onDelete}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-500/15 bg-transparent py-2.5 text-xs font-semibold text-red-400/80 transition hover:bg-red-500/[0.07] hover:text-red-400 active:scale-[0.99]"
          >
            <Trash2 className="h-3.5 w-3.5" /> حذف المنتج
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export default function ProductsPage() {
  const { accessToken, role } = useAuth();
  const { translate } = useLanguage();

  /* Library */
  const [products, setProducts]             = useState<ProductRecord[]>([]);
  const [pageLoading, setPageLoading]       = useState(true);
  const [search, setSearch]                 = useState("");
  const [statusFilter, setStatusFilter]     = useState<"all" | ProductStatus>("all");
  const [selectedId, setSelectedId]         = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [savingDeleteId, setSavingDeleteId]   = useState<number | null>(null);

  /* Panel */
  const [panelMode, setPanelMode] = useState<PanelMode>("welcome");

  /* Form fields */
  const [editingId, setEditingId]           = useState<number | null>(null);
  const [name, setName]                     = useState("");
  const [price, setPrice]                   = useState("");
  const [originalPrice, setOriginalPrice]   = useState("");
  const [description, setDescription]       = useState("");
  const [editorStatus, setEditorStatus]     = useState<ProductStatus>("available");
  const [image, setImage]                   = useState<File | null>(null);
  const [preview, setPreview]               = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [saving, setSaving]                 = useState(false);

  /* ── Load ── */
  async function loadProducts() {
    try { setPageLoading(true); const r = await fetch("/api/get-products"); setProducts(await r.json()); }
    finally { setPageLoading(false); }
  }
  useEffect(() => { loadProducts(); }, []);

  const filtered = useMemo(() => products.filter((p) => {
    const q = search.toLowerCase();
    return (!q || p.name?.toLowerCase().includes(q))
      && (statusFilter === "all" || (p.status ?? "available") === statusFilter);
  }), [products, search, statusFilter]);

  /* ── Open new ── */
  function openNew() {
    setSelectedId(null); setEditingId(null);
    setName(""); setPrice(""); setOriginalPrice("");
    setDescription(""); setEditorStatus("available");
    setPreview(""); setImage(null);
    setPanelMode("editor");
  }

  /* ── Select ── */
  function selectProduct(p: ProductRecord) {
    setSelectedId(p.id); setEditingId(p.id);
    setName(p.name ?? ""); setPrice(String(p.price ?? ""));
    setOriginalPrice(p.original_price ? String(p.original_price) : "");
    setDescription(p.description ?? "");
    setEditorStatus((p.status as ProductStatus) ?? "available");
    setPreview(p.image ?? ""); setImage(null);
    setPanelMode("editor");
  }

  /* ── Close ── */
  function closeEditor() {
    setSelectedId(null); setEditingId(null);
    setPanelMode("welcome"); setPreview(""); setImage(null);
  }

  /* ── Duplicate ── */
  async function duplicateProduct(p?: ProductRecord) {
    const src = p ?? products.find((x) => x.id === editingId);
    if (!src) return;
    const res = await fetch("/api/create-product", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      body: JSON.stringify({
        name: src.name + " (نسخة)",
        description: src.description,
        price: Number(src.price),
        original_price: src.original_price ?? null,
        image: src.image,
        status: src.status ?? "available",
      }),
    });
    const data = await res.json();
    if (data.success) { toast.success("تم نسخ المنتج"); loadProducts(); }
    else toast.error(data.error || translate("admin.toast.error"));
  }

  /* ── Save ── */
  async function saveProduct() {
    try {
      setSaving(true);
      let imageUrl = preview;
      if (image) {
        setImageUploading(true);
        const fd = new FormData(); fd.append("file", image);
        const ur = await fetch("/api/upload-image", { method: "POST", body: fd, headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined });
        const ud = await ur.json() as UploadImageResponse;
        setImageUploading(false);
        if (!ud.success || !ud.url) { toast.error(ud.error || translate("admin.toast.uploadFailed")); return; }
        imageUrl = ud.url;
      }

      const origPriceNum = Number(originalPrice) || null;
      const payload = {
        name,
        description,
        price: Number(price),
        original_price: origPriceNum,
        image: imageUrl,
        status: editorStatus,
      };

      const endpoint = editingId ? "/api/update-product" : "/api/create-product";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });
      const data = await res.json() as SaveProductResponse;
      if (!data.success) { toast.error(data.error || translate("admin.toast.error")); return; }
      toast.success(editingId ? translate("admin.toast.productUpdated") : translate("admin.toast.productAdded"));
      closeEditor(); loadProducts();
    } catch { toast.error(translate("admin.toast.error")); }
    finally { setSaving(false); setImageUploading(false); }
  }

  /* ── Delete ── */
  async function deleteProduct(id: number) {
    if (role !== "admin") { toast.error(translate("admin.toast.adminOnly")); return; }
    try {
      setSavingDeleteId(id);
      const res = await fetch("/api/delete-product", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
        body: JSON.stringify({ id }),
      });
      const data = await res.json() as SaveProductResponse;
      if (data.success) {
        setPendingDeleteId(null);
        if (editingId === id) closeEditor();
        toast.success(translate("admin.toast.productDeleted"));
        loadProducts();
      } else { setPendingDeleteId(null); toast.error(data.error || translate("admin.toast.error")); }
    } catch { setPendingDeleteId(null); toast.error(translate("admin.toast.error")); }
    finally { setSavingDeleteId(null); }
  }

  /* ══════ RENDER ══════ */
  return (
    <>
      <div className="flex flex-col h-full min-h-screen bg-zinc-950 text-white">

        {/* ── TOP BAR ── */}
        <header className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.05] bg-zinc-950/90 backdrop-blur-xl sticky top-0 z-30 flex-wrap gap-y-2" dir="rtl">
          {/* Brand */}
          <div className="flex items-center gap-2 ml-1">
            <div className="grid h-7 w-7 place-items-center rounded-lg border border-purple-500/20 bg-purple-500/[0.10] text-purple-300">
              <Layers className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-black text-white">استوديو المنتجات</span>
          </div>

          <div className="h-4 w-px bg-white/[0.07] hidden sm:block" />

          {/* Search */}
          <div className="relative flex-1 min-w-[120px] max-w-[240px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-600 pointer-events-none" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث…"
              className="w-full rounded-xl border border-white/[0.07] bg-zinc-900/70 pr-8 pl-3 py-1.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-purple-500/40 transition" />
          </div>

          {/* Status filter */}
          <div className="relative hidden sm:block">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | ProductStatus)}
              className="appearance-none rounded-xl border border-white/[0.07] bg-zinc-900/70 pr-2.5 pl-7 py-1.5 text-xs text-zinc-400 outline-none focus:border-purple-500/30 cursor-pointer">
              <option value="all">كل الحالات</option>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{S[s].label}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-600" />
          </div>

          <span className="text-xs text-zinc-700 font-semibold tabular-nums hidden md:block">
            {filtered.length}{products.length !== filtered.length ? `/${products.length}` : ""} منتج
          </span>

          <div className="flex-1" />

          <button onClick={openNew}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-2 text-sm font-bold text-white shadow-[0_0_16px_rgba(168,85,247,0.20)] transition hover:shadow-[0_0_28px_rgba(168,85,247,0.35)] hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">منتج جديد</span>
          </button>
        </header>

        {/* ── MAIN SPLIT ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* LEFT — Library 48% */}
          <div className="flex flex-col border-r border-white/[0.04]" style={{ width: "48%", minWidth: 220, flexShrink: 0 }}>

            {/* Column head */}
            <div className="flex items-center gap-3 px-3 py-2 border-b border-white/[0.03] bg-zinc-900/20" dir="rtl">
              <div className="w-10 flex-shrink-0" />
              <span className="flex-1 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-700">المنتج</span>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-700 w-24 pl-2">السعر</span>
            </div>

            {/* Rows */}
            <div className="flex-1 overflow-y-auto">
              {pageLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 border-b border-white/[0.03]">
                    <div className="h-10 w-10 rounded-xl bg-white/[0.04] animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2.5 w-28 rounded bg-white/[0.04] animate-pulse" />
                      <div className="h-2 w-16 rounded bg-white/[0.03] animate-pulse" />
                    </div>
                  </div>
                ))
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/[0.06] bg-zinc-900/50 text-zinc-700">
                    <Package className="h-5 w-5" />
                  </div>
                  <div className="text-center" dir="rtl">
                    <p className="text-sm font-bold text-zinc-500">{search ? "لا توجد نتائج" : "لا توجد منتجات"}</p>
                    <p className="text-xs text-zinc-700 mt-0.5">{search ? "جرب بحثاً آخر" : "أنشئ أول منتج"}</p>
                  </div>
                  {!search && (
                    <button onClick={openNew}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-xs font-semibold text-purple-300 transition hover:bg-purple-500/15">
                      <Plus className="h-3.5 w-3.5" /> منتج جديد
                    </button>
                  )}
                </div>
              ) : filtered.map((p) => (
                <ProductRow
                  key={p.id} product={p}
                  isSelected={selectedId === p.id}
                  onSelect={() => selectProduct(p)}
                  onDuplicate={() => duplicateProduct(p)}
                  onDelete={() => setPendingDeleteId(p.id)}
                />
              ))}
            </div>
          </div>

          {/* RIGHT — Editor 52% */}
          <div className="flex-1 overflow-hidden bg-zinc-950/50">
            <AnimatePresence mode="wait">
              {panelMode === "welcome" ? (
                <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="h-full overflow-y-auto">
                  <WelcomePanel products={products} onNew={openNew} onSelect={selectProduct} />
                </motion.div>
              ) : (
                <motion.div key="editor" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.18 }} className="h-full overflow-hidden flex flex-col">
                  <StudioEditor
                    editingId={editingId}
                    name={name} setName={setName}
                    price={price} setPrice={setPrice}
                    originalPrice={originalPrice} setOriginalPrice={setOriginalPrice}
                    description={description} setDescription={setDescription}
                    editorStatus={editorStatus} setEditorStatus={setEditorStatus}
                    preview={preview} imageUploading={imageUploading}
                    onImagePick={(f) => { setImage(f); setPreview(URL.createObjectURL(f)); }}
                    saving={saving}
                    onSave={saveProduct}
                    onDelete={() => editingId && setPendingDeleteId(editingId)}
                    onClose={closeEditor}
                    onDuplicate={() => duplicateProduct()}
                    productId={editingId}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Delete modal */}
      {typeof window !== "undefined" && pendingDeleteId !== null
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={() => setPendingDeleteId(null)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.15 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-2xl border border-red-500/20 bg-zinc-950 p-6 shadow-[0_40px_80px_rgba(0,0,0,0.7)]"
                dir="rtl"
              >
                <div className="mx-auto grid h-10 w-10 place-items-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-center text-sm font-bold">{translate("admin.confirm.deleteProduct")}</h3>
                <p className="mt-1.5 text-center text-xs text-zinc-500">{translate("admin.confirm.cannotUndo")}</p>
                <div className="mt-5 flex gap-2.5">
                  <button type="button" onClick={() => deleteProduct(pendingDeleteId)} disabled={savingDeleteId === pendingDeleteId}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50">
                    {savingDeleteId === pendingDeleteId
                      ? <><LoaderCircle className="h-4 w-4 animate-spin" /> {translate("admin.confirm.deleting")}</>
                      : translate("admin.products.list.delete")}
                  </button>
                  <button type="button" onClick={() => setPendingDeleteId(null)} disabled={savingDeleteId === pendingDeleteId}
                    className="flex-1 rounded-xl bg-zinc-800 py-2.5 text-sm font-bold text-zinc-300 transition hover:bg-zinc-700 disabled:opacity-50">
                    {translate("admin.confirm.cancel")}
                  </button>
                </div>
              </motion.div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
