import { supabase, authStateChange } from './lib/supabase.js';

let authChangeSubscription = null;

export async function signUp(email, password, username, fullName) {
  try {
    console.log('Attempting signup for:', email, username);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: fullName
        }
      }
    });

    if (error) {
      console.error('Signup error:', error);
      throw error;
    }
    
    console.log('Signup successful:', data);
    return data;
  } catch (error) {
    console.error('Signup exception:', error);
    throw error;
  }
}

export async function signIn(email, password) {
  try {
    console.log('Attempting signin for:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Signin error:', error);
      throw error;
    }

    console.log('Signin successful:', data.user?.email);

    if (data.user) {
      // Create session and update status
      await Promise.all([
        createSession(data.user.id),
        updateOnlineStatus(data.user.id, true),
        logActivity(data.user.id, 'login', { timestamp: new Date().toISOString() })
      ]);
    }

    return data;
  } catch (error) {
    console.error('Signin exception:', error);
    throw error;
  }
}

export async function signOut() {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await Promise.all([
        endSession(user.id),
        updateOnlineStatus(user.id, false),
        logActivity(user.id, 'logout', { timestamp: new Date().toISOString() })
      ]);
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    console.log('Signout successful');
  } catch (error) {
    console.error('Signout error:', error);
    throw error;
  }
}

export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Get user error:', error);
      throw error;
    }

    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Get profile error:', profileError);
      }

      return { ...user, profile };
    }

    return null;
  } catch (error) {
    console.error('Get current user exception:', error);
    throw error;
  }
}

export function onAuthStateChanged(callback) {
  if (authChangeSubscription) {
    authChangeSubscription.subscription.unsubscribe();
  }

  authChangeSubscription = authStateChange(callback);
  return authChangeSubscription;
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function createSession(userId) {
  try {
    const { error } = await supabase
      .from('user_sessions')
      .insert({
        user_id: userId,
        is_active: true
      });

    if (error) {
      console.error('Error creating session:', error);
    }
  } catch (error) {
    console.error('Create session exception:', error);
  }
}

async function endSession(userId) {
  try {
    const { error } = await supabase
      .from('user_sessions')
      .update({
        ended_at: new Date().toISOString(),
        is_active: false
      })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.error('Error ending session:', error);
    }
  } catch (error) {
    console.error('End session exception:', error);
  }
}

async function updateOnlineStatus(userId, isOnline) {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        is_online: isOnline,
        last_seen: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating online status:', error);
    }
  } catch (error) {
    console.error('Update online status exception:', error);
  }
}

async function logActivity(userId, activityType, activityData) {
  try {
    const { error } = await supabase
      .from('user_activities')
      .insert({
        user_id: userId,
        activity_type: activityType,
        activity_data: activityData
      });

    if (error) {
      console.error('Error logging activity:', error);
    }
  } catch (error) {
    console.error('Log activity exception:', error);
  }
}

export async function getOnlineUsers() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('is_online', true)
    .order('username');

  if (error) {
    console.error('Get online users error:', error);
    throw error;
  }
  return data || [];
}

export async function getAllUsers() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get all users error:', error);
    throw error;
  }
  return data || [];
}

export async function getUserActivities(limit = 10) {
  const { data, error } = await supabase
    .from('user_activities')
    .select(`
      *,
      user_profiles(username, full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Get user activities error:', error);
    throw error;
  }
  return data || [];
}

export async function getActiveSessions() {
  const { data, error } = await supabase
    .from('user_sessions')
    .select(`
      *,
      user_profiles(username, full_name, is_online)
    `)
    .eq('is_active', true)
    .order('started_at', { ascending: false });

  if (error) {
    console.error('Get active sessions error:', error);
    throw error;
  }
  return data || [];
}

export function subscribeToOnlineUsers(callback) {
  const channel = supabase
    .channel('online-users')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_profiles'
      },
      callback
    )
    .subscribe();

  return channel;
}