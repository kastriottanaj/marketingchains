/**
 * Single source of truth for the legal facts that appear across the site
 * (footer, Terms, Privacy, structured data). Edit them here, not in templates.
 */

export const company = {
  legalName: 'Marketing Chains LLC',
  jurisdiction: 'Delaware, USA',
  address: {
    street: '8 The Green STE R',
    city: 'Dover',
    region: 'DE',
    postalCode: '19901',
    country: 'US',
  },
  copyrightYear: 2026,
  /**
   * Shown on the legal pages. This is the contact address published on
   * visifluent.com/contact; set it to undefined to hide it.
   */
  contactEmail: 'info@visifluent.com' as string | undefined,
  /** Shown as "Last updated" on /terms and /privacy. Bump it when the text changes. */
  legalPagesUpdated: 'November 11, 2026',
} as const;

export const product = {
  name: 'Visifluent',
  domain: 'visifluent.com',
  url: 'https://visifluent.com',
  /** The service's own legal and pricing pages, referenced from /terms and /privacy. */
  termsUrl: 'https://visifluent.com/terms',
  privacyUrl: 'https://visifluent.com/privacy',
  pricingUrl: 'https://visifluent.com/pricing',
  crawlerUrl: 'https://visifluent.com/bot',
} as const;

/** The person who runs the company, and the profiles linked from the Leadership section. */
export const founder = {
  name: 'Kastriot Tanaj',
  websiteUrl: 'https://kastriottanaj.com',
  websiteLabel: 'kastriottanaj.com',
  linkedinUrl: 'https://www.linkedin.com/in/seo-kastriot-tanaj/',
  linkedinLabel: 'linkedin.com/in/seo-kastriot-tanaj',
  communityName: 'AI SEO - Marketing Club',
  communityUrl: 'https://www.skool.com/ai-seo-marketing-club-6607',
  communityLabel: 'skool.com/ai-seo-marketing-club-6607',
} as const;

/** "8 The Green STE R, Dover, DE 19901" */
export const registeredAddress = `${company.address.street}, ${company.address.city}, ${company.address.region} ${company.address.postalCode}`;
