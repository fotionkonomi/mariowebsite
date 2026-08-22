/* ============================================================
   Everything about Marios that appears on the site lives here.
   Change it once, it changes everywhere.
   ============================================================ */
export const site = {
  name: 'Marios Konomis',
  role: '3D Artist',
  location: 'Athens, Greece',

  // TODO: replace with Marios's real address before going live.
  email: 'CHANGE-ME@example.com',

  artstation: 'https://www.artstation.com/marioskonomis13',

  availability: 'Available for freelance and full-time work.',

  // Set to '/cv.pdf' once that file has been placed in the public/ folder.
  // While it is null, no CV link is shown anywhere — nothing breaks.
  cv: null as string | null,

  // Shown in the footer. Add or remove freely.
  links: [
    { label: 'ArtStation', href: 'https://www.artstation.com/marioskonomis13' },
  ],

  // Shown on the About page.
  skills: [
    '3D Modeling',
    'Digital Sculpting',
    '3D Printing',
    'Architectural Visualization',
    'PBR Texturing',
    '3D Animation',
  ],
  software: [
    '3ds Max',
    'ZBrush',
    'Rhinoceros',
    'Substance 3D Painter',
    'Unreal Engine',
    'Photoscan',
    'Photoshop',
    'After Effects',
  ],
};
