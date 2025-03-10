import { COLLECTIONS } from './firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

const DOMAIN = 'https://bilo.fi';

const PUBLIC_ROUTES = [
  {
    path: '/',
    priority: 1.0,
    changefreq: 'daily'
  },
  {
    path: '/search',
    priority: 0.9,
    changefreq: 'daily'
  },
  {
    path: '/login',
    priority: 0.5,
    changefreq: 'monthly'
  },
  {
    path: '/register',
    priority: 0.5,
    changefreq: 'monthly'
  }
];

export async function generateSitemap(): Promise<string> {
  try {
    // Get all verified vendors
    const vendorsQuery = query(
      collection(db, COLLECTIONS.VENDORS),
      where('verified', '==', true)
    );
    const vendorsSnapshot = await getDocs(vendorsQuery);
    const vendors = vendorsSnapshot.docs.map(doc => ({
      id: doc.id,
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    }));

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  ${PUBLIC_ROUTES.map(route => `
  <url>
    <loc>${DOMAIN}${route.path}</loc>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
    <xhtml:link rel="alternate" hreflang="fi" href="${DOMAIN}${route.path}" />
  </url>`).join('')}
  ${vendors.map(vendor => `
  <url>
    <loc>${DOMAIN}/vendor/${vendor.id}</loc>
    <lastmod>${vendor.updatedAt.toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="fi" href="${DOMAIN}/vendor/${vendor.id}" />
  </url>`).join('')}
</urlset>`;

    return sitemap.trim();
  } catch (error) {
    console.error('Error generating sitemap:', error);
    throw error;
  }
}
