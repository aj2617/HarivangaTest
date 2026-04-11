import React from 'react';

export type PromoStoryInput = {
  id: string;
  title: string;
  videoUrl: string;
  description: string;
};

type AdminSettingsPanelProps = {
  promoStories: PromoStoryInput[];
  savedMessage: string | null;
  onPromoStoryChange: (id: string, field: 'title' | 'videoUrl' | 'description', value: string) => void;
  onAddPromoStory: () => void;
  onRemovePromoStory: (id: string) => void;
  onReset: () => void;
  onSubmit: (event: React.FormEvent) => void;
};

export const AdminSettingsPanel: React.FC<AdminSettingsPanelProps> = ({
  promoStories,
  savedMessage,
  onPromoStoryChange,
  onAddPromoStory,
  onRemovePromoStory,
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
            <div className="rounded-[24px] border border-[#e6ddd2] bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-[1.65rem] font-black leading-none text-[#201b16]">Homepage Video Promotion</h2>
              <p className="mt-2 text-sm text-[#8a7c6d]">Only video links are needed now. Add or remove links for the Stories to Watch section.</p>
              <div className="mt-6 space-y-4">
                {promoStories.map((story, index) => (
                  <div key={story.id} className="rounded-[18px] border border-[#eee4d7] bg-[#fcfaf7] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-sm font-bold text-[#201b16]">Video Link {index + 1}</label>
                      {promoStories.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onRemovePromoStory(story.id)}
                          className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-red-500 transition hover:bg-red-50"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <input
                      value={story.videoUrl}
                      onChange={(e) => onPromoStoryChange(story.id, 'videoUrl', e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=... or https://example.com/promo.mp4"
                      className="mt-3 h-12 w-full rounded-2xl border border-[#ddd3c6] bg-white px-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-mango-orange/20"
                    />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={onAddPromoStory}
                  className="rounded-2xl border border-[#ddd3c6] bg-white px-5 py-3 text-sm font-bold text-[#201b16] transition hover:border-mango-orange hover:text-mango-orange"
                >
                  Add Another Video
                </button>
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
