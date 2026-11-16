// The page of one OpenAPI spec (src/plugins/openapi-reference.ts). Redoc only runs in the browser:
// it downloads the display copy of the spec from `specUrl` and renders it there, and the build only
// writes the shell. The download button serves the committed spec, `downloadUrl`.
import React, {lazy, Suspense, type ReactNode} from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Layout from '@theme/Layout';
import styles from './styles.module.css';

// A separate chunk, loaded only on reference pages.
const RedocStandalone = lazy(() => import('redoc').then((m) => ({default: m.RedocStandalone})));

type Props = {
  specUrl: string;
  downloadUrl: string;
  meta: {title: string; maxDepth: number; downloadName: string};
};

export default function ApiReference({specUrl, downloadUrl, meta}: Props): ReactNode {
  const loading = <p className={styles.loading}>Loading the API reference…</p>;
  const options = {
    // Keep Redoc's menu and headings below the sticky navbar.
    scrollYOffset: '.navbar',
    theme: {colors: {primary: {main: '#2e8555'}}},
    downloadUrls: [{title: 'Download', url: downloadUrl}],
    downloadFileName: meta.downloadName,
  };
  return (
    <Layout title={meta.title} description={`${meta.title}: every endpoint, with its parameters and responses.`}>
      <main className={styles.reference}>
        <p className={styles.note}>
          Deeply nested schemas are collapsed: past {meta.maxDepth} levels, a schema shows only its name.{' '}
          <a href={downloadUrl} download={meta.downloadName}>
            Download the spec
          </a>{' '}
          for the full detail.
        </p>
        <BrowserOnly fallback={loading}>
          {() => (
            <Suspense fallback={loading}>
              <RedocStandalone specUrl={specUrl} options={options} />
            </Suspense>
          )}
        </BrowserOnly>
      </main>
    </Layout>
  );
}
