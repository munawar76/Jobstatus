# 🚀 JobStatus — Premium Interactive Job Application Tracker

[![Vite](https://img.shields.www.net/badge/Vite-8.0-red?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)
[![React](https://img.shields.www.net/badge/React-19.0-blue?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![Supabase](https://img.shields.www.net/badge/Supabase-Database-emerald?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Framer Motion](https://img.shields.www.net/badge/Framer_Motion-Interactive-fuchsia?style=for-the-badge&logo=framer&logoColor=white)](https://animation.dev)

Welcome to **JobStatus**, a state-of-the-art interactive job tracking dashboard designed for modern software developers, interviewees, and recruiters. Combining a premium light-theme aesthetic inspired by *gethapply.com* with a real-time Postgres backend, JobStatus provides full transparency and dynamic management of your recruiting lifecycle.

🖥️ **Live Web Application:** [jobstatus.vercel.app](https://jobstatus.vercel.app/)

---

## ✨ Primary Features

### 📅 Candidate Trackers & Notion-Style Diary
* **Visual Progress Bars:** Instantly view how many interview stages you have passed or cleared (e.g., `2/3 passed`).
* **Interactive Custom Rounds:** Create tailored interview stages (e.g., *Technical Test*, *HR Screening*, *Director Sync*) with one click.
* **Auto-saving Interview Notes:** A Notion-style notes area on the candidate's active application panel that automatically debounces your typing and saves thoughts to Supabase after 800ms of inactivity, with a live cloud-saving status badge (`Saving...` ➔ `Saved to cloud`).

### 🛡️ Interactive Recruiter / Admin Dashboard (`/admin`)
* **Global Access & Deletions:** Admins can oversee all registered users, remove accounts, delete inactive applications, and track global user metrics.
* **Click-to-Cycle Pills:** Admins can click directly on any round status capsule to dynamically cycle its state (`Pending` ➔ `✓ Pass` ➔ `✕ Fail`) in real-time.
* **Candidate Thoughts Viewer:** Read exactly what the applicant wrote in their interview diary about what went right or wrong during the round.
* **Strict Cascade Failure Logic:** If *any* individual interview round is marked as failed, the overall job application is automatically flagged as **Failed** across the candidate dashboard and admin view.

### ⚡ Real-Time Full-Duplex Synchronization
* **WebSocket Streaming:** Powered by Supabase Realtime Postgres replication, the Admin Panel listens directly to database event triggers.
* **Zero Refresh Required:** Whenever a candidate signs up, creates an application, adds a custom round, or updates a note, the Admin Panel updates **instantly in milliseconds on the screen** with zero page refreshes!

---

## 🎨 Visual Design & Fluid Animations
Built with an **Awwwards-inspired modern layout**:
* **Morphing Floating Blobs:** Background surfaces feature three shifting, low-opacity organic liquid blobs animating their positioning and `border-radius` to feel dynamic and alive.
* **Diagonal Panning Grid:** A fine, high-fidelity grid system panning diagonally across the background to create deep premium spatial visual structures.
* **Awwwards Micro-Animations:** Stat cards lift gracefully on hover, glowing with a red gradient, and search bars expand smoothly using customized `cubic-bezier(0.16, 1, 0.3, 1)` transitions.

---

## 📊 Database Schema Architecture

```
 ┌────────────────┐         ┌────────────────┐         ┌────────────────┐
 │   profiles     │         │     jobs       │         │    rounds      │
 ├────────────────┤         ├────────────────┤         ├────────────────┤
 │ id (PK)        │────────>│ id (PK)        │────────>│ id (PK)        │
 │ email          │         │ user_id (FK)   │         │ job_id (FK)    │
 │ name           │         │ company        │         │ name           │
 │ created_at     │         │ role           │         │ status         │
 └────────────────┘         │ status         │         │ sort_order     │
                            │ notes          │         │ created_at     │
                            │ created_at     │         └────────────────┘
                            └────────────────┘
```

---

## ⚙️ Getting Started (Local Development)

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/munawar76/Jobstatus.git
   cd Jobstatus
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
4. Run the Vite development server locally:
   ```bash
   npm run dev
   ```

---

## 🗄️ Database Setup (SQL Schema)
Run this schema in your **Supabase SQL Editor** to establish the required tables, triggers, and realtime listeners:

```sql
-- 1. Create Profiles Table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Jobs Table
CREATE TABLE public.jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT DEFAULT 'active'::text NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Rounds Table
CREATE TABLE public.rounds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'pending'::text NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable Trigger for Automatic Profile Creation on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'User'),
    new.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Disable RLS or configure public SELECT permissions
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.rounds DISABLE ROW LEVEL SECURITY;

-- 6. Enable Realtime Replication
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rounds;
```

---

## 🚀 Pushing to Production (Vercel)
1. Fork or push this repository to your GitHub account.
2. Sign in to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import the `Jobstatus` repository.
4. Under **Environment Variables**, add:
   * `VITE_SUPABASE_URL`
   * `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy**. Vercel will host your application under a secure URL in seconds!

---

## 📄 License
This project is open-source and licensed under the [MIT License](LICENSE).
