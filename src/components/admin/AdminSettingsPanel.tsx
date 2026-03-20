import React from 'react';

type AdminSettingsPanelProps = {
  promoVideoUrl: string;
  promoDescription: string;
  savedMessage: string | null;
  onPromoVideoUrlChange: (value: string) => void;
  onPromoDescriptionChange: (value: string) => void;
  onReset: () => void;
  onSubmit: (event: React.FormEvent) => void;
};

export const AdminSettingsPanel: React.FC<AdminSettingsPanelProps> = ({
  promoVideoUrl,
  promoDescription,
  savedMessage,
  onPromoVideoUrlChange,
  onPromoDescriptionChange,
  onReset,
  onSubmit,
}) => {
  return (
    <section className="overflow-hidden rounded-[28px] border border-gray-200 bg-[#faf8f5] shadow-sm">
      <div className="border-b border-[#e8e2d8] px-6 py-4 sm:px-8">
        <h1 className="text-[2rem] font-black leading-none text-[#2b2621]">Settings</h1>
        <p className="mt-2 text-sm text-[#7a7065]">Manage the homepage promotion block</p>
      </div>

      <div className="space-y-7 px-4 py-6 sm:px-6 lg:px-8">
        <form id="admin-settings-form" onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="rounded-[24px] border border-[#e6ddd2] bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-[2rem] font-black leading-none text-[#201b16]">Homepage Video Promotion</h2>
              <p className="mt-2 text-base text-[#8a7c6d]">Add a video link and a short description. It will appear on the home page after the products section.</p>
              <div className="mt-7 grid grid-cols-1 gap-x-4 gap-y-5">
                <div className="min-w-0">
                  <label className="text-[15px] font-semibold text-[#201b16]">Video Link</label>
                  <input
                    value={promoVideoUrl}
                    onChange={(e) => onPromoVideoUrlChange(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... or https://example.com/promo.mp4"
                    className="mt-2 h-12 w-full rounded-2xl border border-[#ddd3c6] bg-white px-4 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-mango-orange/20"
                  />
                </div>
                <div className="min-w-0">
                  <label className="text-[15px] font-semibold text-[#201b16]">Short Description</label>
                  <textarea
                    value={promoDescription}
                    onChange={(e) => onPromoDescriptionChange(e.target.value)}
                    rows={4}
                    maxLength={220}
                    placeholder="Tell visitors what this video is about."
                    className="mt-2 w-full rounded-2xl border border-[#ddd3c6] bg-white px-4 py-3 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-mango-orange/20"
                  />
                  <p className="mt-2 text-xs font-medium text-[#8a7c6d]">{promoDescription.length}/220</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-start">
              {savedMessage && (
                <div className="rounded-full bg-green-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-green-600">
                  {savedMessage}
                </div>
              )}
              <button
                type="button"
                onClick={onReset}
                className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-500 transition hover:border-red-200 hover:text-red-500"
              >
                Reset Defaults
              </button>
              <button
                type="submit"
                className="rounded-2xl bg-mango-orange px-6 py-3 text-sm font-bold text-white shadow-xl shadow-mango-orange/20"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
};
