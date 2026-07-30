/* ─── Single source of truth for SEO / site identity ───
   When you buy a domain, change SITE_URL here and rebuild.
   Everything downstream (canonicals, OG tags, sitemap, robots,
   structured data, prerendered route meta) derives from this file. */

export const SITE_URL = 'https://www.harshilpatel.co.in';

export const SITE_NAME = 'Harshil Patel';
export const DEFAULT_TITLE = 'Harshil Patel | Software Engineer | IIIT Vadodara';
export const DEFAULT_DESCRIPTION =
  'Harshil Patel is a software engineer and B.Tech student at IIIT Vadodara who builds production web apps, mobile apps, and AI tools.';
/* JPEG on purpose — LinkedIn and several other scrapers won't render a WebP
   social card. Regenerate with `npm run og` after changing name/tagline. */
export const OG_IMAGE = '/og-image.jpg';
export const LOCALE = 'en_US';

export const AUTHOR = {
  name: 'Harshil Patel',
  alternateName: ['guywithblack350', 'guy with black 350', 'the guy with black 350'],
  email: '1080patelharshil@gmail.com',
  jobTitle: 'Software Engineer',
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
