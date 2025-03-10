import type { Vendor, Service, Appointment } from '../types/database';

export function generateVendorStructuredData(vendor: Vendor, services?: Service[], reviews?: Appointment[]) {
  // Base LocalBusiness/CarWash data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'CarWash'],
    '@id': `https://bilo.fi/vendor/${vendor.id}`,
    name: vendor.businessName,
    description: vendor.description || undefined,
    url: `https://bilo.fi/vendor/${vendor.id}`,
    telephone: vendor.phone || undefined,
    email: vendor.email || undefined,
    priceRange: '€€',
    image: vendor.logoImage || vendor.coverImage || undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: vendor.address || undefined,
      addressLocality: vendor.city || undefined,
      postalCode: vendor.postalCode || undefined,
      addressCountry: 'FI'
    }
  };

  // Add geo coordinates if available
  if (vendor.location) {
    structuredData.geo = {
      '@type': 'GeoCoordinates',
      latitude: vendor.location.lat,
      longitude: vendor.location.lng
    };
  }

  // Add opening hours
  const daysMap = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  };

  const openingHoursSpecification = Object.entries(vendor.operatingHours).map(([day, hours]) => {
    if (hours.open === 'closed' && hours.close === 'closed') return null;
    if (hours.open === '00:00' && hours.close === '23:59') {
      return {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: daysMap[day as keyof typeof daysMap],
        opens: '00:00',
        closes: '24:00'
      };
    }
    return {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: daysMap[day as keyof typeof daysMap],
      opens: hours.open,
      closes: hours.close
    };
  }).filter(Boolean);

  if (openingHoursSpecification.length > 0) {
    structuredData.openingHoursSpecification = openingHoursSpecification;
  }

  // Add rating if available
  if (vendor.rating && vendor.ratingCount) {
    structuredData.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: vendor.rating,
      ratingCount: vendor.ratingCount,
      bestRating: 5,
      worstRating: 1
    };
  }

  // Add services if available
  if (services?.length) {
    structuredData.hasOfferCatalog = {
      '@type': 'OfferCatalog',
      name: 'Autopesupalvelut',
      itemListElement: services.map(service => ({
        '@type': 'Service',
        name: service.name,
        description: service.description,
        offers: {
          '@type': 'Offer',
          price: service.price,
          priceCurrency: 'EUR',
          availability: service.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          validFrom: service.createdAt?.toISOString()
        }
      }))
    };
  }

  // Add reviews if available
  if (reviews?.length) {
    const validReviews = reviews.filter(review => review.feedback);
    if (validReviews.length > 0) {
      structuredData.review = validReviews.map(review => ({
        '@type': 'Review',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: review.feedback!.rating,
          bestRating: 5,
          worstRating: 1
        },
        author: {
          '@type': 'Person',
          name: `${review.customerDetails.firstName} ${review.customerDetails.lastName.charAt(0)}.`
        },
        datePublished: review.feedback!.createdAt.toISOString(),
        reviewBody: review.feedback!.comment
      }));
    }
  }

  return structuredData;
}
