// The catalog landing page: every released CCF plugin, with its newest release and policy bundles.
// It renders src/data/catalog.json, which scripts/sync-catalog.mjs writes; edit that script, not
// the data. Each plugin links to its own versioned instance under /catalog/<plugin>.
import React, {type ReactNode} from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';
import catalog from '@site/src/data/catalog.json';

type Plugin = {
  id: string;
  label: string;
  repo: string;
  route: string;
  version: string;
  line: string;
  description: string;
  policies: {repo: string; version: string}[];
};

const plugins: Plugin[] = catalog.plugins;

function repoName(repo: string): string {
  return repo.split('/')[1];
}

export default function Catalog(): ReactNode {
  return (
    <Layout title="Catalog" description="Every CCF plugin, with its newest release and the policy bundles that work with it.">
      <main className="container margin-vert--lg">
        <Heading as="h1">Catalog</Heading>
        <p>
          Every released plugin of the Continuous Compliance Framework (CCF), with its newest release and the policy
          bundles that work with it. Open a plugin for its configuration, the evidence it collects and its policies
          catalog, in each of its version lines.
        </p>
        <table>
          <thead>
            <tr>
              <th>Plugin</th>
              <th>Latest version</th>
              <th>Policy bundles</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {plugins.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link to={`/${p.route}`}>{p.label}</Link>
                  <br />
                  <code>{repoName(p.repo)}</code>
                </td>
                <td>
                  <Link href={`https://github.com/${p.repo}/releases/tag/${p.version}`}>
                    <code>{p.version}</code>
                  </Link>
                </td>
                <td>
                  {p.policies.length === 0
                    ? 'None mapped yet'
                    : p.policies.map((b, i) => (
                        <React.Fragment key={b.repo}>
                          {i > 0 && <br />}
                          <Link href={`https://github.com/${b.repo}`}>
                            <code>{repoName(b.repo)}</code>
                          </Link>{' '}
                          <code>{b.version}</code>
                        </React.Fragment>
                      ))}
                </td>
                <td>{p.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </Layout>
  );
}
