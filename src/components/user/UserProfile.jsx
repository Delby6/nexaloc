// src/components/user/UserProfile.jsx
import { useRef } from "react";

export default function UserProfile({
  profile,
  form,
  setForm,
  editing,
  setEditing,
  saving,
  onSave,
  onAvatarFileSelect,
}) {
  const fileInputRef = useRef(null);

  function triggerFilePicker() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file && onAvatarFileSelect) onAvatarFileSelect(file);
  }

  return (
    <section
      className="
        rounded-xl p-6 mb-10
        bg-white border border-slate-200 shadow-sm
        dark:bg-slate-900 dark:border-slate-800 dark:shadow-lg
        transition-colors
      "
    >
      <div className="flex flex-col md:flex-row md:items-start gap-8">

        {/* ---------------------- */}
        {/* AVATAR SECTION         */}
        {/* ---------------------- */}
        <div className="flex flex-col items-center gap-3">
          <div
            onClick={() => editing && triggerFilePicker()}
            className={`
              relative w-28 h-28 rounded-full overflow-hidden
              border border-slate-300 dark:border-slate-700
              shadow-sm cursor-pointer group
              ${editing ? "ring-2 ring-sky-500/70" : ""}
            `}
          >
            <img
              src={
                form.avatar_url ||
                "https://placehold.co/200x200?text=Avatar"
              }
              alt="Avatar"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />

            {editing && (
              <div
                className="
                absolute inset-0 bg-black/40
                flex items-center justify-center
                text-xs text-white opacity-0
                group-hover:opacity-100 transition
              "
              >
                Change Photo
              </div>
            )}
          </div>

          {editing && (
            <>
              <button
                type="button"
                onClick={triggerFilePicker}
                className="
                  px-3 py-1.5 text-xs rounded-md
                  bg-slate-200 text-slate-800
                  dark:bg-slate-700 dark:text-slate-200
                  hover:bg-slate-300 dark:hover:bg-slate-600
                  transition
                "
              >
                Upload new photo
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </>
          )}
        </div>

        {/* ---------------------- */}
        {/* USER INFO (VIEW/EDIT) */}
        {/* ---------------------- */}
        <div className="flex-1 space-y-3">

          {!editing ? (
            <>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {profile.full_name}
              </h2>

              <p className="text-slate-600 dark:text-slate-400">
                {profile.email}
              </p>

              {profile.city && (
                <p className="text-slate-600 dark:text-slate-400">
                  City: {profile.city}
                </p>
              )}

              {profile.bio && (
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                  {profile.bio}
                </p>
              )}
            </>
          ) : (
            <div className="space-y-4">

              {/* FULL NAME */}
              <input
                value={form.full_name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, full_name: e.target.value }))
                }
                placeholder="Full Name"
                className="
                  w-full px-3 py-2 rounded-lg text-sm
                  bg-white border border-slate-300 text-slate-800
                  dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100
                  placeholder:text-slate-400 dark:placeholder:text-slate-500
                  focus:outline-none focus:ring-2 focus:ring-sky-500
                  transition
                "
              />

              {/* EMAIL */}
              <input
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
                placeholder="Email"
                className="
                  w-full px-3 py-2 rounded-lg text-sm
                  bg-white border border-slate-300 text-slate-800
                  dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100
                  placeholder:text-slate-400 dark:placeholder:text-slate-500
                  focus:outline-none focus:ring-2 focus:ring-sky-500
                  transition
                "
              />

              {/* PHONE */}
              <input
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="Phone"
                className="
                  w-full px-3 py-2 rounded-lg text-sm
                  bg-white border border-slate-300 text-slate-800
                  dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100
                  placeholder:text-slate-400 dark:placeholder:text-slate-500
                  focus:outline-none focus:ring-2 focus:ring-sky-500
                  transition
                "
              />

              {/* CITY */}
              <input
                value={form.city}
                onChange={(e) =>
                  setForm((p) => ({ ...p, city: e.target.value }))
                }
                placeholder="City"
                className="
                  w-full px-3 py-2 rounded-lg text-sm
                  bg-white border border-slate-300 text-slate-800
                  dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100
                  placeholder:text-slate-400 dark:placeholder:text-slate-500
                  focus:outline-none focus:ring-2 focus:ring-sky-500
                  transition
                "
              />

              {/* BIO */}
              <textarea
                value={form.bio}
                onChange={(e) =>
                  setForm((p) => ({ ...p, bio: e.target.value }))
                }
                placeholder="Bio"
                className="
                  w-full px-3 py-2 rounded-lg text-sm h-28
                  bg-white border border-slate-300 text-slate-800
                  dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100
                  placeholder:text-slate-400 dark:placeholder:text-slate-500
                  focus:outline-none focus:ring-2 focus:ring-sky-500
                  transition resize-none
                "
              />
            </div>
          )}
        </div>

        {/* ---------------------- */}
        {/* EDIT / SAVE BUTTON     */}
        {/* ---------------------- */}
        <div className="flex items-start">
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="
                px-5 py-2.5 rounded-lg text-sm font-medium
                bg-sky-600 hover:bg-sky-700 text-white
                transition
              "
            >
              Edit
            </button>
          ) : (
            <button
              onClick={onSave}
              disabled={saving}
              className="
                px-5 py-2.5 rounded-lg text-sm font-medium
                bg-green-600 hover:bg-green-700 text-white
                disabled:opacity-50 disabled:cursor-not-allowed
                transition
              "
            >
              {saving ? "Saving..." : "Save"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
