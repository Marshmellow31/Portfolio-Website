import snapshot from './instagram-snapshot.json' with { type: 'json' };
import { SITE_URL } from '../../site.config.mjs';
import { selectedWork } from './portfolio.js';

// Current headline confirmed by the creator on 2026-10-10.
// The dated reel audit remains separate from this updated lifetime total.
export const creatorViewsMinimum = 70_000_000;
export const creatorViewsUpdatedAt = '2026-10-10';
export const creatorHeadlineViewsLabel = '70M+';
export const creatorViewsLabel = '70 million+ views';
export const creativeDescription = `Harshil Patel’s automotive creator portfolio as @guywithblack350: ${creatorViewsLabel}, top reels, and brand collaborations.`;
export const projectsDescription = `${selectedWork.length} projects across personal products, academic work, research, internships, and client work — payments, databases, simulations, PWAs, native Android, embedded hardware, and AI tools, each with a full case study.`;
export const creatorSnapshot = snapshot;
export const raceDescription = 'Race against local AI rivals on Ridge Grand Prix or slide through Harbour Drift Complex in a browser game built with React Three Fiber.';

// These pages describe portfolio work; they do not advertise a price or offer.
export function projectSchema(project) {
  return {
    '@type': 'CreativeWork',
    name: project.title,
    description: project.description,
    url: `${SITE_URL}/projects/${project.slug}`,
    genre: project.type,
    keywords: project.stack.join(', '),
    author: { '@type': 'Person', '@id': `${SITE_URL}/#person`, name: 'Harshil Patel', url: `${SITE_URL}/` },
  };
}
