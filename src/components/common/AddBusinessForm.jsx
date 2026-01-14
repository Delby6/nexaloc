import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function AddBusinessForm({
  setBusinesses,
  mode = "add",          // "add" | "edit"
  initialData = null,    // business object when editing
  onClose,               // optional: called when edit is done / cancelled
  onSaved,               // optional: called with saved business row
}) {
  const [formData, setFormData] = useState({
    id: initialData?.id || null,
    name: initialData?.name || "",
    village: initialData?.village || "",
    address: initialData?.address || "",
    category: initialData?.category || "",
    description: initialData?.description || "",
    contact: initialData?.contact || "",
    website: initialData?.website || "",
    phone: initialData?.phone || "",
    hours: initialData?.hours || "",
    image: null, // File object (new upload)
    existingImageUrl: initialData?.image_url || "",
    image_path: initialData?.image_path || null,
  });

  const [preview, setPreview] = useState(initialData?.image_url || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // 🔁 Sync form when initialData changes (for edit mode)
  useEffect(() => {
    if (mode === "edit" && initialData) {
      setFormData((prev) => ({
        ...prev,
        id: initialData.id,
        name: initialData.name || "",
        village: initialData.village || "",
        address: initialData.address || "",
        category: initialData.category || "",
        description: initialData.description || "",
        contact: initialData.contact || "",
        website: initialData.website || "",
        phone: initialData.phone || "",
        hours: initialData.hours || "",
        image: null,
        existingImageUrl: initialData.image_url || "",
        image_path: initialData.image_path || null,
      }));
      setPreview(initialData.image_url || null);
    }

    if (mode === "add" && !initialData) {
      // no-op; initial state already matches "add"
    }
  }, [mode, initialData]);

  // ✅ Handle input change
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      setFormData((prev) => ({ ...prev, image: file }));
      setPreview(URL.createObjectURL(file));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ✅ Handle form submit (Add + Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Get current logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        toast.error("You must log in as an owner.");
        navigate("/owner-login");
        setLoading(false);
        return;
      }

      let imageUrl = formData.existingImageUrl || null;
      let imagePath = formData.image_path || null;

      // --- Upload image if provided (new file) ---
      if (formData.image) {
        const cleanName = formData.image.name.replace(/\s+/g, "-");
        const fileName = `${Date.now()}-${cleanName}`;
        const filePath = `uploads/${fileName}`;

        // 1) upload file to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("business-images")
          .upload(filePath, formData.image);

        if (uploadError) throw uploadError;

        // 2) Get public URL + remember path (PERMANENT, no JWT)
        const { data: publicData } = supabase.storage
          .from("business-images")
          .getPublicUrl(filePath);

        imageUrl = publicData.publicUrl;
        imagePath = filePath;
      }

      let dbResult;

      if (mode === "edit" && formData.id) {
        // --- UPDATE existing business ---
        const { data, error } = await supabase
          .from("businesses")
          .update({
            name: formData.name,
            village: formData.village,
            address: formData.address,
            category: formData.category,
            description: formData.description,
            contact: formData.contact,
            website: formData.website,
            phone: formData.phone,
            hours: formData.hours,
            image_url: imageUrl,
            image_path: imagePath,
            owner_id: user.id,
          })
          .eq("id", formData.id)
          .eq("owner_id", user.id)
          .select()
          .single();

        if (error) throw error;
        dbResult = data;

        // Update UI list if provided
        if (setBusinesses && dbResult) {
          setBusinesses((prev) =>
            prev.map((b) => (b.id === dbResult.id ? dbResult : b))
          );
        }

        toast.success("✅ Business updated successfully!");
      } else {
        // --- INSERT new business ---
        const { data, error } = await supabase
          .from("businesses")
          .insert([
            {
              name: formData.name,
              village: formData.village,
              address: formData.address,
              category: formData.category,
              description: formData.description,
              contact: formData.contact,
              website: formData.website,
              phone: formData.phone,
              hours: formData.hours,
              image_url: imageUrl,
              image_path: imagePath,
              owner_id: user.id, // link business to logged-in user
            },
          ])
          .select()
          .single();

        if (error) throw error;
        dbResult = data;

        if (setBusinesses && dbResult) {
          setBusinesses((prev) => [dbResult, ...prev]);
        }

        toast.success("✅ Business added successfully!");
      }

      // Notify parent if needed
      if (onSaved && dbResult) {
        onSaved(dbResult);
      }

      // Reset form ONLY in add mode
      if (mode === "add") {
        setFormData({
          id: null,
          name: "",
          village: "",
          address: "",
          category: "",
          description: "",
          contact: "",
          website: "",
          phone: "",
          hours: "",
          image: null,
          existingImageUrl: "",
          image_path: null,
        });
        setPreview(null);
      }

      // Close modal in edit mode, if requested
      if (mode === "edit" && onClose) {
        onClose();
      }
    } catch (err) {
      console.error("Error saving business:", err.message);
      setError("Failed to save business. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="
      space-y-4 max-w-2xl mx-auto
      text-slate-700 dark:text-slate-200
      bg-white dark:bg-slate-900
      border border-slate-200 dark:border-slate-800
      rounded-xl p-6 shadow-sm dark:shadow-lg
      transition-colors
    "
  >
      <input
        type="text"
        name="name"
        placeholder="Business name"
        value={formData.name}
        onChange={handleChange}
        required
        className="
                    w-full px-3 py-2 rounded-lg text-sm
                    bg-white border border-slate-300 text-slate-800
                    dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100
                    placeholder:text-slate-400 dark:placeholder:text-slate-500
                    focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500
                    transition-colors
                  "
      />
      <input
        type="text"
        name="village"
        placeholder="Village name"
        value={formData.village}
        onChange={handleChange}
        required
        className="
                    w-full px-3 py-2 rounded-lg text-sm
                    bg-white border border-slate-300 text-slate-800
                    dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100
                    placeholder:text-slate-400 dark:placeholder:text-slate-500
                    focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500
                    transition-colors
                  "
      />
      <input
        type="text"
        name="address"
        placeholder="Exact address (Street, Number)"
        value={formData.address}
        onChange={handleChange}
        className="
                    w-full px-3 py-2 rounded-lg text-sm
                    bg-white border border-slate-300 text-slate-800
                    dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100
                    placeholder:text-slate-400 dark:placeholder:text-slate-500
                    focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500
                    transition-colors
                  "
      />
      <input
        type="text"
        name="category"
        placeholder="Category (e.g. Food, Services)"
        value={formData.category}
        onChange={handleChange}
        required
        className="
                    w-full px-3 py-2 rounded-lg text-sm
                    bg-white border border-slate-300 text-slate-800
                    dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100
                    placeholder:text-slate-400 dark:placeholder:text-slate-500
                    focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500
                    transition-colors
                  "
      />
      <textarea
        name="description"
        placeholder="Description"
        value={formData.description}
        onChange={handleChange}
        className="input"
        required
      />
      <input
        type="email"
        name="contact"
        placeholder="Contact email"
        value={formData.contact}
        onChange={handleChange}
        required
        className="
                    w-full px-3 py-2 rounded-lg text-sm
                    bg-white border border-slate-300 text-slate-800
                    dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100
                    placeholder:text-slate-400 dark:placeholder:text-slate-500
                    focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500
                    transition-colors
                  "
      />
      <input
        type="url"
        name="website"
        placeholder="Website (optional)"
        value={formData.website}
        onChange={handleChange}
        className="
                    w-full px-3 py-2 rounded-lg text-sm
                    bg-white border border-slate-300 text-slate-800
                    dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100
                    placeholder:text-slate-400 dark:placeholder:text-slate-500
                    focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500
                    transition-colors
                  "
      />
      <input
        type="tel"
        name="phone"
        placeholder="Phone (optional)"
        value={formData.phone}
        onChange={handleChange}
        className="
                    w-full px-3 py-2 rounded-lg text-sm
                    bg-white border border-slate-300 text-slate-800
                    dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100
                    placeholder:text-slate-400 dark:placeholder:text-slate-500
                    focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500
                    transition-colors
                  "
      />
      <input
        type="text"
        name="hours"
        placeholder="Operating hours (e.g. Mon–Fri 9:00–17:00)"
        value={formData.hours}
        onChange={handleChange}
        className="
                    w-full px-3 py-2 rounded-lg text-sm
                    bg-white border border-slate-300 text-slate-800
                    dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100
                    placeholder:text-slate-400 dark:placeholder:text-slate-500
                    focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500
                    transition-colors
                  "
      />

      {/* --- Image upload with preview --- */}
      <div>
        <label className="block font-medium mb-1">
          Business Image (optional)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="
                      w-full text-sm
                      bg-white border border-slate-300 rounded-lg p-2
                      dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100
                      file:bg-slate-100 file:dark:bg-slate-700
                      file:border-0 file:px-3 file:py-1.5 file:rounded-lg
                      file:text-sm file:font-medium file:text-slate-700 file:dark:text-slate-200
                    "
        />
        {preview && (
          <div className="mt-3">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Image preview</p>
            <img
              src={preview}
              alt="Preview"
              className="
                  w-48 h-32 object-cover rounded-lg
                  border border-slate-300 dark:border-slate-700
                  shadow-sm dark:shadow-md
                "
            />
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="
                  px-5 py-2.5 rounded-lg text-sm font-medium
                  bg-sky-600 hover:bg-sky-700 text-white
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition
                "
      >
        {loading
          ? mode === "edit"
            ? "Saving..."
            : "Adding..."
          : mode === "edit"
          ? "Save Changes"
          : "Add Business"}
      </button>
    </form>
  );
}
