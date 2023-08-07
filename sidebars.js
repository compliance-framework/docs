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
        'architecture/argus-core',
        'architecture/assessment-runtime',
        'architecture/application-gateway',
        'architecture/event-bus',
        'architecture/core-diagrams'
      ],
    },
  ],
};

module.exports = sidebars;
