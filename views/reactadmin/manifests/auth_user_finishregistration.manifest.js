'use strict';
const path = require('path');

module.exports = (periodic) => {
  let reactadmin = periodic.app.controller.extension.reactadmin;
  // console.log('`${reactadmin.manifest_prefix}api/oauth2async/signin?format=json`',
  // `${reactadmin.manifest_prefix}api/oauth2async/signin?format=json`);
  // console.log('reactadmin.manifest_prefix', reactadmin.manifest_prefix);
  return {
    containers: {
      [`${reactadmin.manifest_prefix}auth/user/finishregistration`]: {
        "layout": {
          "component": "Hero",
          "props": {
            "size": "isFullheight"
          },
          "children": [{
            "component": "HeroBody",
            "props": {},
            "children": [{
              "component": "Container",
              "props": {},
              "children": [{
                "component": "Columns",
                "children": [{
                    "component": "Column",
                    "props": {
                      "size": "is3"
                    }
                  },
                  {
                    "component": "Column",
                    "props": {},
                    "children": [{
                        "component": "Title",
                        "props": {
                          "style": {
                            "textAlign": "center"
                          }
                        },
                        "children": "PUBLIC SIGN IN"
                      },
                      {
                        "component": "ResponsiveForm",
                        "asyncprops": {
                          onSubmit: ['oauth2data', 'data']
                        },
                        "props": {
                          "cardForm": true,
                          "cardFormProps": {
                            "isFullwidth": true
                          },
                          // "onSubmit": "func:this.props.loginUser",
                          // onSubmit: {
                          //   url: '/api/oauth2async/signin',
                          //   options: {
                          //     method: 'POST',
                          //   },
                          //   successCallback: 'func:this.props.loginUser',
                          // },
                          "footergroups": [{
                            "gridProps": {},
                            "formElements": [{
                                "type": "submit",
                                "value": "Login",
                                "name": "login",
                                "passProps": {
                                  "style": {
                                    "color": "#1fc8db"
                                  }
                                },
                                "layoutProps": {}
                              },
                              {
                                "type": "submit",
                                "value": "Forgot Password",
                                "name": "forgot",
                                "passProps": {
                                  "style": {
                                    "color": "#69707a"
                                  }
                                },
                                "layoutProps": {}
                              },
                              {
                                "type": "submit",
                                "value": "New User",
                                "name": "register",
                                "passProps": {
                                  "style": {
                                    "color": "#69707a"
                                  }
                                },
                                "layoutProps": {}
                              }
                            ]
                          }],
                          "formgroups": [{
                              "gridProps": {},
                              "formElements": [{
                                "type": "text",
                                "label": "Username",
                                "name": "username",
                                "layoutProps": {
                                  "horizontalform": true
                                }
                              }]
                            },
                            {
                              "gridProps": {},
                              "formElements": [{
                                "type": "text",
                                "label": "Password",
                                "name": "password",
                                "submitOnEnter": true,
                                "passProps": {
                                  "type": "password"
                                },
                                "layoutProps": {
                                  "horizontalform": true
                                }
                              }]
                            },
                            {
                              "gridProps": {},
                              "formElements": [{
                                "type": "checkbox",
                                "label": "",
                                "placeholder": "Remember Me",
                                "name": "rememberme",
                                "passProps": {
                                  "type": "rememberme"
                                },
                                "layoutProps": {
                                  "horizontalform": true
                                }
                              }]
                            }
                          ]
                        }
                      }
                    ]
                  },
                  {
                    "component": "Column",
                    "props": {
                      "size": "is3"
                    }
                  }
                ]
              }]
            }]
          }]
        },
        "resources": {
          // oauth2data: `${reactadmin.manifest_prefix}api/oauth2async/signin?format=json`,
        },
        "onFinish": "render"
      }
    },
  };
};