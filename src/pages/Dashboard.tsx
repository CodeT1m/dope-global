import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import SuperadminDashboard from "@/components/dashboard/SuperadminDashboard";
import PhotographerDashboard from "@/components/dashboard/PhotographerDashboard";
import UserDashboard from "@/components/dashboard/UserDashboard";
import { FaceMatchingProvider } from "@/context/FaceMatchingContext";

type UserRole = 'superadmin' | 'admin' | 'user' | null;

const Dashboard = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (event === 'SIGNED_OUT') {
          setLoading(false);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading && !user) return;

    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchUserRole = async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        // Check for superadmin first, then admin, then default to user
        if (data?.role === 'superadmin') {
          setUserRole('superadmin');
        } else if (data?.role === 'admin') {
          setUserRole('admin');
        } else {
          setUserRole('user');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole('user'); // Default to user role on error
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user, navigate, loading]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (userRole === 'admin') {
    return (
      <FaceMatchingProvider>
        <PhotographerDashboard user={user} />
      </FaceMatchingProvider>
    );
  }

  return (
    <FaceMatchingProvider>
      <UserDashboard user={user} />
    </FaceMatchingProvider>
  );
};

export default Dashboard;
