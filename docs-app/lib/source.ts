import { loader } from 'fumadocs-core/source';
import { docs } from 'collections/server';

// basePath '/docs' is added by Next.js, so page URLs here are relative to it.
export const source = loader({
  baseUrl: '/',
  source: docs.toFumadocsSource(),
});
