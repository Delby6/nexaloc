import React from "react";
import { useNavigate } from "react-router-dom";

export default function Join() {
  const navigate = useNavigate();

  const handleJoinClick = () => {
    navigate("/owner-signup"); // 🚀 Redirect to owner login
  };

  return (
    <div className="
        min-h-screen 
        flex flex-col items-center justify-center
        bg-slate-50 dark:bg-slate-950
        text-slate-800 dark:text-slate-200
        transition-colors">
      
      
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-sky-400 tracking-tight">
          Add Your Business to <span className="text-slate-800 dark:text-slate-200">Nexaloc</span>
        </h1>

        <p className="text-slate-300 mb-10 text-lg leading-relaxed">
          Empower your local community by listing your business on{" "}
          <span className="text-sky-400 font-semibold">Nexaloc</span>.  
          Showcase your services, reach new customers, and grow your local presence.
        </p>

        <button
          onClick={handleJoinClick}
          className="bg-sky-600 hover:bg-sky-700 text-white px-10 py-4 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-sky-600/40 transform hover:-translate-y-1 transition-all duration-200"
        >
          🚀 Add Your Business
        </button>

        <p className="text-slate-400 text-sm mt-6">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/owner-login")}
            className="text-sky-400 hover:text-sky-300 underline font-medium"
          >
            Log in here
          </button>
          .
        </p>
      </div>
    </div>
  );
}