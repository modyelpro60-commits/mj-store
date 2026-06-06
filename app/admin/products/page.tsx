"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, type Variants } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "../../../components/auth/AuthProvider";
import { normalizeProductFeatures } from "../../lib/products/featureHelpers";
import {
  AlertCircle,
  BadgePlus,
  Check,
  ImagePlus,
  LoaderCircle,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";

type ProductFeature = string;

interface ProductRecord {
  id: number;
  name: string;
  price: number;
  category: string;
  badge: string;
  description: string;
  full_description: string;
  image: string;
  features?: ProductFeature[] | string | null;
}

interface SaveProductResponse {
  success: boolean;
  error?: string;
}

interface UploadImageResponse {
  success: boolean;
  url?: string;
  error?: string;
}

interface ProductsResponse extends Array<ProductRecord> {}

function normalizeFeatures(features: ProductRecord["features"]): string[] {
  return normalizeProductFeatures({ features });
}

const panelVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.45 },
  }),
};

export default function ProductsPage() {
  const { accessToken, role, status, isLoading } = useAuth();
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [badge, setBadge] = useState("");
  const [description, setDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [features, setFeatures] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [savingDeleteId, setSavingDeleteId] = useState<number | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setPageLoading(true);
      const res = await fetch("/api/get-products");
      const data = (await res.json()) as ProductsResponse;
      setProducts(data);
    } finally {
      setPageLoading(false);
    }
  }

  async function saveProduct() {
    try {
      setLoading(true);

      let imageUrl = preview;

      if (image) {
        const formData = new FormData();
        formData.append("file", image);

        const uploadRes = await fetch("/api/upload-image", {
          method: "POST",
          body: formData,
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        });

        const uploadData = (await uploadRes.json()) as UploadImageResponse;

        if (!uploadData.success || !uploadData.url) {
          toast.error(uploadData.error || "Image upload failed");
          return;
        }

        imageUrl = uploadData.url;
      }

      const payload = {
        name,
        description,
        full_description: fullDescription,
        price: Number(price),
        image: imageUrl,
        category,
        badge,
        features,
      };

      const endpoint = editingId ? "/api/update-product" : "/api/create-product";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(
          editingId
            ? {
                id: editingId,
                ...payload,
              }
            : payload
        ),
      });

      const data = (await res.json()) as SaveProductResponse;

      if (!data.success) {
        toast.error(data.error || "Something went wrong");
        return;
      }

      toast.success(editingId ? "Product Updated Successfully" : "Product Added Successfully");

      setName("");
      setPrice("");
      setCategory("");
      setBadge("");
      setDescription("");
      setFullDescription("");
      setFeatures([""]);
      setImage(null);
      setPreview("");
      setEditingId(null);

      loadProducts();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function deleteProduct(id: number) {
    if (role !== "admin") {
      toast.error("Only Admin can delete products.");
      return;
    }

    try {
      setSavingDeleteId(id);

      const res = await fetch("/api/delete-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ id }),
      });

      const data = (await res.json()) as SaveProductResponse;

      if (data.success) {
        setPendingDeleteId(null);
        toast.success("Product deleted successfully");
        loadProducts();
      } else {
        setPendingDeleteId(null);
        toast.error(data.error || "Something went wrong");
      }
    } catch (error) {
      console.error(error);
      setPendingDeleteId(null);
      toast.error("Something went wrong");
    } finally {
      setSavingDeleteId(null);
    }
  }

  function editProduct(product: ProductRecord) {
    setEditingId(product.id);
    setName(product.name || "");
    setPrice(String(product.price || ""));
    setCategory(product.category || "");
    setBadge(product.badge || "");
    setDescription(product.description || "");
    setFullDescription(product.full_description || "");
    setFeatures(normalizeFeatures(product.features));
    setPreview(product.image || "");
    setImage(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  const stats = useMemo(
    () => [
      {
        label: "Products",
        value: products.length,
      },
      {
        label: "Editing",
        value: editingId ? 1 : 0,
      },
      {
        label: "Features",
        value: features.length,
      },
    ],
    [editingId, features.length, products.length]
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-6"
      >
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="rounded-[2rem] border border-white/10 bg-zinc-950/75 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-8"
        >
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-200">
                <Sparkles className="h-4 w-4" />
                Product Studio
              </div>

              <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
                Product Management
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
                Add, edit, and curate products with a cleaner hierarchy, stronger contrast, and
                premium neon-accented controls.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:w-[420px]">
              {stats.map((item, index) => (
                <motion.div
                  key={item.label}
                  custom={index * 0.08}
                  variants={panelVariants}
                  initial="hidden"
                  animate="visible"
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{item.label}</p>
                  <p className="mt-2 text-2xl font-black">{item.value}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.06 }}
            className="overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/75 shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
          >
            <div className="border-b border-white/10 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl border border-purple-500/20 bg-purple-500/10 text-purple-200">
                  <ImagePlus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight">Product Image</h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    Preview media, then upload when you save.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex min-h-[420px] items-center justify-center overflow-hidden rounded-[1.75rem] border-2 border-dashed border-purple-500/20 bg-white/5">
                {preview ? (
                  <img src={preview} alt="preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="max-w-xs text-center">
                    <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl border border-purple-500/20 bg-purple-500/10 text-purple-200">
                      <Upload className="h-7 w-7" />
                    </div>
                    <p className="text-lg font-semibold text-zinc-200">Upload Preview Here</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      Use a crisp product image for the best storefront presentation.
                    </p>
                  </div>
                )}
              </div>

              <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-purple-400/20 bg-purple-500/15 px-5 py-4 font-semibold text-purple-100 transition-all duration-300 hover:border-purple-400/40 hover:bg-purple-500/20 hover:shadow-[0_0_30px_rgba(168,85,247,0.16)]">
                <Plus className="h-4 w-4" />
                Upload Image
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setImage(file);
                    setPreview(URL.createObjectURL(file));
                  }}
                />
              </label>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="rounded-[2rem] border border-white/10 bg-zinc-950/75 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl border border-purple-500/20 bg-purple-500/10 text-purple-200">
                <Pencil className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">
                  {editingId ? "Edit Product" : "Product Details"}
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Keep descriptions concise, polished, and easy to scan.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Product Name"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 outline-none transition-all duration-300 placeholder:text-zinc-600 focus:border-purple-400/40 focus:bg-purple-500/10"
              />
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Price"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 outline-none transition-all duration-300 placeholder:text-zinc-600 focus:border-purple-400/40 focus:bg-purple-500/10"
              />
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Category"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 outline-none transition-all duration-300 placeholder:text-zinc-600 focus:border-purple-400/40 focus:bg-purple-500/10"
              />
              <input
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="Badge"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 outline-none transition-all duration-300 placeholder:text-zinc-600 focus:border-purple-400/40 focus:bg-purple-500/10"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short Description"
                className="h-28 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-4 outline-none transition-all duration-300 placeholder:text-zinc-600 focus:border-purple-400/40 focus:bg-purple-500/10"
              />
              <textarea
                value={fullDescription}
                onChange={(e) => setFullDescription(e.target.value)}
                placeholder="Full Description"
                className="h-40 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-4 outline-none transition-all duration-300 placeholder:text-zinc-600 focus:border-purple-400/40 focus:bg-purple-500/10"
              />

              <div className="border-t border-white/10 pt-6">
                <div className="flex items-center gap-3">
                  <BadgePlus className="h-5 w-5 text-purple-300" />
                  <h3 className="text-lg font-bold">Features</h3>
                </div>

                <div className="mt-4 space-y-3">
                  {features.map((feature, index) => (
                    <div key={index} className="flex gap-3">
                      <input
                        value={feature}
                        onChange={(e) => {
                          const updated = [...features];
                          updated[index] = e.target.value;
                          setFeatures(updated);
                        }}
                        placeholder={`Feature ${index + 1}`}
                        className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 outline-none transition-all duration-300 placeholder:text-zinc-600 focus:border-purple-400/40 focus:bg-purple-500/10"
                      />

                      <button
                        type="button"
                        onClick={() => {
                          const updated = features.filter((_, i) => i !== index);
                          setFeatures(updated.length ? updated : [""]);
                        }}
                        className="grid w-12 place-items-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-200 transition-all duration-300 hover:bg-red-500/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => setFeatures([...features, ""])}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 font-semibold text-zinc-200 transition-all duration-300 hover:border-purple-400/30 hover:bg-purple-500/10 hover:text-white"
                  >
                    <Plus className="h-4 w-4" />
                    Add Feature
                  </button>
                </div>
              </div>

              <button
                onClick={saveProduct}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-purple-400/20 bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-4 font-bold text-white transition-all duration-300 hover:shadow-[0_0_40px_rgba(168,85,247,0.22)] disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Check className="h-5 w-5" />
                    {editingId ? "Update Product" : "Save Product"}
                  </span>
                )}
              </button>
            </div>
          </motion.section>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.16 }}
          className="rounded-[2rem] border border-white/10 bg-zinc-950/75 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-purple-500/20 bg-purple-500/10 text-purple-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">All Products</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Your catalog list with improved spacing and action clarity.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {pageLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 animate-pulse rounded-[1.5rem] border border-white/10 bg-white/5"
                />
              ))
            ) : products.length === 0 ? (
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-zinc-400">
                No products available.
              </div>
            ) : (
              products.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-col gap-5 rounded-[1.5rem] border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:border-purple-400/25 hover:bg-purple-500/10 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-20 w-20 rounded-2xl object-cover"
                    />

                    <div className="min-w-0">
                      <h3 className="truncate text-xl font-bold">{product.name}</h3>
                      <p className="mt-1 text-zinc-400">{product.category}</p>
                      <p className="mt-1 text-purple-300 font-bold">{product.price} EGP</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => editProduct(product)}
                      className="flex items-center gap-2 rounded-xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 font-semibold text-blue-100 transition-all duration-300 hover:bg-blue-500/20"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>

                    <button
                      onClick={() => setPendingDeleteId(product.id)}
                      disabled={savingDeleteId === product.id}
                      className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 font-semibold text-red-100 transition-all duration-300 hover:bg-red-500/20 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.section>
      </motion.div>

      {/* Delete confirmation modal — teleported to document.body */}
      {typeof window !== "undefined" && pendingDeleteId !== null
        ? createPortal(
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={() => setPendingDeleteId(null)}
            >
              <div
                className="w-full max-w-sm rounded-[2rem] border border-red-500/20 bg-zinc-950 p-6 shadow-[0_40px_100px_rgba(0,0,0,0.6)]"
                onClick={(e) => e.stopPropagation()}
              >
                <AlertCircle className="mx-auto h-10 w-10 text-red-400" />
                <h3 className="mt-4 text-lg font-bold text-white text-center">Delete Product?</h3>
                <p className="mt-2 text-sm text-zinc-400 text-center">This action cannot be undone.</p>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => deleteProduct(pendingDeleteId)}
                    disabled={savingDeleteId === pendingDeleteId}
                    className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 font-bold text-white transition-all duration-200 hover:bg-red-700 disabled:opacity-50"
                  >
                    {savingDeleteId === pendingDeleteId ? (
                      <span className="flex items-center justify-center gap-2">
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Deleting...
                      </span>
                    ) : (
                      "Delete"
                    )}
                  </button>
                  <button
                    onClick={() => setPendingDeleteId(null)}
                    disabled={savingDeleteId === pendingDeleteId}
                    className="flex-1 rounded-xl bg-zinc-700 px-4 py-2.5 font-bold text-zinc-300 transition-all duration-200 hover:bg-zinc-600 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
