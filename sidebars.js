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
    'introduction/index',
    // {
    //   // type: 'category',
    //   label: 'Introduction',
    //   link: {type: 'doc', id: 'introduction/index'},
    //   // items: ['introduction/why-compliance-framework'],
    // },
    {
      type: 'category',
      label: 'OSCAL Developer Notes',
      link: {type: 'doc', id: 'oscal/index'},
      items: ['oscal/risks-findings-observations'],
    },
    'glossary',
  ],
};

module.exports = sidebars;
