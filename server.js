const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

async function getRemotiveJobs() {
  try {
    const res = await axios.get('https://remotive.com/api/remote-jobs?limit=100');
    return res.data.jobs.map(job => ({
      id: `remotive-${job.id}`,
      title: job.title,
      company_name: job.company_name,
      company_logo: job.company_logo,
      category: job.category,
      salary: job.salary || null,
      job_type: job.job_type,
      url: job.url,
      location: job.candidate_required_location || 'Remote',
      date: job.publication_date,
      source: 'Remotive'
    }));
  } catch (err) {
    console.log('Remotive failed:', err.message);
    return [];
  }
}

async function getMuseJobs() {
  try {
    const pages = [1,2,3,4,5,6,7,8,9,10];
    const requests = pages.map(p =>
      axios.get(`https://www.themuse.com/api/public/jobs?page=${p}&descending=true`)
    );
    const responses = await Promise.allSettled(requests);
    const allJobs = responses
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value.data.results || []);
    return allJobs.map(job => ({
      id: `muse-${job.id}`,
      title: job.name,
      company_name: job.company.name,
      company_logo: null,
      category: job.categories?.[0]?.name || 'General',
      salary: null,
      job_type: job.levels?.[0]?.name || 'Full-time',
      url: job.refs.landing_page,
      location: job.locations?.[0]?.name || 'Remote',
      date: job.publication_date,
      source: 'The Muse'
    }));
  } catch (err) {
    console.log('The Muse failed:', err.message);
    return [];
  }
}

async function getArbeitnowJobs() {
  try {
    const pages = [1,2,3,4,5,6,7,8,9,10];
    const requests = pages.map(p =>
      axios.get(`https://www.arbeitnow.com/api/job-board-api?page=${p}`)
    );
    const responses = await Promise.allSettled(requests);
    const allJobs = responses
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value.data.data || []);
    return allJobs.map(job => ({
      id: `arbeitnow-${job.slug}`,
      title: job.title,
      company_name: job.company_name,
      company_logo: null,
      category: job.tags?.[0] || 'General',
      salary: null,
      job_type: job.job_types?.[0] || 'Full-time',
      url: job.url,
      location: job.location || 'Remote',
      date: job.created_at,
      source: 'Arbeitnow'
    }));
  } catch (err) {
    console.log('Arbeitnow failed:', err.message);
    return [];
  }
}

async function getHimalayasJobs() {
  try {
    const offsets = [0,20,40,60,80,100,120,140,160,180];
    const requests = offsets.map(offset =>
      axios.get(`https://himalayas.app/jobs/api?limit=20&offset=${offset}`)
    );
    const responses = await Promise.allSettled(requests);
    const allJobs = responses
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value.data.jobs || []);
    return allJobs.map(job => ({
      id: `himalayas-${job.slug}`,
      title: job.title,
      company_name: job.companyName,
      company_logo: job.companyLogo || null,
      category: job.categories?.[0] || 'General',
      salary: job.salary || null,
      job_type: job.jobType || 'Full-time',
      url: job.applicationLink || job.url,
      location: job.locationRestrictions?.[0] || 'Remote',
      date: job.createdAt,
      source: 'Himalayas'
    }));
  } catch (err) {
    console.log('Himalayas failed:', err.message);
    return [];
  }
}

app.get('/api/jobs', async (req, res) => {
  try {
    console.log('⏳ Fetching from all sources...');
    const [remotive, muse, arbeitnow, himalayas] = await Promise.all([
      getRemotiveJobs(),
      getMuseJobs(),
      getArbeitnowJobs(),
      getHimalayasJobs()
    ]);
    const allJobs = [...remotive, ...muse, ...arbeitnow, ...himalayas];
    console.log(`✅ Remotive: ${remotive.length}`);
    console.log(`✅ The Muse: ${muse.length}`);
    console.log(`✅ Arbeitnow: ${arbeitnow.length}`);
    console.log(`✅ Himalayas: ${himalayas.length}`);
    console.log(`🎯 TOTAL: ${allJobs.length} jobs`);
    res.json(allJobs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

app.listen(3000, () => {
  console.log('✅ Server running on http://localhost:3000');
});