'use strict';
const path = require('path');
const hrline = require('../components/hrline');

module.exports = (periodic) => {
  const reactadmin = periodic.app.controller.extension.reactadmin;
  const getContainerManifest = (entitytype) => {
    return {
      // [`${reactadmin.manifest_prefix}auth/forgot`]: {
      "layout": {
        "component": "Hero",
        "props": {
          "size": "isFullheight"
        },
        "children": [ {
          "component": "HeroBody",
          "props": {},
          "children": [ {
            "component": "Container",
            "props": {},
            "children": [ {
              "component": "Columns",
              "children": [ {
                "component": "Column",
                "props": {
                  "size": "is3"
                }
              },
              {
                "component": "Column",
                "props": {},
                "children": [ {
                  "component": "Title",
                  "props": {
                    "style": {
                      "textAlign": "center"
                    }
                  },
                  "children": "Recover Password"
                },
                {
                  "component": "ResponsiveForm",
                  "props": {
                    "cardForm": true,
                    // cardFormTitle:'Sign In',
                    "cardFormProps": {
                      "isFullwidth": true,
                    },
                    onSubmit: {
                      url: '/auth/forgot',
                      // url: `${reactadmin.manifest_prefix}auth/forgot`,
                      options: {
                        method: 'POST',
                      },
                      success: {
                        notification: {
                          text: 'Password reset instructions were sent to your email address',
                          timeout: 4000,
                          type: 'success',
                        }
                      },
                    },
                    hiddenFields: [
                      {
                        form_name: 'entitytype',
                        form_static_val: entitytype||reactadmin.settings.login.options.headers.entitytype
                      },
                    ],
                    'validations': [
                      {
                        'name': 'email',
                        'constraints': {
                          'email': {
                            presence: {
                              message: '^Your email is required.',
                            },
                            'length': {
                              'minimum': 3,
                              'message': '^Your email is required.',
                            },
                          },
                        },
                      },
                    ],
                    "formgroups": [
                      {
                        "gridProps": {},
                        "formElements": [ {
                          "type": "text",
                          "label": "Email",
                          "name": "email",
                          "submitOnEnter": true,
                          "passProps": {
                            "type": "email"
                          },
                          "layoutProps": {
                            "horizontalform": true
                          }
                        }]
                      },
                      hrline,
                      {
                        "gridProps": {
                          style: {
                            justifyContent: 'center',
                          }
                        },
                        "formElements": [
                          {
                            "type": "submit",
                            "value": "Recover Password",
                            // "placeholder": "Remember Me",
                            "name": "recoverpassword",
                            "passProps": {
                              "color": "isPrimary"
                            },
                            "layoutProps": {
                              formItemStyle: {
                                justifyContent: 'center'
                              },
                              "horizontalform": true
                            }
                          },
                          {
                            "type": "layout",
                            value: {
                              component: 'FormHorizontal',
                              props: {
                                style: {
                                  justifyContent: 'center'
                                },
                              },
                              children: [
                                {
                                  component: 'ResponsiveButton',
                                  props: {
                                    onClick: 'func:this.props.reduxRouter.push',
                                    onclickProps: '/auth/login',
                                    // onclickProps:`${reactadmin.manifest_prefix}auth/login`,
                                    style: {
                                    },
                                    buttonProps: {
                                      // color: 'isPrimary',
                                    },
                                  },
                                  children: 'Login',
                                }
                              ]
                                    
                            },
                            "layoutProps": {
                              style: {
                                justifyContent: 'center'
                              },
                              // "horizontalform": true
                            }
                          }
                        ]
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
      'pageData': {
        'title': `Forgot Password | ${reactadmin.settings.name}`,
        'navLabel': 'Forgot Password',
      },
      "onFinish": "render"
    };
  };
  return {
    containers: {
      '/auth/forgot': getContainerManifest(),
      '/auth/forgot/user': getContainerManifest('user'),
    },
  };
};