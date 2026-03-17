import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Staff = Tables<'staff'>;

interface RoleContextType {
  currentStaff: Staff | null;
  allStaff: Staff[];
  setCurrentStaff: (staff: Staff) => void;
}

const RoleContext = createContext<RoleContextType>({
  currentStaff: null,
  allStaff: [],
  setCurrentStaff: () => {},
});

export const useRole = () => useContext(RoleContext);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);

  useEffect(() => {
    const fetchStaff = async () => {
      const { data } = await supabase.from('staff').select('*').order('name');
      if (data) {
        setAllStaff(data);
        if (!currentStaff && data.length > 0) {
          setCurrentStaff(data[0]);
        }
      }
    };
    fetchStaff();
  }, []);

  return (
    <RoleContext.Provider value={{ currentStaff, allStaff, setCurrentStaff }}>
      {children}
    </RoleContext.Provider>
  );
};
