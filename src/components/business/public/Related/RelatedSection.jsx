// src/components/business/public/Related/RelatedSection.jsx
import { motion, AnimatePresence } from "framer-motion";
import { Star, Sparkles, ImageOff } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function RelatedSection({
  related,
  relatedLoading,
  relatedReason,
  navigate,
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      viewport={{ once: true }}
      className="mt-12 border-t border-slate-200 dark:border-slate-700 pt-6"
    >
      <h3 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white flex items-center gap-2">
        <Star className="text-yellow-500" /> Related Businesses
      </h3>

      <AnimatePresence>
        {relatedReason && (
          <motion.p
            key={relatedReason}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm mb-6"
          >
            <Sparkles className="w-4 h-4 text-yellow-400" /> {relatedReason}
          </motion.p>
        )}
      </AnimatePresence>

      {relatedLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 h-48 border border-slate-200 dark:border-slate-700"
            >
              <div className="w-full h-24 bg-slate-200 dark:bg-slate-700 rounded-lg mb-3"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : related.length > 0 ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {related.map((rel) => (
            <motion.div
              key={rel.id}
              variants={cardVariants}
              onClick={() => navigate(`/business/${rel.id}`)}
              whileHover={{ scale: 1.03 }}
              className="bg-white dark:bg-slate-900 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-lg p-4 cursor-pointer transition-all"
            >
              {rel.image_url ? (
                <img
                  src={rel.image_url}
                  alt={rel.name}
                  className="w-full h-32 object-cover rounded-lg mb-3"
                />
              ) : (
                <div className="w-full h-32 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-lg mb-3">
                  <ImageOff className="w-6 h-6 text-slate-400" />
                </div>
              )}
              <h4 className="font-semibold text-slate-800 dark:text-white">
                {rel.name}
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {rel.village} • {rel.category}
              </p>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <p className="text-slate-500 dark:text-slate-400">
          No related businesses found.
        </p>
      )}
    </motion.section>
  );
}
