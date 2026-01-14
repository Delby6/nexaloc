// -------------------------------------------------------------
// Edit Business (Separate B2B Page)
// -------------------------------------------------------------
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

const emptyForm = {
  name: "",
  village: "",
  category: "",
  description: "",
  contact: "",
  website: "",
  phone: "",
  hours: "",
  address: "",
  image_url: "",
  imageFile: null,
};

export default function OwnerBusinessEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // -----------------------------------------------------------
  // Load user + business
  // -----------------------------------------------------------
  useEffect(() => {
    async function load() {
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError || !authData.user) {
        toast.error("Please log in");
        navigate("/owner-login");
        return;
      }

      setUser(authData.user);

      const { data: biz, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !biz) {
        toast.error("Business not found");
        navigate("/owner-dashboard");
        return;
      }

      // Basic ownership check (optional, RLS should already enforce)
      if (biz.owner_id && biz.owner_id !== authData.user.id) {
        toast.error("You don't have access to this business");
        navigate("/owner-dashboard");
        return;
      }

      setForm({
        name: biz.name,
        village: biz.village,
        category: biz.category,
        description: biz.description || "",
        contact: biz.contact,
        website: biz.website || "",
        phone: biz.phone || "",
        hours: biz.hours || "",
        address: biz.address || "",
        image_url: biz.image_url || "",
        imageFile: null,
      });

      setLoading(false);
    }

    load();
  }, [id, navigate]);

  // -----------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------
  function handleChange(e) {
    const { name, value, files } = e.target;
    if (name === "imageFile") {
      setForm((prev) => ({ ...prev, imageFile: files?.[0] || null }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  }

  async function uploadImage(file) {
  if (!file || !user) return null;

  const ext = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const filePath = `${user.id}/${fileName}`;

  // 1. Upload to bucket
  const { error: uploadError } = await supabase.storage
    .from("business-images")
    .upload(filePath, file);

  if (uploadError) {
    toast.error("Image upload failed");
    return null;
  }

  // 2. Get permanent PUBLIC URL
  const { data: publicUrlData } = supabase.storage
    .from("business-images")
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}


  async function handleSubmit(e) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);

    let imageUrl = form.image_url || null;
    if (form.imageFile) {
      const uploaded = await uploadImage(form.imageFile);
      if (uploaded) imageUrl = uploaded;
    }

    const record = {
      name: form.name,
      village: form.village,
      category: form.category,
      description: form.description || null,
      contact: form.contact,
      website: form.website || null,
      phone: form.phone || null,
      hours: form.hours || null,
      address: form.address || null,
      image_url: imageUrl,
    };

    const { error } = await supabase
      .from("businesses")
      .update(record)
      .eq("id", id);

    setSaving(false);

    if (error) {
      toast.error(`Failed to update business: ${error.message}`);
      return;
    }

    toast.success("Business updated!");
    navigate("/owner-dashboard");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        Loading business…
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Edit Business</h1>
          <button
            onClick={() => navigate("/owner-dashboard")}
            className="
              px-4 py-2 rounded-md text-sm
              bg-slate-200 hover:bg-slate-300
              dark:bg-slate-700 dark:hover:bg-slate-600
              text-slate-900 dark:text-white
              transition-colors
            "
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="
                      bg-white dark:bg-slate-800
                      border border-slate-200 dark:border-slate-700
                      rounded-xl p-6 space-y-4"
          >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Business Name *"
              className="
                          p-3 rounded text-sm
                          bg-slate-100 dark:bg-slate-700
                          text-slate-900 dark:text-slate-100
                          placeholder:text-slate-400
                        "
              required
            />
            <input
              name="village"
              value={form.village}
              onChange={handleChange}
              placeholder="Village / City *"
              className="
                          p-3 rounded text-sm
                          bg-slate-100 dark:bg-slate-700
                          text-slate-900 dark:text-slate-100
                          placeholder:text-slate-400
                        "
              required
            />
            <input
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="Category *"
              className="
                          p-3 rounded text-sm
                          bg-slate-100 dark:bg-slate-700
                          text-slate-900 dark:text-slate-100
                          placeholder:text-slate-400
                        "
              required
            />
            <input
              name="contact"
              value={form.contact}
              onChange={handleChange}
              placeholder="Contact Email *"
              className="
                          p-3 rounded text-sm
                          bg-slate-100 dark:bg-slate-700
                          text-slate-900 dark:text-slate-100
                          placeholder:text-slate-400
                        "
              required
            />
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Phone Number"
              className="
                          p-3 rounded text-sm
                          bg-slate-100 dark:bg-slate-700
                          text-slate-900 dark:text-slate-100
                          placeholder:text-slate-400
                        "
            />
            <input
              name="website"
              value={form.website}
              onChange={handleChange}
              placeholder="Website URL"
              className="
                          p-3 rounded text-sm
                          bg-slate-100 dark:bg-slate-700
                          text-slate-900 dark:text-slate-100
                          placeholder:text-slate-400
                        "
              />
          </div>

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Business Description"
            className="
              w-full p-3 rounded text-sm
              bg-slate-100 dark:bg-slate-700
              text-slate-900 dark:text-slate-100
              placeholder:text-slate-400
              border border-slate-200 dark:border-slate-600
              focus:outline-none focus:ring-2 focus:ring-sky-500
            "
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Address (Street, Number, etc.)"
            className="
                          p-3 rounded text-sm
                          bg-slate-100 dark:bg-slate-700
                          text-slate-900 dark:text-slate-100
                          placeholder:text-slate-400
                        "
          />

          <input
            name="hours"
            value={form.hours}
            onChange={handleChange}
            placeholder="Opening Hours (e.g. Mon–Fri: 9:00–17:00)"
            className="
                          p-3 rounded text-sm
                          bg-slate-100 dark:bg-slate-700
                          text-slate-900 dark:text-slate-100
                          placeholder:text-slate-400
                        "
          />
          </div>

          <div>
            <label className="block text-sm mb-1">Business Image</label>
            <input
              type="file"
              name="imageFile"
              accept="image/*"
              onChange={handleChange}
              className="
                w-full p-2 rounded text-xs
                bg-slate-100 dark:bg-slate-700
                text-slate-900 dark:text-slate-100
                border border-slate-200 dark:border-slate-600
                file:mr-3 file:px-3 file:py-1
                file:rounded file:border-0
                file:bg-slate-300 dark:file:bg-slate-600
                file:text-slate-900 dark:file:text-white
                file:cursor-pointer
              "
            />

            {form.image_url && (
              <img
                src={form.image_url}
                alt="Current"
                className="mt-3 w-32 h-32 rounded object-cover border border-slate-700"
              />
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="
              w-full py-3 rounded-lg text-sm font-medium
              bg-sky-600 hover:bg-sky-700
              disabled:opacity-50 disabled:cursor-not-allowed
              text-white transition-colors
            "
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
