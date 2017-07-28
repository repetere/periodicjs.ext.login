'use strict';
const path = require('path');
const hrline = require('../components/hrline');

module.exports = (periodic) => {
  let reactadmin = periodic.app.controller.extension.reactadmin;
  // console.log('`${reactadmin.manifest_prefix}api/oauth2async/signin?format=json`',
  // `${reactadmin.manifest_prefix}api/oauth2async/signin?format=json`);
  // console.log('reactadmin.manifest_prefix', reactadmin.manifest_prefix);
  const register_layout = (entitytype) => {
    return {
      layout: {
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
                "children": [
                  {
                    "component": "Title",
                    "props": {
                      "style": {
                        "textAlign": "center"
                      }
                    },
                    "children": "Register"
                  },
                  {
                    "component": "ResponsiveForm",
                    "props": {
                      "cardForm": true,
                      // cardFormTitle:'Register',
                      "cardFormProps": {
                        "isFullwidth": true,
                      },
                      onSubmit: {
                        url: `/auth/user/new`,
                        options: {
                          method: 'POST',
                        },
                        successCallback: 'func:this.props.loginUser',
                      },
                      hiddenFields: [
                        {
                          form_name: '__returnURL',
                          form_static_val: reactadmin.settings.auth.logged_in_homepage
                        },
                        {
                          form_name: 'entitytype',
                          form_static_val: entitytype||reactadmin.settings.login.options.headers.entitytype
                        },
                      ],
                      'validations': [
                        {
                          'name': 'username',
                          'constraints': {
                            'username': {
                              presence: {
                                message: '^Your username is required.',
                              },
                              'length': {
                                'minimum': 3,
                                'message': '^Your username is required.',
                              },
                            },
                          },
                        },
                        {
                          'name': 'password',
                          'constraints': {
                            'password': {
                              presence: {
                                message: '^Your username is required',
                              },
                              'length': {
                                'minimum': 8,
                                'message': '^Your password is too short',
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
                            "layoutProps": {
                              // "horizontalform": true
                            }
                          }]
                        },
                        {
                          "gridProps": {},
                          "formElements": [ {
                            "type": "text",
                            "label": "Username",
                            "name": "username",
                            "layoutProps": {
                              // "horizontalform": true
                            }
                          }]
                        },
                        {
                          "gridProps": {},
                          "formElements": [ {
                            "type": "text",
                            "label": "Password",
                            "name": "password",
                            // "submitOnEnter": true,
                            "passProps": {
                              "type": "password"
                            },
                            "layoutProps": {
                              // "horizontalform": true
                            }
                          }]
                        },
                        {
                          "gridProps": {},
                          "formElements": [ {
                            "type": "text",
                            "label": "Confirm password",
                            "name": "passwordconfirm",
                            "submitOnEnter": true,
                            "passProps": {
                              "type": "password"
                            },
                            "layoutProps": {
                              // "horizontalform": true
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
                              "value": "Register",
                              // "placeholder": "Remember Me",
                              "name": "register",
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
                                      onclickProps: `/auth/login/${(entitytype)?entitytype:''}`,
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
                                formItemStyle: {
                                  justifyContent: 'center'
                                },
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
        'title': `Register | ${reactadmin.settings.name}`,
        'navLabel': 'Register',
      },
      "onFinish": "render"
    };
  };
    
  return {
    containers: {
      '/auth/user/new': register_layout(),
      '/auth/user/register': register_layout(),
      '/auth/user/newuser': register_layout('user'),
    },
  };
};