import { supabase } from './supabaseClient';

// ============================================
// JOBSTATUS — Supabase PostgreSQL Data Layer
// ============================================

// ---- Fetch Jobs & Rounds ----
export const getUserJobs = async (userId) => {
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      *,
      rounds (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching jobs:", error);
    throw error;
  }

  // Ensure rounds inside each job are sorted by sort_order
  return (data || []).map(job => ({
    ...job,
    rounds: (job.rounds || []).sort((a, b) => a.sort_order - b.sort_order)
  }));
};

// ---- Create Job ----
export const createJob = async ({ userId, company, role }) => {
  // 1. Insert Job application
  const { data: job, error: jobErr } = await supabase
    .from('jobs')
    .insert([{ user_id: userId, company, role, status: 'active' }])
    .select()
    .single();

  if (jobErr) {
    console.error("Error creating job:", jobErr);
    throw jobErr;
  }

  // 2. Insert Default Rounds (Round 1, Round 2, Client Round)
  const defaultRounds = [
    { job_id: job.id, name: 'Round 1', status: 'pending', sort_order: 1 },
    { job_id: job.id, name: 'Round 2', status: 'pending', sort_order: 2 },
    { job_id: job.id, name: 'Client Round', status: 'pending', sort_order: 3 },
  ];

  const { data: createdRounds, error: roundsErr } = await supabase
    .from('rounds')
    .insert(defaultRounds)
    .select();

  if (roundsErr) {
    console.error("Error creating default rounds:", roundsErr);
    throw roundsErr;
  }

  return {
    ...job,
    rounds: (createdRounds || []).sort((a, b) => a.sort_order - b.sort_order)
  };
};

// ---- Update Job ----
export const updateJob = async (jobId, updates) => {
  const { data, error } = await supabase
    .from('jobs')
    .update(updates)
    .eq('id', jobId)
    .select()
    .single();

  if (error) {
    console.error("Error updating job:", error);
    throw error;
  }

  return data;
};

// ---- Delete Job ----
export const deleteJob = async (jobId) => {
  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', jobId);

  if (error) {
    console.error("Error deleting job:", error);
    throw error;
  }
};

// ---- Update Round Status & Parent Job Status ----
export const updateRound = async (jobId, roundId, status) => {
  // 1. Update the round status
  const { error: roundErr } = await supabase
    .from('rounds')
    .update({ status })
    .eq('id', roundId);

  if (roundErr) {
    console.error("Error updating round:", roundErr);
    throw roundErr;
  }

  // 2. Fetch all rounds for this job to evaluate parent status
  const { data: rounds, error: roundsErr } = await supabase
    .from('rounds')
    .select('*')
    .eq('job_id', jobId)
    .order('sort_order', { ascending: true });

  if (roundsErr) {
    console.error("Error fetching rounds for status check:", roundsErr);
    throw roundsErr;
  }

  const allPassed = rounds.every(r => r.status === 'passed');
  const anyFailed = rounds.some(r => r.status === 'failed');

  // 3. Fetch current job
  const { data: job, error: jobErr } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (jobErr) {
    console.error("Error fetching job for status evaluation:", jobErr);
    throw jobErr;
  }

  let jobStatus = job.status;
  if (job.status === 'hired') {
    jobStatus = 'hired';
  } else if (anyFailed) {
    jobStatus = 'failed';
  } else if (allPassed) {
    jobStatus = 'offer';
  } else {
    jobStatus = 'active';
  }

  // 4. Update parent job status if changed
  if (jobStatus !== job.status) {
    const { error: updJobErr } = await supabase
      .from('jobs')
      .update({ status: jobStatus })
      .eq('id', jobId);
    
    if (updJobErr) {
      console.error("Error updating job parent status:", updJobErr);
      throw updJobErr;
    }
  }

  return {
    ...job,
    status: jobStatus,
    rounds
  };
};

// ---- Add Custom Round ----
export const addRound = async (jobId, name) => {
  // 1. Get count of current rounds to establish sort_order
  const { data: rounds, error: countErr } = await supabase
    .from('rounds')
    .select('sort_order')
    .eq('job_id', jobId);

  if (countErr) {
    console.error("Error determining sort order:", countErr);
    throw countErr;
  }

  const nextOrder = (rounds?.length || 0) + 1;

  // 2. Insert new round
  const { data: newRound, error: insErr } = await supabase
    .from('rounds')
    .insert([{ job_id: jobId, name, status: 'pending', sort_order: nextOrder }])
    .select()
    .single();

  if (insErr) {
    console.error("Error inserting custom round:", insErr);
    throw insErr;
  }

  return newRound;
};

// ---- Delete Round ----
export const deleteRound = async (jobId, roundId) => {
  const { error } = await supabase
    .from('rounds')
    .delete()
    .eq('id', roundId);

  if (error) {
    console.error("Error deleting custom round:", error);
    throw error;
  }
};

// ---- Mark Hired ----
export const markHired = async (jobId) => {
  return await updateJob(jobId, { status: 'hired' });
};

// ---- Admin Dashboard Data ----
export const getAdminData = async () => {
  // 1. Fetch public profiles
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (pErr) {
    console.error("Error fetching profiles for admin:", pErr);
    throw pErr;
  }

  // 2. Fetch all jobs with nested rounds
  const { data: jobs, error: jErr } = await supabase
    .from('jobs')
    .select(`
      *,
      rounds (*)
    `);

  if (jErr) {
    console.error("Error fetching jobs for admin:", jErr);
    throw jErr;
  }

  // 3. Map nested rounds and match jobs to profiles
  const mappedUsers = (profiles || []).map(p => {
    const userJobs = (jobs || []).filter(j => j.user_id === p.id).map(j => ({
      ...j,
      rounds: (j.rounds || []).sort((a, b) => a.sort_order - b.sort_order)
    }));

    return {
      ...p,
      jobs: userJobs
    };
  });

  return {
    users: mappedUsers,
    totalJobs: jobs?.length || 0,
    totalHired: jobs?.filter(j => j.status === 'hired').length || 0,
    totalOffers: jobs?.filter(j => j.status === 'offer').length || 0,
  };
};

// ---- Delete User Account & Cascade Data ----
export const deleteUser = async (userId) => {
  // Since we have foreign key cascade delete defined on the database level,
  // deleting the public profile record automatically wipes out their jobs and rounds instantly!
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (error) {
    console.error("Error deleting user profile:", error);
    throw error;
  }
};
