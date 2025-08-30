import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchWithRetry } from '@/lib/api';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const AnnouncementBar = () => {
  const { appTenantId, tenantIdLoaded } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = useCallback(async () => {
    if (!tenantIdLoaded) return;
    setLoading(true);

    const tenantIdToQuery = appTenantId ?? 0;

    let query = supabase
      .from('page_content')
      .select('content')
      .eq('page', 'home')
      .eq('section', 'announcements')
      .eq('is_active', true)
      .eq('tenant_id', tenantIdToQuery)
      .order('position', { ascending: true });

    const { data, error } = await fetchWithRetry(() => query);

    if (error) {
      console.error('Error fetching announcements:', error);
    } else {
      setAnnouncements(data.map(item => ({ text: item.content.text })));
    }
    setLoading(false);
  }, [appTenantId, tenantIdLoaded]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const marqueeVariants = {
    animate: {
      x: ['0%', '-100%'],
      transition: {
        x: {
          repeat: Infinity,
          repeatType: 'loop',
          duration: 25,
          ease: 'linear',
        },
      },
    },
  };

  if (loading) {
    return <Skeleton className="h-8 w-full rounded-lg" />;
  }
  
  if (announcements.length === 0) {
    return null;
  }

  return (
    <div className="relative flex items-center h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg overflow-hidden shadow-md">
      <div className="flex-shrink-0 px-2 flex items-center justify-center bg-indigo-700 h-full">
        <Volume2 className="w-4 h-4 text-white" />
      </div>
      <div className="flex-grow overflow-hidden">
        <motion.div
          className="flex whitespace-nowrap"
          variants={marqueeVariants}
          animate="animate"
        >
          {announcements.map((item, index) => (
            <span key={index} className="text-white text-xs font-medium px-8">{item.text}</span>
          ))}
          {announcements.map((item, index) => (
            <span key={`duplicate-${index}`} className="text-white text-xs font-medium px-8">{item.text}</span>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default AnnouncementBar;