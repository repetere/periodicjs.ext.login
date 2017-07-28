'use strict';
module.exports = (periodic) => {
  let reactadmin = periodic.app.controller.extension.reactadmin;
  return {
    "wrapper": {
      "style": {}
    },
    "container": {
      "style": {}
    },
    "layout": {
      "component": "Menu",
      "props": {
        "style": {}
      },
      "children": [
        {
          component: "SubMenuLinks",
          children: [
            {
              "component": "MenuLabel",
              "children": "Login"
            },
            {
              "component": "MenuAppLink",
              "props": {
                "href": `${reactadmin.manifest_prefix}extension/oauth2server/standard/clients`,
                "label": "OAUTH2 Clients",
                "id": "oauth2server-clients"
              }
            },
            // login
            // register
            // forgot password
          ],
        },
      ]
    }
  };
};