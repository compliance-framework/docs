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
      items: ['introduction/what-is-argus', 'introduction/why-argus'],
    },
    {
      type: 'category',
      label: 'Architecture',
      link: {type: 'doc', id: 'architecture/index'},
      items: [
        'architecture/argus-core',
        'architecture/application-gateway',
        'architecture/event-bus',
        'architecture/assessment-runtime',
        'architecture/core-diagrams'
      ],
    },
  ],
};

module.exports = sidebars;
