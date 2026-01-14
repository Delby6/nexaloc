import { supabase } from "@/lib/supabaseClient";

export default function PromoteOperator() {
  const run = async () => {
    const { data, error } = await supabase.auth.updateUser({
      data: { role: "operator" },
    });

    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("User promoted to operator!");
    }
  };

  return (
    <div className="p-10 text-white">
      <h1 className="text-2xl mb-4">Promote current user to Operator</h1>
      <button
        onClick={run}
        className="bg-blue-600 px-4 py-2 rounded"
      >
        Run
      </button>
    </div>
  );
}
