"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type {
  CatalogCategory as Category,
  CatalogCompany as Company,
  CatalogProduct as Product,
  CategoryFormState,
  CompanyFormState,
  ProductFormState,
} from "@/app/Data/database";

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "An unexpected error occurred";

const emptyCategory: CategoryFormState = { name: "", url: "" };
const emptyCompany: CompanyFormState = {
  name: "",
  image: "",
  categoryIds: [],
  productCount: "",
  imageMode: "url",
  imageFile: null,
};
const emptyProduct: ProductFormState = {
  name: "",
  companyId: "",
  categoryId: "",
  retailPrice: "",
  consumerPrice: "",
  bulkPrice: "",
  bulkLimit: "",
  image: "",
  description: "",
  imageMode: "url",
  imageFile: null,
};

export default function CatalogAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");

  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(emptyCategory);
  const [companyForm, setCompanyForm] = useState<CompanyFormState>(emptyCompany);
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProduct);

  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingCompanyId, setEditingCompanyId] = useState<number | null>(null);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "ADMIN") {
      router.push("/");
      return;
    }
    void loadData();
  }, [session, status, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [catRes, compRes, prodRes] = await Promise.all([
        fetch("/api/category"),
        fetch("/api/company"),
        fetch("/api/products"),
      ]);

      if (catRes.ok) setCategories(await catRes.json());
      if (compRes.ok) setCompanies(await compRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
    } catch (err) {
      console.error("Failed to load catalog data", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return products.slice(0, 50);
    return products.filter((p) => p.name.toLowerCase().includes(term)).slice(0, 50);
  }, [products, productSearch]);

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      alert("Category name is required");
      return;
    }

    setSaving(true);
    try {
      const method = editingCategoryId ? "PATCH" : "POST";
      const url = editingCategoryId
        ? `/api/category/${editingCategoryId}`
        : "/api/category";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: categoryForm.name.trim(),
          url: categoryForm.url.trim(),
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to save category");
      }

      await loadData();
      setCategoryForm(emptyCategory);
      setEditingCategoryId(null);
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (id: number) => {
    if (!confirm("Delete this category? Products linked to it will block deletion.")) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/category/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to delete category");
      }
      await loadData();
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const saveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyForm.name.trim()) {
      alert("Company name is required");
      return;
    }

    setSaving(true);
    try {
      const method = editingCompanyId ? "PATCH" : "POST";
      const url = editingCompanyId
        ? `/api/company/${editingCompanyId}`
        : "/api/company";

      let imageUrl = companyForm.imageMode === "url" ? companyForm.image.trim() : "";

      if (companyForm.imageMode === "upload" && companyForm.imageFile) {
        const uploadForm = new FormData();
        uploadForm.append("file", companyForm.imageFile);
        const uploadRes = await fetch("/api/uploads", {
          method: "POST",
          body: uploadForm,
        });
        if (!uploadRes.ok) {
          const error = await uploadRes.json().catch(() => ({}));
          throw new Error(error.error || "Image upload failed");
        }
        const data = await uploadRes.json();
        imageUrl = data.url;
      }

      const payload = {
        name: companyForm.name.trim(),
        image: imageUrl || null,
        categoryIds: companyForm.categoryIds,
        productCount: companyForm.productCount
          ? Number(companyForm.productCount)
          : undefined,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to save company");
      }

      await loadData();
      setCompanyForm(emptyCompany);
      setEditingCompanyId(null);
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const deleteCompany = async (id: number) => {
    if (!confirm("Delete this company? Existing products linked to it must be removed first.")) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/company/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to delete company");
      }
      await loadData();
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) {
      alert("Product name is required");
      return;
    }
    if (!productForm.companyId || !productForm.categoryId) {
      alert("Company and category are required");
      return;
    }

    let imageUrl =
      productForm.imageMode === "url" ? productForm.image.trim() : "";

    if (productForm.imageMode === "upload" && productForm.imageFile) {
      const uploadForm = new FormData();
      uploadForm.append("file", productForm.imageFile);
      const uploadRes = await fetch("/api/uploads", {
        method: "POST",
        body: uploadForm,
      });
      if (!uploadRes.ok) {
        const error = await uploadRes.json().catch(() => ({}));
        throw new Error(error.error || "Image upload failed");
      }
      const data = await uploadRes.json();
      imageUrl = data.url;
    }

    const payload = {
      name: productForm.name.trim(),
      companyId: Number(productForm.companyId),
      categoryId: Number(productForm.categoryId),
      retailPrice: Number(productForm.retailPrice || 0),
      consumerPrice: Number(productForm.consumerPrice || 0),
      bulkPrice: Number(productForm.bulkPrice || 0),
      bulkLimit: productForm.bulkLimit ? Number(productForm.bulkLimit) : null,
      image: imageUrl || undefined,
      description: productForm.description.trim() || null,
    };

    if (
      !Number.isFinite(payload.retailPrice) ||
      !Number.isFinite(payload.consumerPrice) ||
      !Number.isFinite(payload.bulkPrice)
    ) {
      alert("Please enter valid numeric prices");
      return;
    }

    setSaving(true);
    try {
      const method = editingProductId ? "PATCH" : "POST";
      const url = editingProductId
        ? `/api/products/${editingProductId}`
        : "/api/products";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to save product");
      }

      await loadData();
      setProductForm(emptyProduct);
      setEditingProductId(null);
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm("Delete this product? Orders containing it will block deletion.")) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to delete product");
      }
      await loadData();
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded bg-gray-100" />
        <div className="h-96 rounded-lg bg-gray-100" />
      </div>
    );
  }

  if (!session || session.user.role !== "ADMIN") {
    return (
      <div className="text-center text-red-600">
        Access denied. Admins only.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Catalog</h1>
          <p className="text-sm text-gray-500">
            Create, edit, or delete products, categories, and companies.
          </p>
        </div>
        <button
          onClick={() => loadData()}
          className="self-start rounded-lg border border-gray-200 bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          Refresh
        </button>
      </div>

      {/* Categories */}
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
            <p className="text-sm text-gray-500">
              Add a new category or edit an existing one.
            </p>
          </div>
          <span className="text-xs text-gray-500">
            {categories.length} total
          </span>
        </div>

        <form onSubmit={saveCategory} className="mt-4 grid gap-3 sm:grid-cols-3">
          <input
            type="text"
            placeholder="Name"
            value={categoryForm.name}
            onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
            required
          />
          <input
            type="text"
            placeholder="URL (optional)"
            value={categoryForm.url}
            onChange={(e) => setCategoryForm({ ...categoryForm, url: e.target.value })}
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
            >
              {editingCategoryId ? "Update" : "Add"} category
            </button>
            {editingCategoryId && (
              <button
                type="button"
                onClick={() => {
                  setEditingCategoryId(null);
                  setCategoryForm(emptyCategory);
                }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Name</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">URL</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Products</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-3 py-2">{category.name}</td>
                  <td className="px-3 py-2 text-gray-600">{category.url}</td>
                  <td className="px-3 py-2 text-gray-600">{category.productCount}</td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => {
                        setEditingCategoryId(category.id);
                        setCategoryForm({ name: category.name, url: category.url });
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => deleteCategory(category.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td className="px-3 py-3 text-sm text-gray-500" colSpan={4}>
                    No categories yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Companies */}
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Companies</h2>
            <p className="text-sm text-gray-500">
              Link companies to categories for better browsing.
            </p>
          </div>
          <span className="text-xs text-gray-500">
            {companies.length} total
          </span>
        </div>

        <form onSubmit={saveCompany} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="text"
            placeholder="Name"
            value={companyForm.name}
            onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
            required
          />
          <input
            type="text"
            placeholder="Image URL (optional)"
            value={companyForm.image}
            onChange={(e) => setCompanyForm({ ...companyForm, image: e.target.value })}
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
            disabled={companyForm.imageMode === "upload"}
          />
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-gray-700">Image mode</label>
            <select
              value={companyForm.imageMode}
              onChange={(e) =>
                setCompanyForm({
                  ...companyForm,
                  imageMode: e.target.value as "url" | "upload",
                  imageFile: null,
                })
              }
              className="rounded border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="url">URL</option>
              <option value="upload">Upload</option>
            </select>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setCompanyForm({
                ...companyForm,
                imageFile: e.target.files?.[0] || null,
              })
            }
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
            disabled={companyForm.imageMode !== "upload"}
          />
          <input
            type="number"
            min={0}
            placeholder="Product count (optional)"
            value={companyForm.productCount}
            onChange={(e) => setCompanyForm({ ...companyForm, productCount: e.target.value })}
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
          />
          <div className="rounded border border-gray-200 px-3 py-2">
            <p className="mb-2 text-xs font-semibold text-gray-700">Categories</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const checked = companyForm.categoryIds.includes(category.id);
                return (
                  <label key={category.id} className="flex items-center gap-1 text-xs text-gray-700">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setCompanyForm((prev) => ({
                          ...prev,
                          categoryIds: checked
                            ? prev.categoryIds.filter((id) => id !== category.id)
                            : [...prev.categoryIds, category.id],
                        }));
                      }}
                    />
                    {category.name}
                  </label>
                );
              })}
              {categories.length === 0 && (
                <span className="text-xs text-gray-500">Create a category first.</span>
              )}
            </div>
          </div>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
            >
              {editingCompanyId ? "Update" : "Add"} company
            </button>
            {editingCompanyId && (
              <button
                type="button"
                onClick={() => {
                  setEditingCompanyId(null);
                  setCompanyForm(emptyCompany);
                }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Name</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Categories</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Products</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {companies.map((company) => (
                <tr key={company.id}>
                  <td className="px-3 py-2 font-medium text-gray-900">{company.name}</td>
                  <td className="px-3 py-2 text-gray-600">
                    {(company.categories || []).join(", ") || "—"}
                  </td>
                  <td className="px-3 py-2 text-gray-600">{company.productCount}</td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => {
                        setEditingCompanyId(company.id);
                        const selectedCategoryIds = (company.categories || [])
                          .map((catName) => categories.find((c) => c.name === catName)?.id)
                          .filter((id): id is number => Boolean(id));
                        setCompanyForm({
                          name: company.name,
                          image: company.image || "",
                          categoryIds: selectedCategoryIds,
                          productCount: company.productCount.toString(),
                          imageMode: "url",
                          imageFile: null,
                        });
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => deleteCompany(company.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {companies.length === 0 && (
                <tr>
                  <td className="px-3 py-3 text-sm text-gray-500" colSpan={4}>
                    No companies yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Products */}
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Products</h2>
            <p className="text-sm text-gray-500">
              Add, edit, or remove products from your catalog.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search products"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-48 rounded border border-gray-200 px-3 py-2 text-sm"
            />
            <span className="text-xs text-gray-500">
              Showing {filteredProducts.length} of {products.length}
            </span>
          </div>
        </div>

        <form onSubmit={saveProduct} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="text"
            placeholder="Name"
            value={productForm.name}
            onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
            required
          />
          <select
            value={productForm.companyId}
            onChange={(e) => setProductForm({ ...productForm, companyId: e.target.value })}
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
            required
          >
            <option value="">Select company</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
          <select
            value={productForm.categoryId}
            onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
            required
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Image URL (optional)"
            value={productForm.image}
            onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
            disabled={productForm.imageMode === "upload"}
          />
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-gray-700">Image mode</label>
            <select
              value={productForm.imageMode}
              onChange={(e) =>
                setProductForm({
                  ...productForm,
                  imageMode: e.target.value as "url" | "upload",
                  imageFile: null,
                })
              }
              className="rounded border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="url">URL</option>
              <option value="upload">Upload</option>
            </select>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setProductForm({
                ...productForm,
                imageFile: e.target.files?.[0] || null,
              })
            }
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
            disabled={productForm.imageMode !== "upload"}
          />
          <input
            type="number"
            step="0.01"
            placeholder="Retail price"
            value={productForm.retailPrice}
            onChange={(e) => setProductForm({ ...productForm, retailPrice: e.target.value })}
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Consumer price"
            value={productForm.consumerPrice}
            onChange={(e) => setProductForm({ ...productForm, consumerPrice: e.target.value })}
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Bulk price"
            value={productForm.bulkPrice}
            onChange={(e) => setProductForm({ ...productForm, bulkPrice: e.target.value })}
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
            required
          />
          <input
            type="number"
            step="1"
            min="0"
            placeholder="Bulk limit (optional)"
            value={productForm.bulkLimit}
            onChange={(e) => setProductForm({ ...productForm, bulkLimit: e.target.value })}
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Description (optional)"
            value={productForm.description}
            onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm sm:col-span-2 lg:col-span-4"
            rows={2}
          />
          <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
            >
              {editingProductId ? "Update" : "Add"} product
            </button>
            {editingProductId && (
              <button
                type="button"
                onClick={() => {
                  setEditingProductId(null);
                  setProductForm(emptyProduct);
                }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Product</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Company</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Category</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Consumer</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Retail</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Bulk</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td className="px-3 py-2 font-medium text-gray-900">{product.name}</td>
                  <td className="px-3 py-2 text-gray-700">{product.company}</td>
                  <td className="px-3 py-2 text-gray-700">{product.category}</td>
                  <td className="px-3 py-2 text-gray-700">Rs {product.consumerPrice}</td>
                  <td className="px-3 py-2 text-gray-700">Rs {product.retailPrice}</td>
                  <td className="px-3 py-2 text-gray-700">Rs {product.bulkPrice}</td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => {
                        setEditingProductId(product.id);
                        setProductForm({
                          name: product.name,
                          companyId: product.companyId?.toString() || "",
                          categoryId: product.categoryId?.toString() || "",
                          retailPrice: product.retailPrice.toString(),
                          consumerPrice: product.consumerPrice.toString(),
                          bulkPrice: product.bulkPrice.toString(),
                          bulkLimit: product.bulkLimit?.toString() || "",
                          image: product.image,
                          description: product.description || "",
                          imageMode: "url",
                          imageFile: null,
                        });
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => deleteProduct(product.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td className="px-3 py-3 text-sm text-gray-500" colSpan={7}>
                    No products match this search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}


