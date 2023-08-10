/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docsSidebar: [
    'welcome',
    {
      type: 'category',
      label: 'Introduction',
      link: {type: 'doc', id: 'introduction/index'},
      items: ['introduction/why-argus'],
    },
    {
      type: 'category',
      label: 'Architecture',
      link: {type: 'doc', id: 'architecture/index'},
      items: [
        {
          type: 'category',
          label: 'Argus Core',
          link: {type: 'doc', id: 'architecture/core/index'},
          items: [
            'architecture/core/configuration-service', 
            'architecture/core/runtime-orchestrator'
          ],
        },
        {
          type: 'category',
          label: 'Assessment Runtime',
          link: {type: 'doc', id: 'architecture/assessment-runtime'},
          items: [
            'architecture/assessment-runtime/authentication',
            'architecture/assessment-runtime/configuration',
            'architecture/assessment-runtime/plugin-manager',
            'architecture/assessment-runtime/job-runner',
            'architecture/assessment-runtime/heartbeat',
            'architecture/assessment-runtime/results-collector',
          ],
        },
        'architecture/application-gateway',
        'architecture/event-bus',
        'architecture/core-erd',
        'architecture/core-diagrams',
      ],
    },
    'architecture/assessment-runtime/plugin-registry',
    'glossary',
  ],
};

module.exports = sidebars;
