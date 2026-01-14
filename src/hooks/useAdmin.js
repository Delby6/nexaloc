import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data, error } = await supabase.rpc('is_admin');

      if (error) {
        console.error('Admin check failed:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(data === true);
      }

      setLoading(false);
    };

    checkAdmin();
  }, []);

  return { isAdmin, loading };
}
