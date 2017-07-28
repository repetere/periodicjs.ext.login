'use strict';
const path = require('path');
const hrline = require('../components/hrline');

module.exports = (periodic) => {
  const reactadmin = periodic.app.controller.extension.reactadmin;
  // console.log('`${reactadmin.manifest_prefix}api/oauth2async/signin?format=json`',
  // `${reactadmin.manifest_prefix}api/oauth2async/signin?format=json`);
  // console.log('reactadmin.manifest_prefix', reactadmin.manifest_prefix);
  const getContainerManifest = (entitytype) => {
    return {
      // [`${reactadmin.manifest_prefix}auth/reset/:token`]: {
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
                "children": [
                  {
                    "component": "Title",
                    "props": {
                      "style": {
                        "textAlign": "center"
                      }
                    },
                    "children": "Reset Password"
                  },
                  {
                    "component": "ResponsiveForm",
                    asyncprops: {
                      formdata: [ 'tokendata', 'data', 'user' ]
                    },
                    "props": {
                      "cardForm": true,
                      // cardFormTitle:'Register',
                      "cardFormProps": {
                        "isFullwidth": true,
                      },
                      onSubmit: {
                        url: '/auth/reset/:token',
                        params: [
                          {
                            key: ':token',
                            val: 'token',
                          }
                        ],
                        options: {
                          method: 'POST',
                        },
                        success: {
                          notification: {
                            text: 'Password reset successfully',
                            timeout: 4000,
                            type: 'success',
                          },
                        },
                        successCallback: 'func:this.props.reduxRouter.push',
                        successProps: '/auth/login',
                      },
                      hiddenFields: [
                        {
                          form_name: 'token',
                          form_val: 'token'
                        },
                        {
                          form_name: 'entitytype',
                          form_static_val: entitytype||reactadmin.settings.login.options.headers.entitytype
                        },
                      ],
                      'validations': [
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
                            disabled: true,
                            // "submitOnEnter": true,
                            "passProps": {
                              "type": "email",
                              state: 'isDisabled',
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
                              "value": "Reset",
                              // "placeholder": "Remember Me",
                              "name": "reset",
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
        tokendata: `/auth/asyncreset/:token?format=json&entitytype=${entitytype||reactadmin.settings.login.options.headers.entitytype}`,
      },
      'pageData': {
        'title': `Reset Password | ${reactadmin.settings.name}`,
        'navLabel': 'Reset Password',
      },
      "onFinish": "render"
    };
  }

  return {
    containers: {
      '/auth/reset/:token': getContainerManifest(),
      '/auth/reset/:token/user': getContainerManifest('user'),
    },
  };
};