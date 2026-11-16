// Curated: groups the UI docs the way the UI's own sidebar does (This System, Global).
// Link items point at a section of a page that already appears in the other group.
export default {
  main: [
    "index",
    "navigation",
    "configuration",
    {
      "type": "category",
      "label": "This System",
      "collapsed": false,
      "items": [
        "features/evidence",
        "features/controls",
        "features/risks",
        {
          "type": "link",
          "label": "Workflow instances",
          "href": "/ui/next/features/workflows#run-a-workflow-for-a-system"
        },
        "features/systems"
      ]
    },
    {
      "type": "category",
      "label": "Global",
      "collapsed": false,
      "items": [
        {
          "type": "link",
          "label": "Global evidence",
          "href": "/ui/next/features/evidence#global-evidence"
        },
        {
          "type": "link",
          "label": "Compliance Map",
          "href": "/ui/next/features/controls#follow-the-compliance-map"
        },
        "features/workflows",
        "features/control-definitions",
        "features/administration"
      ]
    },
    "release-notes"
  ],
};
