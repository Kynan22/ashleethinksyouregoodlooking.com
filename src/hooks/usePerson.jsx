import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './useAuth';

const PersonContext = createContext(null);

export function PersonProvider({ children }) {
  const { user } = useAuth();
  const [person, setPerson] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState(null);

  useEffect(() => {
    if (!user) {
      setPerson(null);
      setProfile(null);
      setProfileError(null);
      return;
    }

    async function loadProfile() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Failed to load profile:', error);
        setProfileError('Could not load profile. Try refreshing.');
        return;
      }

      if (!data) {
        setProfileError('No profile found for this account. Ask Kynan to set one up in Supabase.');
        return;
      }

      setPerson(data.person);
      setProfile(data);
      setProfileError(null);
    }

    loadProfile();
  }, [user]);

  return (
    <PersonContext.Provider value={{ person, profile, profileError }}>
      {children}
    </PersonContext.Provider>
  );
}

export function usePerson() {
  const context = useContext(PersonContext);
  if (!context) throw new Error('usePerson must be used within PersonProvider');
  return context;
}
