import { supabase, authStateChange } from './lib/supabase.js';

let authChangeSubscription = null;

export async function signUp(email, password, username, fullName) {
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

  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;

  if (data.user) {
    await createSession(data.user.id);
    await updateOnlineStatus(data.user.id, true);
    await logActivity(data.user.id, 'login', { timestamp: new Date().toISOString() });
  }

  return data;
}

export async function signOut() {
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    await endSession(user.id);
    await updateOnlineStatus(user.id, false);
    await logActivity(user.id, 'logout', { timestamp: new Date().toISOString() });
  }

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;

  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    return { ...user, profile };
  }

  return null;
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
  const { error } = await supabase
    .from('user_sessions')
    .insert({
      user_id: userId,
      is_active: true
    });

  if (error) console.error('Error creating session:', error);
}

async function endSession(userId) {
  const { error } = await supabase
    .from('user_sessions')
    .update({
      ended_at: new Date().toISOString(),
      is_active: false
    })
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) console.error('Error ending session:', error);
}

async function updateOnlineStatus(userId, isOnline) {
  const { error } = await supabase
    .from('user_profiles')
    .update({
      is_online: isOnline,
      last_seen: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) console.error('Error updating online status:', error);
}

async function logActivity(userId, activityType, activityData) {
  const { error } = await supabase
    .from('user_activities')
    .insert({
      user_id: userId,
      activity_type: activityType,
      activity_data: activityData
    });

  if (error) console.error('Error logging activity:', error);
}

export async function getOnlineUsers() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('is_online', true)
    .order('username');

  if (error) throw error;
  return data || [];
}

export async function getAllUsers() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
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

  if (error) throw error;
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

  if (error) throw error;
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
