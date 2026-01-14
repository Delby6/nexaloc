import React from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Edit, Trash2, Upload, ImageOff, Save, XCircle } from "lucide-react";

export default function DashboardContent({
  businesses,
  fetching,
  startEdit,
  deleteBusiness,
  editing,
  editForm,
  setEditForm,
  handleSave,
  cancelEdit,
  handleImageSelection,
  handleImageDelete,
  chartDataCategory,
  chartDataLocal,
  colors,
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Business Dashboard</h2>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-8 mb-10">
        <div className="h-72 bg-white dark:bg-slate-900 dark:bg-slate-800 p-4 rounded-xl shadow">
          <h3 className="font-semibold mb-2">Businesses by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartDataCategory}>
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count">
                {chartDataCategory.map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="h-72 bg-white dark:bg-slate-900 dark:bg-slate-800 p-4 rounded-xl shadow">
          <h3 className="font-semibold mb-2">Businesses by Village</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartDataLocal}
                dataKey="count"
                nameKey="village"
                outerRadius={100}
                label
              >
                {chartDataLocal.map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Business Table */}
      {fetching ? (
        <p>Loading businesses...</p>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-slate-900 dark:bg-slate-800 p-4 rounded-xl shadow">
          <table className="w-full">
            <thead>
              <tr
                className="
                  bg-slate-50 dark:bg-slate-800
                  text-slate-900 dark:text-slate-100
                  border-b border-slate-200 dark:border-slate-700
                  hover:bg-slate-100 dark:hover:bg-slate-700
                  transition-colors
                "
              >
                <th className="p-3">Name</th>
                <th className="p-3">Village</th>
                <th className="p-3">Category</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Image</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {businesses.map((biz) => (
                <tr key={biz.id} className="border-t">
                  <td className="p-3">
                    {editing === biz.id ? (
                      <input
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        className="border rounded p-1"
                      />
                    ) : (
                      biz.name
                    )}
                  </td>

                  <td className="p-3">
                    {editing === biz.id ? (
                      <input
                        value={editForm.village}
                        onChange={(e) =>
                          setEditForm({ ...editForm, village: e.target.value })
                        }
                        className="border rounded p-1"
                      />
                    ) : (
                      biz.village
                    )}
                  </td>

                  <td className="p-3">{biz.category}</td>

                  <td className="p-3">{biz.contact}</td>

                  <td className="p-3">
                    {biz.image_url ? (
                      <img
                        src={biz.image_url}
                        className="h-12 w-12 rounded object-cover"
                      />
                    ) : (
                      <ImageOff className="text-slate-500" />
                    )}
                  </td>

                  <td className="p-3 flex gap-2">
                    {editing === biz.id ? (
                      <>
                        <button
                          onClick={() => handleSave(biz)}
                          className="p-2 bg-green-500 text-white rounded"
                        >
                          <Save />
                        </button>

                        <button
                          onClick={cancelEdit}
                          className="p-2 bg-red-500 text-white rounded"
                        >
                          <XCircle />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(biz)}
                          className="p-2 bg-blue-500 text-white rounded"
                        >
                          <Edit />
                        </button>

                        <button
                          onClick={() => deleteBusiness(biz.id)}
                          className="p-2 bg-red-500 text-white rounded"
                        >
                          <Trash2 />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
