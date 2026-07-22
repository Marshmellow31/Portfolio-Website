/* ─── Single source of truth for SEO / site identity ───
   When you buy a domain, change SITE_URL here and rebuild.
   Everything downstream (canonicals, OG tags, sitemap, robots,
   structured data, prerendered route meta) derives from this file. */

export const SITE_URL = 'https://design-lab-portfolio.vercel.app';

export const SITE_NAME = 'Harshil Patel';
export const DEFAULT_TITLE = 'Harshil Patel | Full-Stack Developer & Content Creator';
export const DEFAULT_DESCRIPTION =
  'Full-stack developer and B.Tech student at IIIT Vadodara. Builds production web apps, mobile apps, and AI tools. Content creator @guywithblack350 with 22M+ views.';
export const OG_IMAGE = '/og-image.webp';
export const LOCALE = 'en_US';

export const AUTHOR = {
  name: 'Harshil Patel',
  alternateName: ['guywithblack350', 'guy with black 350', 'the guy with black 350'],
  email: '1080patelharshil@gmail.com',
  jobTitle: 'Full-Stack Developer',
  alumniOf: 'IIIT Vadodara',
  sameAs: [
    'https://github.com/Marshmellow31',
    'https://linkedin.com/in/harshil-patel-5a7373333',
    'https://www.instagram.com/harshil_3105_/',
    'https://www.instagram.com/guywithblack350/',
  ],
  knowsAbout: [
    'React', 'TypeScript', 'Node.js', 'Firebase', 'Kotlin',
    'Android Development', 'AI APIs', 'Three.js', 'Web Development',
  ],
};
