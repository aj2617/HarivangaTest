import React from 'react';
import { Image as ImageIcon, Plus, Save, Trash2, X } from 'lucide-react';
import { Product } from '../../../types';
import { getDisplayImageSrc } from '../../../lib/imageSources';

type AdminProductModalProps = {
  editingProduct: Product | null;
  productForm: Partial<Product>;
  productOrigins: readonly string[];
  productImagesInputRef: React.RefObject<HTMLInputElement | null>;
  isSubmitting: boolean;
  submitError: string | null;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onChange: (next: Partial<Product>) => void;
  onVariantChange: (index: number, key: keyof Product['variants'][number], value: string) => void;
  onAddVariant: () => void;
  onAddPackageVariant: (weightLabel: string) => void;
  onRemoveVariant: (index: number) => void;
  onProductImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPrimaryImageSelect: (image: string) => void;
  onRemoveProductImage: (image: string) => void;
};

export const AdminProductModal: React.FC<AdminProductModalProps> = ({
  editingProduct,
  productForm,
  productOrigins,
  productImagesInputRef,
  isSubmitting,
  submitError,
  onClose,
  onSubmit,
  onChange,
  onVariantChange,
  onAddVariant,
  onAddPackageVariant,
  onRemoveVariant,
  onProductImageUpload,
  onPrimaryImageSelect,
  onRemoveProductImage,
}) => {
  const [customPackageKg, setCustomPackageKg] = React.useState('');

  const handleAddCustomPackage = () => {
    const trimmed = customPackageKg.trim();
    if (!trimmed) return;

    onAddPackageVariant(`${trimmed}kg Package`);
    setCustomPackageKg('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-mango-dark/60 backdrop-blur-sm" />
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 p-5 sm:p-8">
          <h2 className="text-xl font-black sm:text-2xl">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
          <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-full p-2 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="max-h-[75vh] space-y-6 overflow-y-auto p-5 sm:p-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Product Name</label>
              <input
                required
                type="text"
                value={productForm.name}
                onChange={(e) => onChange({ ...productForm, name: e.target.value })}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-mango-orange/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Variety</label>
              <select
                value={productForm.variety}
                onChange={(e) => onChange({ ...productForm, variety: e.target.value })}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-mango-orange/20"
              >
                <option>হাড়িভাঙ্গা</option>
                <option>আম রুপালী</option>
                <option>বারি-৪</option>
                <option>গৌড়মতি</option>
                <option>ব্যানানা</option>
                <option>কপিল বাংড়ি</option>
                <option>সাদা আম</option>
                <option>হিমসাগর</option>
                <option>খিরসাপাত</option>
                <option>কাটিমন</option>
                <option>ফজলি</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Description</label>
            <textarea
              required
              rows={3}
              value={productForm.description}
              onChange={(e) => onChange({ ...productForm, description: e.target.value })}
              className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-mango-orange/20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Taste Profile</label>
            <input
              required
              type="text"
              value={productForm.tasteProfile}
              onChange={(e) => onChange({ ...productForm, tasteProfile: e.target.value })}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-mango-orange/20"
              placeholder="Sweet, aromatic, creamy..."
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Origin</label>
              <select
                value={productForm.origin}
                onChange={(e) => onChange({ ...productForm, origin: e.target.value })}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-mango-orange/20"
              >
                {productOrigins.map((origin) => (
                  <option key={origin} value={origin}>{origin}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Season Status</label>
              <select
                value={productForm.isAvailable ? 'in-season' : 'out-of-season'}
                onChange={(e) => onChange({ ...productForm, isAvailable: e.target.value === 'in-season' })}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-mango-orange/20"
              >
                <option value="in-season">In Season</option>
                <option value="out-of-season">Out of Season</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Price Options</label>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button type="button" onClick={() => onAddPackageVariant('1kg')} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-mango-dark">
                  <Plus size={14} />
                  1kg
                </button>
                <button type="button" onClick={() => onAddPackageVariant('3kg Package')} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-mango-dark">
                  <Plus size={14} />
                  3kg
                </button>
                <button type="button" onClick={() => onAddPackageVariant('5kg Package')} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-mango-dark">
                  <Plus size={14} />
                  5kg
                </button>
                <button type="button" onClick={onAddVariant} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-mango-dark">
                  <Plus size={14} />
                  Add Price
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <p className="text-sm font-bold text-mango-dark">Custom package</p>
                <p className="text-xs text-gray-500">Create package options like 11kg, 22kg, or any custom weight.</p>
              </div>
              <div className="flex w-full gap-2 sm:w-auto">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={customPackageKg}
                  onChange={(e) => setCustomPackageKg(e.target.value)}
                  placeholder="11"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-mango-orange/20 sm:w-24"
                />
                <button
                  type="button"
                  onClick={handleAddCustomPackage}
                  className="inline-flex items-center justify-center rounded-xl bg-mango-orange px-4 py-3 text-sm font-bold text-white transition-all hover:bg-mango-orange/90"
                >
                  Add Custom
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {(productForm.variants ?? []).map((variant, index) => (
                <div key={index} className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 md:grid-cols-[minmax(0,1fr)_180px_52px]">
                  <input
                    required
                    type="text"
                    value={variant.weight}
                    onChange={(e) => onVariantChange(index, 'weight', e.target.value)}
                    placeholder="Weight label, e.g. 1kg or 5kg Box"
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-mango-orange/20"
                  />
                  <input
                    required
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={variant.price === 0 ? '' : String(variant.price)}
                    onChange={(e) => onVariantChange(index, 'price', e.target.value)}
                    placeholder="Price"
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-mango-orange/20"
                  />
                  <button type="button" onClick={() => onRemoveVariant(index)} className="inline-flex items-center justify-center rounded-2xl border border-red-100 bg-white text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <p className="text-xs text-gray-500">The first option becomes the starting price shown on Home and Shop.</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Product Images</label>
              <button type="button" onClick={() => productImagesInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-mango-dark">
                <ImageIcon size={14} />
                Upload Images
              </button>
              <input
                ref={productImagesInputRef}
                type="file"
                accept="image/webp,image/png,image/jpeg,image/jpg"
                multiple
                onChange={onProductImageUpload}
                className="hidden"
              />
            </div>

            {(productForm.images ?? []).length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {(productForm.images ?? []).map((image, index) => {
                  const isPrimary = productForm.image === image;
                  return (
                    <div key={`${image}-${index}`} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                      <div className="aspect-square overflow-hidden bg-gray-100">
                        <img src={getDisplayImageSrc(image)} alt={`Product upload ${index + 1}`} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                      </div>
                      <div className="flex items-center gap-2 p-3">
                        <button
                          type="button"
                          onClick={() => onPrimaryImageSelect(image)}
                          className={`flex-1 rounded-xl px-3 py-2 text-xs font-bold ${isPrimary ? 'bg-mango-orange text-white' : 'bg-gray-100 text-mango-dark'}`}
                        >
                          {isPrimary ? 'Primary' : 'Set Primary'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveProductImage(image)}
                          className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-500"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                Upload JPG, PNG, or WebP images. They are converted to optimized WebP with a smaller thumbnail for faster storefront loading.
              </div>
            )}
          </div>

          {submitError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {submitError}
            </div>
          )}

          <div className="flex gap-4 border-t border-gray-100 pt-6">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="flex-grow rounded-2xl py-4 font-bold text-gray-400 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex flex-grow items-center justify-center gap-2 rounded-2xl bg-mango-orange py-4 font-bold text-white shadow-xl shadow-mango-orange/20 transition-all hover:bg-mango-orange/90 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none">
              <Save size={20} /> {isSubmitting ? (editingProduct ? 'Updating...' : 'Creating...') : editingProduct ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
