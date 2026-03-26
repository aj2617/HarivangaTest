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
            <div className="rounded-[24px] border border-[#e6ddd2] bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-[2rem] font-black leading-none text-[#201b16]">Homepage Video Promotion</h2>
              <p className="mt-2 text-base text-[#8a7c6d]">Add one or more story videos. Each story has its own title, video link, and short description for the home page section.</p>
              <div className="mt-7 space-y-5">
                {promoStories.map((story, index) => (
                  <div key={story.id} className="rounded-[24px] border border-[#e6ddd2] bg-[#fcfaf7] p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-black text-[#201b16]">Story {index + 1}</h3>
                        <p className="text-sm text-[#8a7c6d]">This title will show above the video card on the home page.</p>
                      </div>
                      {promoStories.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onRemovePromoStory(story.id)}
                          className="rounded-2xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-500 transition hover:bg-red-50"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-x-4 gap-y-5">
                      <div className="min-w-0">
                        <label className="text-[15px] font-semibold text-[#201b16]">Title</label>
                        <input
                          value={story.title}
                          onChange={(e) => onPromoStoryChange(story.id, 'title', e.target.value)}
                          maxLength={80}
                          placeholder="Live Garden Collection"
                          className="mt-2 h-12 w-full rounded-2xl border border-[#ddd3c6] bg-white px-4 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-mango-orange/20"
                        />
                        <p className="mt-2 text-xs font-medium text-[#8a7c6d]">{story.title.length}/80</p>
                      </div>
                      <div className="min-w-0">
                        <label className="text-[15px] font-semibold text-[#201b16]">Video Link</label>
                        <input
                          value={story.videoUrl}
                          onChange={(e) => onPromoStoryChange(story.id, 'videoUrl', e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=... or https://example.com/promo.mp4"
                          className="mt-2 h-12 w-full rounded-2xl border border-[#ddd3c6] bg-white px-4 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-mango-orange/20"
                        />
                      </div>
                      <div className="min-w-0">
                        <label className="text-[15px] font-semibold text-[#201b16]">Short Description</label>
                        <textarea
                          value={story.description}
                          onChange={(e) => onPromoStoryChange(story.id, 'description', e.target.value)}
                          rows={4}
                          maxLength={220}
                          placeholder="Tell visitors what this video is about."
                          className="mt-2 w-full rounded-2xl border border-[#ddd3c6] bg-white px-4 py-3 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-mango-orange/20"
                        />
                        <p className="mt-2 text-xs font-medium text-[#8a7c6d]">{story.description.length}/220</p>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={onAddPromoStory}
                  className="rounded-2xl border border-[#ddd3c6] bg-white px-5 py-3 text-sm font-bold text-[#201b16] transition hover:border-mango-orange hover:text-mango-orange"
                >
                  Add Another Story
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
