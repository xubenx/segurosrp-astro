/** Public CNSF license. Name, cédula, type and validity only. */
export const CNSF_LICENSE_TEXT =
  'Agente de seguros autorizado por la CNSF — José Ramírez Barajas, Cédula H415872, Tipo A (Riesgos personales y familiares), vigente hasta 04/05/2029.';

export const CONTACT_EMAIL = 'michelle@segurosrp.com';

export const cnsfCredential = {
  '@type': 'EducationalOccupationalCredential',
  credentialCategory: 'license',
  name: 'Cédula de agente de seguros H415872',
  identifier: 'H415872',
  description: 'Tipo A (Riesgos personales y familiares), vigente hasta 04/05/2029.',
  expires: '2029-05-04',
  recognizedBy: {
    '@type': 'Organization',
    name: 'Comisión Nacional de Seguros y Fianzas',
    alternateName: 'CNSF',
  },
};

export const joseRamirezPerson = {
  '@type': 'Person',
  name: 'José Ramírez Barajas',
  jobTitle: 'Agente de seguros',
  worksFor: { '@id': 'https://segurosrp.com/#organization' },
  hasCredential: cnsfCredential,
};
